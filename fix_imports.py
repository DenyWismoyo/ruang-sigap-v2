import os
import re

files_to_fix = [
    r"d:\DENY\project\ruang-sigap-v2\src\app\dashboard\(admin)\laporan-langganan\page.tsx",
    r"d:\DENY\project\ruang-sigap-v2\src\app\dashboard\(main)\surat\upload\page.tsx",
    r"d:\DENY\project\ruang-sigap-v2\src\app\dashboard\components\AutoHealButton.tsx",
    r"d:\DENY\project\ruang-sigap-v2\src\app\dashboard\components\DelegasiWidget.tsx"
]

for filepath in files_to_fix:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "import { getFunctions }" not in content and "getFunctions(" in content:
        # Find a good place to insert, like after the last import from firebase
        content = re.sub(r"(import {.*?db.*?} from '@/lib/firebase';)", r"\1\nimport { getFunctions } from 'firebase/functions';", content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Fixed getFunctions imports.")
