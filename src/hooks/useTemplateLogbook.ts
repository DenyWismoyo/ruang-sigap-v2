// src/hooks/useTemplateLogbook.ts
// Hook untuk CRUD Template Kegiatan Favorit logbook pengguna
// Data disimpan di Firestore: templateLogbook/{userId}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, Timestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { writeLogbookEntry } from '@/lib/logbookUtils';
import { TemplateLogbookItem } from '@/types';

const EMOJI_BY_KATEGORI: Record<string, string> = {
  'Disposisi': '📨',
  'Rapat': '📋',
  'Laporan': '📝',
  'Tugas': '✅',
  'Surat': '📄',
  'Umum': '🏢',
};

export function useTemplateLogbook() {
  const { userProfile } = useUserAuth();
  const [templates, setTemplates] = useState<TemplateLogbookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOAD templates dari Firestore ---
  const loadTemplates = useCallback(async () => {
    if (!userProfile?.uid) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'templateLogbook', userProfile.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const sorted = (data.templates || []).sort(
          (a: TemplateLogbookItem, b: TemplateLogbookItem) => (b.usageCount || 0) - (a.usageCount || 0)
        );
        setTemplates(sorted);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('[TemplateLogbook] Gagal load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // --- TAMBAH template baru ---
  const addTemplate = useCallback(async (
    item: Pick<TemplateLogbookItem, 'nama' | 'deskripsi' | 'kategori' | 'aktivitasId' | 'aktivitasNama' | 'emoji'>
  ): Promise<boolean> => {
    if (!userProfile?.uid) return false;
    setIsSaving(true);
    try {
      const newTemplate: TemplateLogbookItem = {
        id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nama: item.nama.trim(),
        deskripsi: item.deskripsi.trim(),
        kategori: item.kategori || 'Umum',
        aktivitasId: item.aktivitasId,
        aktivitasNama: item.aktivitasNama,
        emoji: item.emoji || EMOJI_BY_KATEGORI[item.kategori] || '🏢',
        usageCount: 0,
        createdAt: Timestamp.now(),
      };

      const docRef = doc(db, 'templateLogbook', userProfile.uid);
      await setDoc(docRef, {
        userId: userProfile.uid,
        templates: arrayUnion(newTemplate),
      }, { merge: true });

      // Tambah ke state lokal langsung (optimistic)
      setTemplates(prev => [newTemplate, ...prev]);
      return true;
    } catch (err) {
      console.error('[TemplateLogbook] Gagal tambah:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userProfile?.uid]);

  // --- HAPUS template ---
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    if (!userProfile?.uid) return false;
    try {
      const targetTemplate = templates.find(t => t.id === templateId);
      if (!targetTemplate) return false;

      const docRef = doc(db, 'templateLogbook', userProfile.uid);
      await setDoc(docRef, {
        userId: userProfile.uid,
        templates: arrayRemove(targetTemplate),
      }, { merge: true });

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return true;
    } catch (err) {
      console.error('[TemplateLogbook] Gagal hapus:', err);
      return false;
    }
  }, [userProfile?.uid, templates]);

  // --- GUNAKAN template (1-tap ke logbook hari ini) ---
  const useTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    if (!userProfile?.uid || !userProfile.opdId) return false;

    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    setIsSaving(true);
    try {
      // 1. Tulis ke logbook hari ini
      await writeLogbookEntry(userProfile.uid, userProfile.opdId, {
        deskripsi: template.deskripsi,
        kategori: template.kategori,
        aktivitasId: template.aktivitasId,
        aktivitasNama: template.aktivitasNama,
        sumber: 'manual',
        selesai: true,
      });

      // 2. Increment usageCount di Firestore (replace template lama)
      const updatedTemplate: TemplateLogbookItem = {
        ...template,
        usageCount: (template.usageCount || 0) + 1,
        lastUsedAt: Timestamp.now(),
      };

      const docRef = doc(db, 'templateLogbook', userProfile.uid);
      // Hapus yang lama, tambah yang baru (karena arrayUnion tidak bisa update in-place)
      await setDoc(docRef, {
        userId: userProfile.uid,
        templates: arrayRemove(template),
      }, { merge: true });
      await setDoc(docRef, {
        templates: arrayUnion(updatedTemplate),
      }, { merge: true });

      // 3. Update state lokal
      setTemplates(prev =>
        prev.map(t => t.id === templateId ? updatedTemplate : t)
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      );

      return true;
    } catch (err) {
      console.error('[TemplateLogbook] Gagal pakai template:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userProfile?.uid, userProfile?.opdId, templates]);

  return {
    templates,
    isLoading,
    isSaving,
    addTemplate,
    deleteTemplate,
    useTemplate,
    reload: loadTemplates,
    EMOJI_BY_KATEGORI,
  };
}
