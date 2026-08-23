const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/searchParams\.get/g, 'searchParams?.get');
    content = content.replace(/params\.id/g, 'params?.id');
    content = content.replace(/params\.formId/g, 'params?.formId');
    content = content.replace(/pathname\.startsWith/g, 'pathname?.startsWith');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
