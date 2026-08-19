const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'docs', 'panduan', 'BLUEPRINT-PENGETAHUAN-SISTEM.md');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace Paths
content = content.replace(/\/dashboard\/poros/g, '/dashboard');
content = content.replace(/\/poros\//g, '/');

// 2. Replace Terms
content = content.replace(/RUANG SIGAP/g, 'Sistem');
content = content.replace(/Ruang Sigap/g, 'Sistem');
content = content.replace(/SIGAP/g, 'Sistem');
content = content.replace(/Sigap/g, 'Sistem');
content = content.replace(/Poros/g, 'Sistem');
content = content.replace(/poros/g, 'sistem');

// 3. Make the intro more humanistic
// We will locate the intro manually or replace specific rigid phrases.
content = content.replace(
  /# RUANG SIGAP — BLUEPRINT PENGETAHUAN SISTEM/g, 
  '# PANDUAN PENGGUNAAN SISTEM'
);
content = content.replace(
  /## Dokumen Referensi Komprehensif untuk Pemahaman Mendalam/g, 
  '## Sahabat Digital Anda untuk Memahami Seluruh Fitur dengan Mudah'
);
content = content.replace(
  /Sistem \(Sistem Informasi Governansi & Administrasi Persuratan\) adalah platform manajemen persuratan digital yang dirancang khusus untuk Perangkat Daerah \(OPD\/SKPD\) di lingkungan Pemerintah Daerah Indonesia./g,
  'Sistem ini adalah platform manajemen persuratan digital cerdas yang diciptakan untuk mempermudah pekerjaan sehari-hari di instansi Anda. Kami merancangnya agar ramah pengguna dan sangat membantu produktivitas Anda.'
);

content = content.replace(/OPD\/SKPD/g, 'Instansi');
content = content.replace(/OPD/g, 'Instansi');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Rewrite successful.');
