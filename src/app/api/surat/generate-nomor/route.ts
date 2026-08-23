import { NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { opdId, formatConfigId, kodeKlasifikasi } = await req.json();
        
        if (!opdId) {
            return NextResponse.json({ error: 'opdId is required' }, { status: 400 });
        }

        const year = new Date().getFullYear().toString();
        const counterRef = adminDb!.collection('counters').doc(`${opdId}_${year}`);
        const opdConfigRef = adminDb!.collection('opdConfigs').doc(opdId);

        const result = await adminDb!.runTransaction(async (t: any) => {
            const configSnap = await t.get(opdConfigRef);
            if (!configSnap.exists) {
                throw new Error('OPD Config not found');
            }
            
            const configData = configSnap.data();
            const penomoranConfigs = configData?.penomoranConfigs || [];
            
            let formatConfig = null;
            if (formatConfigId) {
                formatConfig = penomoranConfigs.find((c: any) => c.id === formatConfigId);
            }
            
            if (!formatConfig) {
                formatConfig = penomoranConfigs.find((c: any) => c.isDefault);
            }
            
            if (!formatConfig) {
                throw new Error('Format penomoran belum dikonfigurasi oleh Admin OPD');
            }

            const counterSnap = await t.get(counterRef);
            let noUrut = 1;
            
            if (counterSnap.exists) {
                const counterData = counterSnap.data();
                noUrut = (counterData?.suratKeluar || 0) + 1;
            }
            
            // Increment the counter
            t.set(counterRef, {
                suratKeluar: noUrut,
                updatedAt: new Date()
            }, { merge: true });

            // Generate format
            const strNoUrut = noUrut.toString().padStart(4, '0');
            const strBulan = (new Date().getMonth() + 1).toString().padStart(2, '0');
            const strTanggal = new Date().getDate().toString().padStart(2, '0');
            const finalKlasifikasi = kodeKlasifikasi || formatConfig.kodeKlasifikasiLainnya || '000';

            // Ambil kode OPD jika diperlukan (kita asumsikan fallback dari string pertama opdId)
            let kodeOpd = 'OPD';
            if (configData?.branding?.namaAplikasi) {
                kodeOpd = configData.branding.namaAplikasi.substring(0, 5).toUpperCase();
            } else {
                kodeOpd = opdId.substring(0, 5).toUpperCase();
            }

            let generatedNumber = formatConfig.format || '';
            generatedNumber = generatedNumber.replace('{kode_klasifikasi}', finalKlasifikasi);
            generatedNumber = generatedNumber.replace('{no_urut}', strNoUrut);
            generatedNumber = generatedNumber.replace('{kode_opd}', kodeOpd); 
            generatedNumber = generatedNumber.replace('{tahun}', year);
            generatedNumber = generatedNumber.replace('{bulan}', strBulan);
            generatedNumber = generatedNumber.replace('{tanggal}', strTanggal);

            return { generatedNumber, noUrut, formatConfig };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Generate Nomor Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
