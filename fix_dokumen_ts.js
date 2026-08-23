const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/dashboard/poros/(main)/dokumen/components/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/DokumenFolder, DokumenLink/g, 'RepositoryItem');
    content = content.replace(/DokumenFolder \| DokumenLink/g, 'RepositoryItem');
    content = content.replace(/type RepositoryItemCombined = [^\n]+;/g, 'type RepositoryItemCombined = RepositoryItem;');
    content = content.replace(/import \{ RepositoryItem \} from ["']@\/types["'];\n/g, ''); // in case of duplicate
    content = content.replace(/import \{ RepositoryItem, RepositoryItem \} from ["']@\/types["'];/g, 'import { RepositoryItem } from "@/types";');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
