// Lokasi: V.3/src/lib/whatsapp.ts

// Ini adalah fungsi SIMULASI untuk mencatat notifikasi ke konsol.
// Fungsi ini sengaja dirancang dengan 3 parameter agar sesuai dengan
// kebutuhan pengiriman notifikasi berbasis template di masa depan.

export async function sendWhatsAppNotification(to: string, templateName: string, templateParams: string[]) {
    // Pastikan nomor tujuan menggunakan format internasional tanpa '+' atau '0' di depan.
    const formattedTo = to.startsWith('0') ? '62' + to.substring(1) : to;

    const apiUrl = process.env.NEXT_PUBLIC_WA_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_WA_API_KEY;

    if (!apiUrl) {
        console.warn("[WhatsApp Mock] API URL belum diatur di .env. Menggunakan console log.");
        console.log(`[WA] To: ${formattedTo}, Template: ${templateName}, Params:`, templateParams);
        return Promise.resolve();
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                target: formattedTo,
                template: templateName,
                variables: templateParams
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gagal mengirim WA ke ${formattedTo}:`, errorText);
            return Promise.resolve(); // Non-blocking: biarkan proses aplikasi lanjut meski WA gagal
        }

        console.log(`Pesan WA berhasil dikirim ke ${formattedTo} (Template: ${templateName})`);
        return Promise.resolve();
    } catch (error) {
        console.error("Error memanggil API WhatsApp:", error);
        return Promise.resolve(); // Non-blocking
    }
}
