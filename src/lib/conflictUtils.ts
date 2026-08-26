import { Surat, JadwalTempat } from '@/types';
import { CombinedAgendaItem } from '@/app/dashboard/sigap/(main)/ruang-kerja/page';

/**
 * Mendeteksi apakah ada agenda yang berbenturan (± 1 jam)
 * dengan jadwal dari surat yang akan ditindaklanjuti.
 */
export function detectScheduleConflict(
  suratToProcess: Surat,
  personalAgenda: CombinedAgendaItem[]
): CombinedAgendaItem[] {
  if (!suratToProcess.detailAgenda?.tanggal || !suratToProcess.detailAgenda?.jam) {
    return []; // Tidak ada info agenda di surat ini, berarti tidak bisa dicek konfliknya
  }

  const suratDate = suratToProcess.detailAgenda.tanggal.toDate();
  const [suratHourStr, suratMinStr] = suratToProcess.detailAgenda.jam.split(':');
  const suratHour = parseInt(suratHourStr, 10);
  const suratMin = parseInt(suratMinStr, 10);

  // Set the precise time for the target surat
  const targetTime = new Date(suratDate);
  targetTime.setHours(suratHour, suratMin, 0, 0);
  const targetTimeMs = targetTime.getTime();

  const CONFLICT_THRESHOLD_MS = 60 * 60 * 1000; // 1 jam dalam milidetik

  const conflicts = personalAgenda.filter(agendaItem => {
    // Abaikan jika agenda yang dicek adalah surat itu sendiri
    if (agendaItem.type === 'surat' && agendaItem.id === suratToProcess.id) {
      return false;
    }

    let agendaDateObj: Date;
    let agendaJamStr: string;

    if (agendaItem.type === 'surat') {
      const itemSurat = agendaItem.item as Surat;
      if (!itemSurat.detailAgenda?.tanggal || !itemSurat.detailAgenda?.jam) return false;
      agendaDateObj = itemSurat.detailAgenda.tanggal.toDate();
      agendaJamStr = itemSurat.detailAgenda.jam;
    } else {
      const itemJadwal = agendaItem.item as JadwalTempat;
      agendaDateObj = itemJadwal.tanggalMulai.toDate();
      agendaJamStr = itemJadwal.jamMulai;
    }

    const [agendaHourStr, agendaMinStr] = agendaJamStr.split(':');
    const agendaHour = parseInt(agendaHourStr, 10);
    const agendaMin = parseInt(agendaMinStr, 10);

    const agendaTime = new Date(agendaDateObj);
    agendaTime.setHours(agendaHour, agendaMin, 0, 0);
    const agendaTimeMs = agendaTime.getTime();

    // Cek selisih absolut (apakah dalam rentang ± 1 jam)
    const diffMs = Math.abs(agendaTimeMs - targetTimeMs);
    
    return diffMs <= CONFLICT_THRESHOLD_MS;
  });

  return conflicts;
}
