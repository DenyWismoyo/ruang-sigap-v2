// Lokasi: src/lib/conflictUtils.ts
import { Surat, JadwalTempat } from '@/types';

export type CombinedAgendaItem = {
    id: string;
    type: 'surat' | 'internal';
    item: Surat | JadwalTempat;
    time: string;
    title: string;
    location: string;
    penerimaDisposisi?: string;
    disposisiStatus?: 'Sudah Didisposisi' | 'Belum Didisposikan';
};

/**
 * Helper untuk mengekstrak jam dan menit secara aman dari berbagai format string:
 * Contoh: "13:00", "13.00", "13:00 - 15:00", "13:00 WIB"
 */
function parseHourMinute(timeStr?: string): [number, number] | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return [hour, minute];
}

/**
 * Helper untuk mengonversi Timestamp / Date / string ke objek Date JavaScript
 */
function parseDateObject(rawDate: any): Date | null {
  if (!rawDate) return null;
  if (typeof rawDate.toDate === 'function') {
    return rawDate.toDate();
  }
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate;
  }
  if (typeof rawDate === 'string' || typeof rawDate === 'number') {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Mendeteksi apakah ada agenda yang berbenturan (rentang waktu <= 1 jam / 60 menit)
 * dengan jadwal dari surat yang akan ditindaklanjuti.
 */
export function detectScheduleConflict(
  suratToProcess: Surat,
  personalAgenda: CombinedAgendaItem[]
): CombinedAgendaItem[] {
  if (!suratToProcess || !suratToProcess.detailAgenda?.tanggal || !suratToProcess.detailAgenda?.jam) {
    return [];
  }

  if (!personalAgenda || !Array.isArray(personalAgenda) || personalAgenda.length === 0) {
    return [];
  }

  const suratDate = parseDateObject(suratToProcess.detailAgenda.tanggal);
  const suratTime = parseHourMinute(suratToProcess.detailAgenda.jam);

  if (!suratDate || !suratTime) {
    return [];
  }

  const [suratHour, suratMin] = suratTime;

  // Set waktu presisi untuk surat target
  const targetTime = new Date(suratDate);
  targetTime.setHours(suratHour, suratMin, 0, 0);
  const targetTimeMs = targetTime.getTime();

  const CONFLICT_THRESHOLD_MS = 60 * 60 * 1000; // 1 jam dalam milidetik (60 menit)

  const conflicts = personalAgenda.filter(agendaItem => {
    if (!agendaItem) return false;

    // Abaikan jika agenda yang dicek adalah surat itu sendiri
    if (agendaItem.type === 'surat' && agendaItem.id === suratToProcess.id) {
      return false;
    }

    let agendaDateObj: Date | null = null;
    let agendaJamStr: string | undefined = undefined;

    if (agendaItem.type === 'surat') {
      const itemSurat = agendaItem.item as Surat;
      if (!itemSurat.detailAgenda?.tanggal || !itemSurat.detailAgenda?.jam) return false;
      agendaDateObj = parseDateObject(itemSurat.detailAgenda.tanggal);
      agendaJamStr = itemSurat.detailAgenda.jam;
    } else {
      const itemJadwal = agendaItem.item as JadwalTempat;
      if (!itemJadwal.tanggalMulai) return false;
      agendaDateObj = parseDateObject(itemJadwal.tanggalMulai);
      agendaJamStr = itemJadwal.jamMulai;
    }

    if (!agendaDateObj) return false;

    const parsedAgendaTime = parseHourMinute(agendaJamStr || agendaItem.time);
    if (!parsedAgendaTime) return false;

    const [agendaHour, agendaMin] = parsedAgendaTime;
    const agendaTime = new Date(agendaDateObj);
    agendaTime.setHours(agendaHour, agendaMin, 0, 0);
    const agendaTimeMs = agendaTime.getTime();

    // Cek selisih absolut (apakah dalam rentang <= 1 jam)
    const diffMs = Math.abs(agendaTimeMs - targetTimeMs);
    return diffMs <= CONFLICT_THRESHOLD_MS;
  });

  return conflicts;
}
