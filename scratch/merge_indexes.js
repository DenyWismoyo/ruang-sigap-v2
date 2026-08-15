const fs = require('fs');

const current = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
const analyzed = JSON.parse(fs.readFileSync('scratch/analyzed_indexes.json', 'utf8'));

const allIndexes = [...current.indexes];

analyzed.indexes.forEach(newIdx => {
  // Check if it already exists
  const exists = allIndexes.find(existing => {
    if (existing.collectionGroup !== newIdx.collectionGroup) return false;
    if (existing.fields.length !== newIdx.fields.length) return false;
    
    // Sort fields by fieldPath for comparison
    const sortedExisting = [...existing.fields].sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
    const sortedNew = [...newIdx.fields].sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
    
    for (let i = 0; i < sortedExisting.length; i++) {
      if (sortedExisting[i].fieldPath !== sortedNew[i].fieldPath) return false;
      const existOrder = sortedExisting[i].order || sortedExisting[i].arrayConfig;
      const newOrder = sortedNew[i].order || sortedNew[i].arrayConfig;
      if (existOrder !== newOrder) return false;
    }
    return true;
  });

  if (!exists) {
    allIndexes.push(newIdx);
  }
});

fs.writeFileSync('firestore.indexes.json', JSON.stringify({
  indexes: allIndexes,
  fieldOverrides: current.fieldOverrides || []
}, null, 2));

console.log(`Merged indexes. Total indexes: ${allIndexes.length}`);
