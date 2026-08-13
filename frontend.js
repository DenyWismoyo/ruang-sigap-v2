const fs = require('fs');
const path = require('path');

function walk(d) {
    fs.readdirSync(d).forEach(f => {
        let p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let c = fs.readFileSync(p, 'utf8');
            if (c.includes('httpsCallable(')) {
                c = c.replace(/import \{ getFunctions, httpsCallable \} from ['"]firebase\/functions['"];?/g, 'import { callCloudFunction } from "@/lib/firebase";');
                c = c.replace(/import \{ httpsCallable \} from ['"]firebase\/functions['"];?/g, 'import { callCloudFunction } from "@/lib/firebase";');
                c = c.replace(/httpsCallable\([^,]+,\s*['"](.*?)['"]\)/g, 'callCloudFunction("$1")');
                fs.writeFileSync(p, c);
                console.log('Updated ' + p);
            }
        }
    });
}
walk('src');
