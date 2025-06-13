import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechSimpleReturn {
  speak: (text: string) => void;
  speaking: boolean;
  supported: boolean;
  cancel: () => void;
  initializeVoice: () => void;
}

export const useSpeechSimple = (): UseSpeechSimpleReturn => {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const preferredVoice = useRef<SpeechSynthesisVoice | null>(null);
  const isInitialized = useRef(false);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Encontrar y configurar la mejor voz de Google en español
  const initializeVoice = useCallback(() => {
    if (!supported) return;
    
    // Crear una utterance silenciosa para inicializar el contexto de audio
    const silentUtterance = new SpeechSynthesisUtterance('');
    silentUtterance.volume = 0;
    
    silentUtterance.onend = () => {
      isInitialized.current = true;
      console.log('Síntesis de voz inicializada correctamente');
    };
    
    speechSynthesis.speak(silentUtterance);
  }, [supported]);

  // Inicializar voz al montar el componente
  useEffect(() => {
    initializeVoice();
  }, [initializeVoice]);
  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return;

    // Verificar que el speechSynthesis esté disponible y no esté pausado
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    // Crear una nueva utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar la voz preferida
    if (preferredVoice.current) {
      utterance.voice = preferredVoice.current;
      utterance.lang = preferredVoice.current.lang;
    } else {
      utterance.lang = 'es-US'; // Fallback
    }

    // Configuración optimizada para claridad y velocidad
    utterance.rate = 0.9; // Velocidad ligeramente reducida para mejor comprensión
    utterance.pitch = 1.0; // Tono neutro
    utterance.volume = 1.0; // Volumen máximo

    utterance.onstart = () => {
      setSpeaking(true);
      isInitialized.current = true;
    };

    utterance.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.warn('Error en síntesis de voz:', event.error);
      setSpeaking(false);
      utteranceRef.current = null;
      
      // Si el error es "not-allowed", significa que necesitamos interacción del usuario
      if (event.error === 'not-allowed') {
        console.warn('La síntesis de voz requiere interacción del usuario. Usa el botón de prueba primero.');
      }
    };

    utteranceRef.current = utterance;
    
    try {
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Error al iniciar síntesis de voz:', error);
      setSpeaking(false);
      utteranceRef.current = null;
    }
  }, [supported]);

  const cancel = useCallback(() => {
    if (supported) {
      speechSynthesis.cancel();
      setSpeaking(false);
      utteranceRef.current = null;
    }
  }, [supported]);

  return {
    speak,
    speaking,
    supported,
    cancel,
    initializeVoice
  };
};
