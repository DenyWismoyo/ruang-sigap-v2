const fs = require('fs');
const path = require('path');

const triggersPath = path.join(__dirname, 'src', 'triggers', 'index.ts');
let code = fs.readFileSync(triggersPath, 'utf8');

// Insert DB_TARGET variable
code = code.replace(
    'import { db, storage, REGION } from "../config/firebase";',
    'import { db, storage, REGION } from "../config/firebase";\n\nconst DB_TARGET = process.env.FIRESTORE_DATABASE || "database-siyap-dev";\n'
);

// Replace hardcoded "database-siyap" in triggers
code = code.replace(/database:\s*"database-siyap"/g, 'database: DB_TARGET');

fs.writeFileSync(triggersPath, code);
console.log("Triggers updated.");
