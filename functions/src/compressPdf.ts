import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import { exec } from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

export const compressUploadedPdf = onObjectFinalized({
  memory: "1GiB",
  timeoutSeconds: 300, // Memberikan waktu hingga 5 menit untuk PDF besar
}, async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const metadata = event.data.metadata;

    // Hanya proses file PDF
    if (!contentType?.includes('pdf')) {
        return;
    }

    // Cegah infinite loop dengan mengecek metadata custom
    if (metadata && metadata.isCompressed === 'true') {
        console.log(`File ${filePath} sudah dikompresi sebelumnya.`);
        return;
    }

    // Hanya kompres file yang masuk ke direktori 'surat' atau 'surat_files'
    if (!filePath.startsWith('surat/') && !filePath.startsWith('surat_files/')) {
        return;
    }

    const bucket = getStorage().bucket(fileBucket);
    const fileName = path.basename(filePath);
    
    // Prefix dengan timestamp untuk menghindari tabrakan jika ada file kembar
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${fileName}`);
    const compressedFilePath = path.join(os.tmpdir(), `compressed_${Date.now()}_${fileName}`);

    try {
        console.log(`Memulai proses kompresi untuk ${filePath}...`);
        
        // 1. Download file ke temporary directory instance Cloud Functions
        await bucket.file(filePath).download({ destination: tempFilePath });

        // 2. Eksekusi Ghostscript
        // Ghostscript (gs) secara default terinstal di container Ubuntu Cloud Functions v2
        // dPDFSETTINGS=/screen menurunkan resolusi gambar ke 72dpi yang cocok untuk web/layar
        const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${compressedFilePath}" "${tempFilePath}"`;
        
        await execAsync(gsCommand);

        const originalStats = fs.statSync(tempFilePath);
        const compressedStats = fs.statSync(compressedFilePath);
        
        console.log(`Ukuran Asli: ${originalStats.size} bytes`);
        console.log(`Ukuran Kompresi: ${compressedStats.size} bytes`);

        // Jika ukuran file setelah dikompres ternyata lebih besar atau sama,
        // kita batalkan overwrite tapi tetap beri tanda agar tidak diloop.
        if (compressedStats.size >= originalStats.size) {
            console.log("Ukuran hasil kompresi lebih besar atau tidak signifikan. Mempertahankan file asli.");
            await bucket.file(filePath).setMetadata({
                metadata: {
                    isCompressed: 'true'
                }
            });
            return;
        }

        // 3. Upload ulang file yang sudah dikompres untuk mereplace file lama
        console.log(`Mengunggah file kompresi kembali ke ${filePath}...`);
        await bucket.upload(compressedFilePath, {
            destination: filePath,
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    isCompressed: 'true'
                }
            }
        });

        console.log(`Berhasil mengompresi dan mengganti ${filePath}`);

    } catch (error) {
        console.error(`Gagal mengompresi PDF ${filePath}:`, error);
        
        // Jika Ghostscript gagal (mungkin karena file corrupt atau gs tidak tersedia),
        // tandai file agar tidak diproses berulang kali.
        try {
            await bucket.file(filePath).setMetadata({
                metadata: {
                    isCompressed: 'true',
                    compressionFailed: 'true'
                }
            });
        } catch (metaErr) {
            console.error("Gagal mengatur metadata error", metaErr);
        }
    } finally {
        // 4. Cleanup file temporary untuk mencegah memory leak
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(compressedFilePath)) fs.unlinkSync(compressedFilePath);
    }
});
