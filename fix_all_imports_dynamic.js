const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');

function getFolders(groupDir) {
    const fullPath = path.join(dashboardDir, groupDir);
    if (!fs.existsSync(fullPath)) return [];
    return fs.readdirSync(fullPath).filter(f => fs.statSync(path.join(fullPath, f)).isDirectory());
}

const mainFolders = getFolders('(main)');
const fungsionalFolders = getFolders('(fungsional)');
const adminFolders = getFolders('(admin)');

function getGroup(folderName) {
    if (mainFolders.includes(folderName)) return '(main)';
    if (fungsionalFolders.includes(folderName)) return '(fungsional)';
    if (adminFolders.includes(folderName)) return '(admin)';
    return null;
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = walk(dashboardDir);
let changedFilesCount = 0;

allFiles.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    
    // Match both single and double quotes
    // Match pattern: @/app/dashboard/FOLDER_NAME/
    const newContent = originalContent.replace(/(['"])@\/app\/dashboard\/([^/'"]+)\//g, (match, quote, folderName) => {
        const group = getGroup(folderName);
        if (group) {
            return `${quote}@/app/dashboard/${group}/${folderName}/`;
        }
        return match; // return original if no group matches
    });

    if (newContent !== originalContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed imports in: ${file.replace(__dirname, '')}`);
        changedFilesCount++;
    }
});

console.log(`\nCompleted! Fixed imports in ${changedFilesCount} files.`);
