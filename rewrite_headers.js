const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'docs', 'panduan', 'BLUEPRINT-PENGETAHUAN-SISTEM.md');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean up Intro (Pendahuluan)
content = content.replace(
  /Dokumen ini adalah \*\*sumber pengetahuan tunggal \(single knowledge source\)\*\* yang merangkum seluruh aspek sistem RUANG SIGAP.*/g,
  'Selamat datang di panduan sistem cerdas kami. Panduan ini dirancang sebagai **sumber rujukan utama** untuk membantu Anda memahami seluruh fitur, alur kerja, dan manfaat yang ada di dalam sistem. Kami menyusunnya agar semudah mungkin dipahami sehingga Anda dapat langsung mempraktikkannya untuk mempermudah pekerjaan sehari-hari.'
);

content = content.replace(
  /Dokumen ini adalah \*\*sumber pengetahuan tunggal \(single knowledge source\)\*\* yang merangkum seluruh aspek sistem —.*/g,
  'Selamat datang di panduan sistem cerdas kami. Panduan ini dirancang sebagai **sumber rujukan utama** untuk membantu Anda memahami seluruh fitur, alur kerja, dan manfaat yang ada di dalam sistem. Kami menyusunnya agar semudah mungkin dipahami sehingga Anda dapat langsung mempraktikkannya untuk mempermudah pekerjaan sehari-hari.'
);

// Fallback if the above doesn't match
content = content.replace(/RUANG SIGAP/g, 'Sistem');

// 2. Remove "BAGIAN X — " from headings
// Matches `# BAGIAN 1 — IDENTITAS & FILOSOFI SISTEM`
// Replaces with `# IDENTITAS & FILOSOFI SISTEM`
content = content.replace(/^# BAGIAN \d+\s*—\s*/gm, '# ');

// 3. Remove "Bagian X — " if any exist
content = content.replace(/^# Bagian \d+\s*—\s*/gm, '# ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Markdown rewrite successful.');
