/**
 * Directory: src/app/dashboard/hooks/useTugasActions.ts
 * Status: FINAL COMPLETE SSOT
 * Deskripsi: Hook pusat untuk SEMUA mutasi tugas.
 * [UPDATE LOGBOOK OTOMATIS]
 * - Menambahkan pencatatan otomatis ke Logbook saat membuat tugas baru.
 */

import { useState } from 'react';
import { 
    doc, writeBatch, collection, Timestamp, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, updateDoc, addDoc, getDocs, query, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Tugas, UserProfile, SubTugas, TugasLampiran } from '@/types';
import { logActivity } from '@/lib/activityLogger';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

import { useQueryClient } from '@tanstack/react-query';

export const useTugasActions = () => {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const getActorName = () => `${userProfile?.namaLengkap} (${effectiveJabatan?.namaJabatan})`;

  // --- 1. CORE ACTIONS (CREATE, UPDATE STATUS, DELETE) ---

  const createNewTask = async (
      taskData: Omit<Tugas, 'id' | 'opdId' | 'dariJabatanId' | 'dariJabatanNama' | 'tanggalDibuat' | 'status'>,
      pemberiTugasUser: UserProfile,
      recipientsToNotify: UserProfile[] 
  ) => {
      if (!userProfile || !effectiveJabatan) return false;
      setIsProcessing(true);

      try {
          const batch = writeBatch(db);
          const tugasRef = doc(collection(db, 'tugas'));
          const opdId = userProfile.opdId;
          
          const newTugas: Omit<Tugas, 'id'> = {
              ...taskData,
              opdId,
              dariJabatanId: pemberiTugasUser.jabatanId,
              dariJabatanNama: pemberiTugasUser.namaLengkap,
              tanggalDibuat: Timestamp.now(),
              status: 'Baru',
          };

          batch.set(tugasRef, newTugas);

          // Fan-out ke pemberi tugas
          batch.set(doc(db, 'tugasPerPengguna', pemberiTugasUser.uid, 'tugas', tugasRef.id), newTugas);
          
          // Fan-out ke penerima & kolaborator
          recipientsToNotify.forEach(u => {
              if (u.uid !== pemberiTugasUser.uid) {
                  batch.set(doc(db, 'tugasPerPengguna', u.uid, 'tugas', tugasRef.id), newTugas);
              }
          });

          if (taskData.suratId && taskData.suratPerihal) {
            await logActivity(taskData.suratId, getActorName(), `Membuat tugas baru: "${taskData.judulTugas}"`);
            const suratRef = doc(db, 'surat', taskData.suratId);
            batch.update(suratRef, { statusPenyelesaian: 'Proses Tindak Lanjut' });
          }

          for (const u of recipientsToNotify) {
              if (u.uid === userProfile.uid) continue;
              const notifRef = doc(collection(db, 'notifications'));
              batch.set(notifRef, {
                  userId: u.uid, userNip: u.nip, 
                  message: `Tugas baru: "${taskData.judulTugas}"`, 
                  link: '/dashboard/tugas', isRead: false, timestamp: Timestamp.now() 
              });
              if (u.nomorWa) sendWhatsAppNotification(u.nomorWa, 'tugas_baru', [getActorName(), taskData.judulTugas]).catch(console.error);
          }

          await batch.commit();



          // [SINKRONISASI UI INSTAN]
          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.setQueryData(['tugasBawahan', effectiveJabatan.id], (oldData: any) => {
                  if (!oldData) return oldData;
                  return [{ id: tugasRef.id, ...newTugas }, ...oldData];
              });
          }

          return tugasRef.id;

      } catch (error: any) {
          console.error("Create Task Error:", error);
          addToast(error.message || "Gagal membuat tugas.", 'error');
          return null;
      } finally {
          setIsProcessing(false);
      }
  };

  const updateTaskStatus = async (task: Tugas, newStatus: Tugas['status']) => {
      if (!userProfile || !effectiveJabatan) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const tugasRef = doc(db, 'tugas', task.id!);
          const updateData: any = { status: newStatus };
          let logMessage = '';

          if (newStatus === 'Selesai') {
              updateData.tanggalSelesai = Timestamp.now();
              logMessage = `Menyelesaikan tugas: "${task.judulTugas}"`;
          } else if (newStatus === 'Dikerjakan' && task.status === 'Selesai') {
              updateData.tanggalSelesai = null;
              logMessage = `Membuka kembali (revisi) tugas: "${task.judulTugas}"`;
          } else {
              logMessage = `Mengubah status tugas menjadi "${newStatus}"`;
          }

          batch.update(tugasRef, updateData);
          const allJabatanIds = [...new Set([task.dariJabatanId, task.kepadaJabatanId, ...(task.collaboratorIds || [])])];
          if (allJabatanIds.length > 0) {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('jabatanId', 'in', allJabatanIds.slice(0, 30))));
              usersSnap.forEach(uDoc => {
                  const uid = uDoc.data().uid || uDoc.id;
                  batch.update(doc(db, 'tugasPerPengguna', uid, 'tugas', task.id!), updateData);
              });
          }

          if (task.suratId) {
              await logActivity(task.suratId, getActorName(), logMessage);
          }
          


          await batch.commit();
          
          // [SINKRONISASI UI INSTAN]
          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast(`Status diubah menjadi ${newStatus}`, 'success');
          return true;
      } catch (error: any) {
          addToast("Gagal memperbarui status.", 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const updateTaskDetail = async (taskId: string, updates: Partial<Tugas>) => {
      if (!userProfile) return false;
      setIsProcessing(true);
      try {
          const { getDoc, getDocs, query, collection, where } = await import('firebase/firestore');
          const taskSnap = await getDoc(doc(db, 'tugas', taskId));
          if (!taskSnap.exists()) return false;
          const taskData = taskSnap.data() as Tugas;

          const usersSnap = await getDocs(query(collection(db, 'users'), where('opdId', '==', taskData.opdId)));
          
          // Chunking into batches of 500
          let currentBatch = writeBatch(db);
          let count = 0;
          currentBatch.update(doc(db, 'tugas', taskId), updates);
          count++;

          // Gunakan for...of untuk memungkinkan await di dalam loop jika diperlukan
          for (const userDoc of usersSnap.docs) {
              const uid = userDoc.data().uid || userDoc.id;
              currentBatch.set(doc(db, 'tugasPerPengguna', uid, 'tugas', taskId), updates, { merge: true });
              count++;
              if (count >= 490) { // Safety limit for firestore batch
                  await currentBatch.commit(); // BUG-BARU-3 Fixed
                  currentBatch = writeBatch(db);
                  count = 0;
              }
          }

          if (count > 0) {
              await currentBatch.commit();
          }



          // [NOTIFIKASI REVISI TUGAS]
          if (taskData.kepadaJabatanId) {
              const assignedUsersSnap = await import('firebase/firestore').then(m => m.getDocs(m.query(m.collection(db, 'users'), m.where('jabatanId', '==', taskData.kepadaJabatanId))));
              const notifBatch = writeBatch(db);
              assignedUsersSnap.forEach(uDoc => {
                  const uid = uDoc.data().uid || uDoc.id;
                  if (uid !== userProfile.uid) { // Jangan notif diri sendiri
                      const notifRef = doc(collection(db, 'notifications'));
                      notifBatch.set(notifRef, {
                          userId: uid,
                          userNip: uDoc.data().nip,
                          message: `Tugas diperbarui oleh ${getActorName()}: "${taskData.judulTugas}"`,
                          link: `/dashboard/tugas`,
                          isRead: false,
                          timestamp: serverTimestamp() as Timestamp,
                      });
                  }
              });
              await notifBatch.commit();
          }

          // [SINKRONISASI UI INSTAN]
          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast('Detail tugas diperbarui.', 'success');
          return true;
      } catch (err: any) {
          addToast(`Gagal update: ${err.message}`, 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const deleteTask = async (task: Tugas) => {
      if (!userProfile || !effectiveJabatan || !task.id) return false;
      setIsProcessing(true);
      try {
          const { getDocs, query, collection, where } = await import('firebase/firestore');
          const allJabatanIds = [...new Set([task.dariJabatanId, task.kepadaJabatanId, ...(task.collaboratorIds || [])])];
          let usersDocs: any[] = [];
          if (allJabatanIds.length > 0) {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('jabatanId', 'in', allJabatanIds.slice(0, 30))));
              usersDocs = usersSnap.docs;
          }
          
          let currentBatch = writeBatch(db);
          let count = 0;
          currentBatch.delete(doc(db, 'tugas', task.id));
          count++;

          // Delete from komentarTugas as well
          const komentarSnap = await getDocs(query(collection(db, 'komentarTugas'), where('tugasId', '==', task.id)));
          komentarSnap.forEach(kDoc => {
              currentBatch.delete(kDoc.ref);
              count++;
          });

          usersDocs.forEach(userDoc => {
              const uid = userDoc.data().uid || userDoc.id;
              currentBatch.delete(doc(db, 'tugasPerPengguna', uid, 'tugas', task.id!));
              count++;
              if (count >= 490) { // Safety margin
                  currentBatch.commit();
                  currentBatch = writeBatch(db);
                  count = 0;
              }
          });

          if (count > 0) {
              await currentBatch.commit();
          }

          if (task.suratId) await logActivity(task.suratId, getActorName(), `Menghapus tugas: "${task.judulTugas}"`);
          addToast("Tugas berhasil dihapus.", "success");
          return true;
      } catch (error: any) {
          console.error("Delete Task Error:", error);
          addToast("Gagal menghapus tugas.", 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  // --- 2. SUB-TASK ACTIONS ---
  const addSubTask = async (taskId: string, subTask: SubTugas) => {
      try {
          await updateDoc(doc(db, 'tugas', taskId), { subTugas: arrayUnion(subTask) });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  const toggleSubTask = async (taskId: string, subTugasList: SubTugas[], subTaskId: string) => {
      try {
          const updatedList = subTugasList.map(st => st.id === subTaskId ? { ...st, selesai: !st.selesai } : st);
          await updateDoc(doc(db, 'tugas', taskId), { subTugas: updatedList });
          return updatedList;
      } catch (e) { console.error(e); return null; }
  };

  const removeSubTask = async (taskId: string, subTask: SubTugas) => {
      try {
          await updateDoc(doc(db, 'tugas', taskId), { subTugas: arrayRemove(subTask) });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  // --- 3. COLLABORATOR ACTIONS ---
  const addCollaborator = async (taskId: string, jabatanId: string) => {
      try {
          await updateDoc(doc(db, 'tugas', taskId), { collaboratorIds: arrayUnion(jabatanId) });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  const removeCollaborator = async (taskId: string, jabatanId: string) => {
      try {
          await updateDoc(doc(db, 'tugas', taskId), { collaboratorIds: arrayRemove(jabatanId) });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  // --- 4. COMMENT & ATTACHMENT ACTIONS ---
  const addComment = async (taskId: string, komentar: string) => {
      if(!userProfile || !effectiveJabatan) return false;
      try {
          await addDoc(collection(db, 'komentarTugas'), {
              tugasId: taskId,
              userId: userProfile.uid,
              userName: userProfile.namaLengkap,
              userJabatan: effectiveJabatan.namaJabatan,
              komentar: komentar,
              timestamp: serverTimestamp()
          });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  const addAttachment = async (taskId: string, attachment: TugasLampiran) => {
      try {
          await updateDoc(doc(db, 'tugas', taskId), { lampiran: arrayUnion(attachment) });
          return true;
      } catch (e) { console.error(e); return false; }
  };

  // --- 1.2 BATCH TASK CREATION (MULTI-ASSIGNEE SPLIT) ---
  const createBatchTasks = async (
      taskTemplate: Omit<Tugas, 'id' | 'opdId' | 'dariJabatanId' | 'dariJabatanNama' | 'tanggalDibuat' | 'status' | 'kepadaJabatanId' | 'kepadaJabatanNama'>,
      pemberiTugasUser: UserProfile,
      assignees: UserProfile[]
  ) => {
      if (!userProfile || !effectiveJabatan || assignees.length === 0) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const opdId = userProfile.opdId;
          const createdTaskIds: string[] = [];

          for (const assignee of assignees) {
              const tugasRef = doc(collection(db, 'tugas'));
              createdTaskIds.push(tugasRef.id);

              const singleTugas: Omit<Tugas, 'id'> = {
                  ...taskTemplate,
                  opdId,
                  dariJabatanId: pemberiTugasUser.jabatanId,
                  dariJabatanNama: pemberiTugasUser.namaLengkap,
                  kepadaJabatanId: assignee.jabatanId,
                  kepadaJabatanNama: assignee.namaLengkap,
                  tanggalDibuat: Timestamp.now(),
                  status: 'Baru',
                  instruksiTipe: 'delegasi_langsung',
                  isDelegated: true,
              };

              batch.set(tugasRef, singleTugas);
              // Fan-out ke pemberi tugas
              batch.set(doc(db, 'tugasPerPengguna', pemberiTugasUser.uid, 'tugas', tugasRef.id), singleTugas);
              // Fan-out ke penerima
              batch.set(doc(db, 'tugasPerPengguna', assignee.uid, 'tugas', tugasRef.id), singleTugas);

              // Notifikasi
              if (assignee.uid !== pemberiTugasUser.uid) {
                  const notifRef = doc(collection(db, 'notifications'));
                  batch.set(notifRef, {
                      userId: assignee.uid,
                      userNip: assignee.nip,
                      message: `Instruksi tugas baru: "${taskTemplate.judulTugas}"`,
                      link: '/dashboard/poros/tugas',
                      isRead: false,
                      timestamp: Timestamp.now()
                  });
                  if (assignee.nomorWa) {
                      sendWhatsAppNotification(assignee.nomorWa, 'tugas_baru', [getActorName(), taskTemplate.judulTugas]).catch(console.error);
                  }
              }
          }

          await batch.commit();

          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast(`Berhasil menugaskan ${assignees.length} staf!`, 'success');
          return createdTaskIds;
      } catch (error: any) {
          console.error("Batch Task Error:", error);
          addToast(error.message || "Gagal membuat tugas batch.", 'error');
          return null;
      } finally {
          setIsProcessing(false);
      }
  };

  // --- 1.3 SUBMIT LAPORAN HASIL TUGAS (STAF -> REVIEW ATASAN) ---
  const submitTaskReport = async (
      task: Tugas,
      report: { ringkasan: string; buktiUrl?: string; catatanTambahan?: string },
      autoLogbook: boolean = true
  ) => {
      if (!userProfile || !effectiveJabatan || !task.id) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const tugasRef = doc(db, 'tugas', task.id);
          
          const isMandiri = task.dariJabatanId === task.kepadaJabatanId;
          const targetStatus: Tugas['status'] = isMandiri ? 'Selesai' : 'Menunggu Review';

          const laporanPayload: any = {
              ringkasan: report.ringkasan,
              diserahkanPada: Timestamp.now(),
          };
          if (report.buktiUrl) laporanPayload.buktiUrl = report.buktiUrl;
          if (report.catatanTambahan) laporanPayload.catatanTambahan = report.catatanTambahan;

          const updateData: Partial<Tugas> = {
              status: targetStatus,
              laporanHasil: laporanPayload,
              catatanRevisi: undefined,
              tanggalSelesai: isMandiri ? Timestamp.now() : null
          };

          batch.update(tugasRef, updateData);

          const allJabatanIds = [...new Set([task.dariJabatanId, task.kepadaJabatanId, ...(task.collaboratorIds || [])])];
          if (allJabatanIds.length > 0) {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('jabatanId', 'in', allJabatanIds.slice(0, 30))));
              usersSnap.forEach(uDoc => {
                  const uid = uDoc.data().uid || uDoc.id;
                  batch.update(doc(db, 'tugasPerPengguna', uid, 'tugas', task.id!), updateData);
              });

              if (!isMandiri && task.dariJabatanId) {
                  const assignerUser = usersSnap.docs.find(d => d.data().jabatanId === task.dariJabatanId);
                  if (assignerUser) {
                      const assignerData = assignerUser.data();
                      const notifRef = doc(collection(db, 'notifications'));
                      batch.set(notifRef, {
                          userId: assignerData.uid || assignerUser.id,
                          userNip: assignerData.nip,
                          message: `${userProfile.namaLengkap} telah menyelesaikan dan mengirim laporan tugas: "${task.judulTugas}". Mohon verifikasi.`,
                          link: '/dashboard/poros/tugas',
                          isRead: false,
                          timestamp: Timestamp.now()
                      });
                  }
              }
          }

          if (task.suratId) {
              await logActivity(task.suratId, getActorName(), `Menyerahkan laporan hasil pengerjaan: "${report.ringkasan}"`);
          }

          if (autoLogbook && userProfile.opdId) {
              try {
                  const { writeLogbookEntry } = await import('@/lib/logbookUtils');
                  await writeLogbookEntry(userProfile.uid, userProfile.opdId, {
                      deskripsi: `Menyelesaikan tugas: ${task.judulTugas}. Hasil: ${report.ringkasan}`,
                      kategori: 'Tugas',
                      sumber: 'tugas',
                      tugasTerkaitId: task.id,
                      tugasTerkaitJudul: task.judulTugas,
                      selesai: true,
                  });

              } catch (logErr) {
                  console.error("Auto logbook error:", logErr);
              }
          }

          await batch.commit();

          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast(isMandiri ? 'Tugas berhasil diselesaikan & dicatat ke logbook!' : 'Laporan hasil tugas berhasil diserahkan untuk review atasan!', 'success');
          return true;
      } catch (error: any) {
          console.error("Submit Task Report Error:", error);
          addToast("Gagal menyerahkan laporan tugas.", 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  // --- 1.4 APPROVE TASK (ATASAN -> SELESAI) ---
  const approveTask = async (task: Tugas) => {
      if (!userProfile || !effectiveJabatan || !task.id) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const tugasRef = doc(db, 'tugas', task.id);
          const updateData: Partial<Tugas> = {
              status: 'Selesai',
              tanggalSelesai: Timestamp.now(),
              catatanRevisi: undefined
          };

          batch.update(tugasRef, updateData);

          const allJabatanIds = [...new Set([task.dariJabatanId, task.kepadaJabatanId, ...(task.collaboratorIds || [])])];
          if (allJabatanIds.length > 0) {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('jabatanId', 'in', allJabatanIds.slice(0, 30))));
              usersSnap.forEach(uDoc => {
                  const uid = uDoc.data().uid || uDoc.id;
                  batch.update(doc(db, 'tugasPerPengguna', uid, 'tugas', task.id!), updateData);
              });

              const executor = usersSnap.docs.find(d => d.data().jabatanId === task.kepadaJabatanId);
              if (executor && executor.data().uid !== userProfile.uid) {
                  const notifRef = doc(collection(db, 'notifications'));
                  batch.set(notifRef, {
                      userId: executor.data().uid,
                      userNip: executor.data().nip,
                      message: `Laporan tugas "${task.judulTugas}" telah disetujui & diverifikasi oleh ${getActorName()}.`,
                      link: '/dashboard/poros/tugas',
                      isRead: false,
                      timestamp: Timestamp.now()
                  });
              }
          }

          if (task.suratId) {
              await logActivity(task.suratId, getActorName(), `Menyetujui dan menyelesaikan tugas: "${task.judulTugas}"`);
          }

          await batch.commit();

          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast('Tugas telah diverifikasi dan disetujui!', 'success');
          return true;
      } catch (error: any) {
          console.error("Approve Task Error:", error);
          addToast("Gagal menyetujui tugas.", 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  // --- 1.5 REQUEST REVISION (ATASAN -> REVISI) ---
  const requestTaskRevision = async (task: Tugas, revisionNote: string) => {
      if (!userProfile || !effectiveJabatan || !task.id || !revisionNote) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const tugasRef = doc(db, 'tugas', task.id);
          const updateData: Partial<Tugas> = {
              status: 'Revisi',
              catatanRevisi: revisionNote
          };

          batch.update(tugasRef, updateData);

          const allJabatanIds = [...new Set([task.dariJabatanId, task.kepadaJabatanId, ...(task.collaboratorIds || [])])];
          if (allJabatanIds.length > 0) {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('jabatanId', 'in', allJabatanIds.slice(0, 30))));
              usersSnap.forEach(uDoc => {
                  const uid = uDoc.data().uid || uDoc.id;
                  batch.update(doc(db, 'tugasPerPengguna', uid, 'tugas', task.id!), updateData);
              });

              const executor = usersSnap.docs.find(d => d.data().jabatanId === task.kepadaJabatanId);
              if (executor && executor.data().uid !== userProfile.uid) {
                  const notifRef = doc(collection(db, 'notifications'));
                  batch.set(notifRef, {
                      userId: executor.data().uid,
                      userNip: executor.data().nip,
                      message: `Catatan revisi tugas "${task.judulTugas}" dari ${getActorName()}: "${revisionNote}"`,
                      link: '/dashboard/poros/tugas',
                      isRead: false,
                      timestamp: Timestamp.now()
                  });
                  if (executor.data().nomorWa) {
                      sendWhatsAppNotification(executor.data().nomorWa, 'tugas_baru', [getActorName(), `Revisi: ${revisionNote}`]).catch(console.error);
                  }
              }
          }

          if (task.suratId) {
              await logActivity(task.suratId, getActorName(), `Meminta revisi tugas: "${revisionNote}"`);
          }

          await batch.commit();

          if (effectiveJabatan?.id) {
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan'] });
              queryClient.invalidateQueries({ queryKey: ['tugasBawahan', effectiveJabatan.id] });
          }

          addToast('Permintaan revisi berhasil dikirim ke pelaksana.', 'success');
          return true;
      } catch (error: any) {
          console.error("Revision Task Error:", error);
          addToast("Gagal mengirim revisi tugas.", 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  return {
      createNewTask,
      createBatchTasks,
      submitTaskReport,
      approveTask,
      requestTaskRevision,
      updateTaskStatus,
      updateTaskDetail,
      deleteTask,
      addSubTask,
      toggleSubTask,
      removeSubTask,
      addCollaborator,
      removeCollaborator,
      addComment,
      addAttachment,
      isProcessing
  };
};