const fs = require('fs');
const path = require('path');

const dir = 'src/app/dashboard/poros/(main)/dokumen/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports
    content = content.replace(/import \{.*?DokumenFolder.*?\} from "@\/types";/, 'import { RepositoryItem } from "@/types";');
    
    // Replace types
    content = content.replace(/type RepositoryItemCombined =.*?;/g, 'type RepositoryItemCombined = RepositoryItem;');
    content = content.replace(/RepositoryItemCombined/g, 'RepositoryItem');
    
    // Replace property access
    content = content.replace(/\bitem\.type\b/g, 'item.tipe');
    content = content.replace(/\bitem \.type\b/g, 'item.tipe');
    
    // Replace casts
    content = content.replace(/\(item as DokumenLink\)\./g, 'item.');
    content = content.replace(/\(item as DokumenFolder\)\./g, 'item.');
    content = content.replace(/\(parent as DokumenFolder\)\./g, 'parent.');
    content = content.replace(/parent\.type/g, 'parent.tipe');

    content = content.replace(/namaFolder/g, 'nama');
    content = content.replace(/namaDokumen/g, 'nama');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed', f);
});
