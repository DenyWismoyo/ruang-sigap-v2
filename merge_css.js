const fs = require('fs');
const path = require('path');

const srcFile = 'D:\\Project\\ai-curation-app\\omnifit-ui\\globals.css';
const destFile = 'src\\app\\globals.css';

const srcContent = fs.readFileSync(srcFile, 'utf8');
const destContent = fs.readFileSync(destFile, 'utf8');

// append src content to dest content if it's not already there
if (!destContent.includes('OMNIFIT DESIGN SYSTEM')) {
    fs.writeFileSync(destFile, destContent + '\n\n' + srcContent, 'utf8');
    console.log('Merged globals.css successfully.');
} else {
    console.log('globals.css already contains Omnifit CSS.');
}
