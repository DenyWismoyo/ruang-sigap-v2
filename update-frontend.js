const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Ensure getFunctionName is imported/available? 
        // No, we can just inline the check if process.env.NEXT_PUBLIC_FIRESTORE_DATABASE is "database-siyap-dev"
        // Wait, NEXT_PUBLIC_APP_ENV='dev' is better.
        // Actually, we can just export a wrapper `callCloudFunction` from `src/lib/firebase.js`.
    }
});
