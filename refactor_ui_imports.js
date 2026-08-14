const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/components');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(directoryPath);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    content = content.replace(/from\s+['"](?:\.\.\/)+utils\/cn['"]/g, "from '@/lib/utils'");
    content = content.replace(/from\s+['"](?:\.\.\/)+lib\/utils['"]/g, "from '@/lib/utils'");
    content = content.replace(/from\s+['"](?:\.\.\/)+utils\/formatters['"]/g, "from '@/lib/formatters'");

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        modifiedCount++;
    }
});

console.log(`Refactored utils imports in ${modifiedCount} files.`);
