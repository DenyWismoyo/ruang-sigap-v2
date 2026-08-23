const fs = require('fs');
const path = require('path');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getAllFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = getAllFiles(path.join(__dirname, 'src'));
const componentsDir = path.join(__dirname, 'src', 'components');
const components = allFiles.filter(f => f.startsWith(componentsDir) && (f.endsWith('.tsx') || f.endsWith('.ts')));

console.log(`Found ${components.length} components in src/components. Checking usage...`);

const unused = [];

for (const compPath of components) {
  const basename = path.basename(compPath, path.extname(compPath));
  if (basename === 'index' || basename === 'utils') continue; // skip index and utils
  
  let isUsed = false;
  for (const file of allFiles) {
    if (file === compPath) continue; // skip self
    if (file === path.join(componentsDir, 'index.ts')) continue; // skip the index file that exports everything!
    
    const content = fs.readFileSync(file, 'utf8');
    const regex = new RegExp(`\\b${basename}\\b`);
    if (regex.test(content)) {
      isUsed = true;
      break;
    }
  }
  
  if (!isUsed) {
    unused.push(compPath);
  }
}

console.log(`\nFound ${unused.length} completely unused components:`);
unused.forEach(p => console.log(p.replace(__dirname, '')));
