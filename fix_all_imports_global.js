const fs = require('fs');
const path = require('path');

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

const directoryPath = path.join(__dirname, 'src/app/dashboard');
const files = walkDir(directoryPath);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Fix relative paths to root src directories (context, lib, types)
    content = content.replace(/(['"])(?:\.\.\/)+context\//g, "$1@/context/");
    content = content.replace(/(['"])(?:\.\.\/)+lib\//g, "$1@/lib/");
    content = content.replace(/(['"])(?:\.\.\/)+types(['"])/g, "$1@/types$2");

    // Fix UI component paths
    content = content.replace(/(['"])@\/app\/dashboard\/components\/ui\//g, "$1@/components/ui/");

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file.replace(__dirname, '')}`);
        modifiedCount++;
    }
});

console.log(`Refactored general imports in ${modifiedCount} files.`);
