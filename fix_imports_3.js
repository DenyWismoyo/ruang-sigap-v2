const fs = require('fs');
const path = require('path');

const pageTsxPath = path.join(__dirname, 'src/app/dashboard/(main)/surat/[id]/page.tsx');
if (fs.existsSync(pageTsxPath)) {
    let content = fs.readFileSync(pageTsxPath, 'utf8');
    
    // Fix components imports
    content = content.replace(/from\s+'@\/app\/dashboard\/surat\/\[id\]\/components\//g, "from '@/app/dashboard/(main)/surat/[id]/components/");
    
    // Fix FormTugas import
    content = content.replace(/from\s+'@\/app\/dashboard\/tugas\/components\/FormTugas'/g, "from '@/app/dashboard/(main)/tugas/components/FormTugas'");

    fs.writeFileSync(pageTsxPath, content, 'utf8');
    console.log(`Updated ${pageTsxPath}`);
} else {
    console.log(`File not found: ${pageTsxPath}`);
}

const manualArchiveModalPath = path.join(__dirname, 'src/app/dashboard/(main)/surat/[id]/components/ManualArchiveModal.tsx');
if (fs.existsSync(manualArchiveModalPath)) {
    let content = fs.readFileSync(manualArchiveModalPath, 'utf8');
    content = content.replace(/from\s+'\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/types'/g, "from '@/types'");
    fs.writeFileSync(manualArchiveModalPath, content, 'utf8');
    console.log(`Updated ${manualArchiveModalPath}`);
}

const penerimaanDisposisiModalPath = path.join(__dirname, 'src/app/dashboard/(main)/surat/[id]/components/PenerimaanDisposisiModal.tsx');
if (fs.existsSync(penerimaanDisposisiModalPath)) {
    let content = fs.readFileSync(penerimaanDisposisiModalPath, 'utf8');
    content = content.replace(/from\s+'\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/types'/g, "from '@/types'");
    fs.writeFileSync(penerimaanDisposisiModalPath, content, 'utf8');
    console.log(`Updated ${penerimaanDisposisiModalPath}`);
}

console.log("Done fixing surat/[id] imports.");
