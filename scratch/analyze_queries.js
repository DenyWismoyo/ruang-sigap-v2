const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walkSync(srcDir);
const requiredIndexes = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find all query(...) blocks by finding 'query(' and balancing parentheses
  let idx = 0;
  while ((idx = content.indexOf('query(', idx)) !== -1) {
    let openCount = 1;
    let curr = idx + 6;
    while (openCount > 0 && curr < content.length) {
      if (content[curr] === '(') openCount++;
      else if (content[curr] === ')') openCount--;
      curr++;
    }
    
    const queryBlock = content.substring(idx, curr);
    
    // Extract collection name
    const colMatch = queryBlock.match(/collection\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]\s*\)/);
    if (!colMatch) {
      idx = curr;
      continue;
    }
    const collectionName = colMatch[1];
    
    // Extract wheres
    const whereMatches = [...queryBlock.matchAll(/where\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*/g)];
    const wheres = whereMatches.map(m => ({ field: m[1], op: m[2] }));
    
    // Extract orderBys
    const orderByMatches = [...queryBlock.matchAll(/orderBy\s*\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\s*\)/g)];
    const orderBys = orderByMatches.map(m => ({ field: m[1], dir: m[2] || 'asc' }));
    
    // Determine if index is needed
    // Need composite index if:
    // - array-contains/any + orderBy
    // - range/inequality + orderBy
    // - equality + orderBy
    // - multiple equality where one is array-contains (wait, multiple array-contains is invalid, but equality + array-contains is fine, might need index)
    // Firestore rule: If you have >1 where/orderBy field, and at least one is orderBy or array-contains or range, you usually need an index.
    
    const fields = [];
    wheres.forEach(w => {
      const order = ['array-contains', 'array-contains-any'].includes(w.op) ? 'CONTAINS' : 'ASCENDING';
      if (!fields.find(f => f.fieldPath === w.field)) fields.push({ fieldPath: w.field, order });
    });
    
    orderBys.forEach(o => {
      if (!fields.find(f => f.fieldPath === o.field)) {
        fields.push({ fieldPath: o.field, order: o.dir.toUpperCase() + 'ENDING' });
      } else {
        // Update to specific order if it was ASCENDING from where (though orderBy direction overrides)
        const f = fields.find(f => f.fieldPath === o.field);
        f.order = o.dir.toUpperCase() + 'ENDING';
      }
    });
    
    if (fields.length > 1 && (orderBys.length > 0 || fields.some(f => f.order === 'CONTAINS'))) {
      requiredIndexes.push({
        collectionGroup: collectionName,
        queryScope: 'COLLECTION',
        fields
      });
    }
    
    idx = curr;
  }
});

const uniqueIndexes = [];
const seenKeys = new Set();
requiredIndexes.forEach(idx => {
  const key = idx.collectionGroup + '|' + idx.fields.map(f => f.fieldPath + ':' + f.order).join('|');
  if (!seenKeys.has(key)) {
    seenKeys.add(key);
    uniqueIndexes.push(idx);
  }
});

console.log(JSON.stringify({ indexes: uniqueIndexes }, null, 2));
