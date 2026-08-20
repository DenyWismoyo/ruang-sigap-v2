import { useState, useRef, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserProfile } from '@/types';
import { useToast } from '@/context/ToastContext';
import { app } from '@/lib/firebase';

export interface VoiceAssistantResult {
  penerimaIds: string[];
  instruksi: string;
  isInformational: boolean;
}

export function useVoiceAssistant(bawahanList: UserProfile[]) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { addToast } = useToast();

  const processAudioToAI = async (base64Audio: string, mimeType: string): Promise<VoiceAssistantResult | null> => {
    setIsProcessingAI(true);
    try {
      const functionsInstance = getFunctions(app, 'asia-southeast2');
      const extractVoiceDisposisiAIV2 = httpsCallable(functionsInstance, 'extractVoiceDisposisiAIV2');
      
      const compactBawahanList = bawahanList.map(b => `${b.uid}|${b.namaLengkap}|${b.namaJabatan}`).join('\n');
      
      const payload = {
          audioBase64: base64Audio,
          mimeType: mimeType,
          bawahanListStr: compactBawahanList
      };

      const result = await extractVoiceDisposisiAIV2(payload);
      const data = result.data as VoiceAssistantResult;
      
      return data;
    } catch (error: any) {
      console.error("Error processing audio to AI:", error);
      addToast(error.message || 'Terjadi kesalahan saat menghubungi AI.', 'error');
      return null;
    } finally {
      setIsProcessingAI(false);
    }
  };

  const startListening = useCallback(async (onResult: (result: VoiceAssistantResult | null) => void) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let selectedMimeType = 'audio/webm';
        const options: MediaRecorderOptions = {};
        
        if (MediaRecorder.isTypeSupported('audio/webm')) {
             selectedMimeType = 'audio/webm';
             options.mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
             selectedMimeType = 'audio/mp4';
             options.mimeType = 'audio/mp4';
        } else {
             selectedMimeType = ''; // Let browser decide
        }

        const mediaRecorder = new MediaRecorder(stream, selectedMimeType ? options : undefined);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        // Silence detection using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 256;
        microphone.connect(analyser);

        let silenceStart = Date.now();
        let animationFrameId: number;

        const checkAudioLevel = () => {
             if (mediaRecorder.state === 'inactive') return;
             const array = new Uint8Array(analyser.frequencyBinCount);
             analyser.getByteFrequencyData(array);
             let values = 0;
             for (let i = 0; i < array.length; i++) {
                 values += array[i];
             }
             const average = values / array.length;
             
             // Threshold (can be adjusted)
             if (average > 10) { 
                 silenceStart = Date.now();
             } else {
                 if (Date.now() - silenceStart > 5000) {
                     mediaRecorder.stop();
                     return; // stop polling
                 }
             }
             animationFrameId = requestAnimationFrame(checkAudioLevel);
        };
        
        checkAudioLevel();

        mediaRecorder.onstop = async () => {
            setIsListening(false);
            cancelAnimationFrame(animationFrameId);
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
            stream.getTracks().forEach(track => track.stop()); // Matikan mic
            
            const mimeType = selectedMimeType || mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            setAudioBlob(blob);

            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];
                const aiResult = await processAudioToAI(base64data, mimeType);
                onResult(aiResult);
            };
        };

        mediaRecorder.start();
        setIsListening(true);
    } catch (err: any) {
        console.error("Gagal merekam:", err);
        addToast('Browser Anda tidak mengizinkan atau mendukung perekaman suara.', 'error');
    }
  }, [addToast, bawahanList]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
        mediaRecorderRef.current.stop();
    }
  }, [isListening]);

  const resetAudio = useCallback(() => {
      setAudioBlob(null);
  }, []);

  return {
      isListening,
      isProcessingAI,
      audioBlob, // Returned for upload
      startListening,
      stopListening,
      resetAudio
  };
}
