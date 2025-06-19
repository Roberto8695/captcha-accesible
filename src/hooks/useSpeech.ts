import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  priority?: 'high' | 'normal' | 'low';
  isRetry?: boolean;
}

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  quality: number;
  isLocal: boolean;
  gender: 'male' | 'female' | 'unknown';
}

interface UseSpeechReturn {
  speak: (text: string, options?: SpeechOptions) => void;
  speaking: boolean;
  supported: boolean;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  voices: SpeechSynthesisVoice[];
  spanishVoices: VoiceInfo[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  voiceSettings: SpeechOptions;
  updateVoiceSettings: (settings: Partial<SpeechOptions>) => void;
}

export const useSpeech = (): UseSpeechReturn => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [spanishVoices, setSpanishVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<SpeechOptions>({
    lang: 'es-US', // Preferir es-US por defecto
    rate: 0.85,
    pitch: 1.0,
    volume: 1.0
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Función para guardar voz preferida en localStorage
  const savePreferredVoice = (voice: SpeechSynthesisVoice) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('preferredVoice', JSON.stringify({
          name: voice.name,
          lang: voice.lang,
          voiceURI: voice.voiceURI
        }));
        console.log('✅ Voz preferida guardada:', voice.name);
      } catch (error) {
        console.warn('Error guardando voz preferida:', error);
      }
    }
  };

  // Función para cargar voz preferida desde localStorage
  const loadPreferredVoice = (): { name: string; lang: string; voiceURI: string } | null => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('preferredVoice');
        return saved ? JSON.parse(saved) : null;
      } catch (error) {
        console.warn('Error cargando voz preferida:', error);
        return null;
      }
    }
    return null;
  };  // Función para evaluar la calidad de una voz
  const evaluateVoiceQuality = (voice: SpeechSynthesisVoice): VoiceInfo => {
    let quality = 0;
    let gender: 'male' | 'female' | 'unknown' = 'unknown';
    
    // MÁXIMA PRIORIDAD: Google Español de Estados Unidos
    if (voice.name.toLowerCase().includes('google') && voice.lang === 'es-US') {
      quality = 100; // Máxima prioridad absoluta
      console.log('🌟 VOZ PRIORITARIA DETECTADA: Google Español US -', voice.name);
    }
    // SEGUNDA PRIORIDAD: Otras voces Google en español
    else if (voice.name.toLowerCase().includes('google') && voice.lang.startsWith('es-')) {
      quality = 90;
      console.log('🎯 Voz Google en español detectada:', voice.name);
    }
    
    // Preferir voces locales (más rápidas y confiables)
    const isLocal = voice.localService;
    if (isLocal) quality += 30;
    
    // Evaluar por región con prioridad especial para es-US
    if (voice.lang === 'es-US') quality += 30; // Mayor prioridad que es-ES
    else if (voice.lang === 'es-ES') quality += 25;
    else if (voice.lang === 'es-MX') quality += 20;
    else if (voice.lang.startsWith('es-')) quality += 15;
    
    // Detectar género por el nombre (muchas voces incluyen indicaciones)
    const nameLower = voice.name.toLowerCase();
    if (nameLower.includes('female') || nameLower.includes('mujer') || 
        nameLower.includes('maría') || nameLower.includes('carmen') || 
        nameLower.includes('pilar') || nameLower.includes('paula') ||
        nameLower.includes('mónica') || nameLower.includes('elena')) {
      gender = 'female';
      quality += 5; // Leve preferencia por voces femeninas (suelen ser más claras)
    } else if (nameLower.includes('male') || nameLower.includes('hombre') || 
               nameLower.includes('jorge') || nameLower.includes('diego') || 
               nameLower.includes('carlos') || nameLower.includes('andrés')) {
      gender = 'male';
    }
    
    // Preferir voces con nombres que sugieren alta calidad
    if (nameLower.includes('enhanced') || nameLower.includes('premium') || 
        nameLower.includes('neural') || nameLower.includes('natural') ||
        nameLower.includes('eloquence') || nameLower.includes('vocalizer')) {
      quality += 20;
    }
    
    // Penalizar voces que suenan robóticas
    if (nameLower.includes('compact') || nameLower.includes('basic') || 
        nameLower.includes('espeak') || nameLower.includes('festival')) {
      quality -= 15;
    }
    
    // Bonificar voces conocidas de alta calidad
    if (nameLower.includes('google') || nameLower.includes('microsoft') || 
        nameLower.includes('apple') || nameLower.includes('amazon')) {
      quality += 15;
    }
    
    return { voice, quality, isLocal, gender };
  };

  // Cargar y evaluar voces disponibles
  const loadVoices = useCallback(() => {
    if (!supported) return;
    
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Filtrar y evaluar voces en español
    const spanishVoicesInfo = availableVoices
      .filter(voice => voice.lang.startsWith('es'))
      .map(evaluateVoiceQuality)
      .sort((a, b) => b.quality - a.quality);
    
    setSpanishVoices(spanishVoicesInfo);
      // Seleccionar automáticamente la mejor voz si no hay ninguna seleccionada
    if (!selectedVoice && spanishVoicesInfo.length > 0) {
      // Primero intentar cargar voz preferida del localStorage
      const preferredVoice = loadPreferredVoice();
      let bestVoice = spanishVoicesInfo[0].voice;
      
      // Si hay una voz preferida guardada, intentar encontrarla
      if (preferredVoice) {
        const savedVoice = availableVoices.find(v => 
          v.name === preferredVoice.name && 
          v.lang === preferredVoice.lang &&
          v.voiceURI === preferredVoice.voiceURI
        );
        if (savedVoice) {
          bestVoice = savedVoice;
          console.log('✅ Voz preferida cargada desde localStorage:', savedVoice.name);
        }
      }
      
      setSelectedVoice(bestVoice);
      
      // Ajustar configuraciones según la voz seleccionada
      setVoiceSettings(prev => ({
        ...prev,
        voice: bestVoice,
        lang: bestVoice.lang,
        // Ajustar velocidad según el tipo de voz
        rate: spanishVoicesInfo[0].isLocal ? 0.85 : 0.75
      }));
      
      console.log(`Voz seleccionada automáticamente: ${bestVoice.name} (${bestVoice.lang})`);
    }
  }, [supported, selectedVoice]);

  // Cargar voces al montar el componente y cuando cambien
  useEffect(() => {
    if (!supported) return;
    
    loadVoices();
    
    // Escuchar cambios en las voces (algunas se cargan de forma asíncrona)
    const handleVoicesChanged = () => {
      setTimeout(loadVoices, 100); // Pequeño delay para asegurar que las voces estén listas
    };
    
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [loadVoices, supported]);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!supported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Función para procesar texto y hacerlo más natural
    const preprocessText = (inputText: string): string => {
      return inputText
        // Mejorar pronunciación de elementos comunes
        .replace(/captcha/gi, 'cáptcha')
        .replace(/email/gi, 'correo electrónico')
        .replace(/input/gi, 'campo de entrada')
        .replace(/button/gi, 'botón')
        .replace(/checkbox/gi, 'casilla de verificación')
        .replace(/textbox/gi, 'caja de texto')
        .replace(/\berror\b/gi, 'error')
        .replace(/\bfocus\b/gi, 'enfocado')
        .replace(/\bclick\b/gi, 'hacer clic')
        
        // Agregar pausas naturales
        .replace(/\./g, '. ')
        .replace(/\,/g, ', ')
        .replace(/\:/g, ': ')
        .replace(/\;/g, '; ')
        .replace(/\!/g, '! ')
        .replace(/\?/g, '? ')
        
        // Limpiar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Cancelar cualquier síntesis anterior si se especifica prioridad alta
    if (options.priority === 'high') {
      window.speechSynthesis.cancel();
      queueRef.current = [];
    }

    // Procesar texto para hacerlo más natural
    const processedText = preprocessText(text);
    
    // Validar que el texto no esté vacío
    if (!processedText.trim()) {
      console.warn('Texto vacío, no se puede sintetizar');
      return;
    }
    
    // Si es prioridad baja y ya está hablando, agregar a la cola
    if (speaking && options.priority !== 'high') {
      queueRef.current.push(processedText);
      return;
    }

    // Validar que speechSynthesis esté disponible
    if (!window.speechSynthesis) {
      console.warn('speechSynthesis no está disponible en este navegador');
      return;
    }

    // Configurar utterance con la mejor voz disponible
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Usar voz seleccionada o configuraciones por defecto
    const finalVoice = options.voice || selectedVoice;
    if (finalVoice) {
      try {
        utterance.voice = finalVoice;
        utterance.lang = finalVoice.lang;
      } catch (error) {
        console.warn('Error al asignar voz, usando voz por defecto:', error);
        utterance.lang = options.lang || voiceSettings.lang || 'es-ES';
      }
    } else {
      utterance.lang = options.lang || voiceSettings.lang || 'es-ES';
    }
    
    // Aplicar configuraciones de voz optimizadas con validación
    utterance.rate = Math.max(0.1, Math.min(10, options.rate || voiceSettings.rate || 0.85));
    utterance.pitch = Math.max(0, Math.min(2, options.pitch || voiceSettings.pitch || 1.0));
    utterance.volume = Math.max(0, Math.min(1, options.volume || voiceSettings.volume || 1.0));    // Configurar eventos
    utterance.onstart = () => {
      setSpeaking(true);
      console.log(`Hablando: "${processedText.substring(0, 50)}..." con voz: ${finalVoice?.name || 'predeterminada'}`);
    };
      utterance.onend = () => {
      setSpeaking(false);
      
      // Limpiar timeout de seguridad si existe
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      
      // Procesar siguiente elemento de la cola si existe
      if (queueRef.current.length > 0) {
        const nextText = queueRef.current.shift();
        if (nextText) {
          setTimeout(() => {
            speak(nextText, { 
              ...options, 
              priority: 'normal',
              isRetry: false // Resetear flag de reintento para nueva solicitud
            });
          }, 100);
        }
      }
    };
    
    // Timeout de seguridad para voces externas que pueden fallar silenciosamente
    let safetyTimeout: NodeJS.Timeout | undefined;
    if (finalVoice && !spanishVoices.find(v => v.voice === finalVoice)?.isLocal) {
      safetyTimeout = setTimeout(() => {
        if (speaking) {
          console.warn('Timeout de seguridad: voz externa no respondió');
          setSpeaking(false);
          window.speechSynthesis.cancel();
        }
      }, 5000); // 5 segundos de timeout para voces externas
    }    utterance.onerror = (event) => {
      console.warn('Error en síntesis de voz:', {
        error: event.error,
        voice: finalVoice?.name || 'default',
        text: processedText.substring(0, 50)
      });
      setSpeaking(false);
      
      // Limpiar timeout de seguridad si existe
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      
      // Intentar con voz por defecto solo si falló con voz personalizada y no es un reintento
      if (finalVoice && event.error === 'voice-unavailable' && !options.isRetry) {
        console.log('Reintentando con voz por defecto...');
        setTimeout(() => {
          speak(text, { ...options, voice: undefined, isRetry: true });
        }, 100);
      } else if (event.error === 'network' || event.error === 'synthesis-failed') {
        // Para errores de red o síntesis, también intentar con voz local
        console.log('Error de red/síntesis, reintentando con voz local...');
        setTimeout(() => {
          // Buscar una voz local como respaldo
          const localVoice = spanishVoices.find(v => v.isLocal)?.voice;
          speak(text, { ...options, voice: localVoice, isRetry: true });
        }, 100);
      }
    };

    utteranceRef.current = utterance;
    
    // Pequeño delay para mejorar la confiabilidad en algunos navegadores
    setTimeout(() => {
      if (utteranceRef.current && window.speechSynthesis) {
        try {
          window.speechSynthesis.speak(utteranceRef.current);
        } catch (error) {
          console.error('Error al ejecutar speech synthesis:', error);
          setSpeaking(false);        }
      }
    }, 10);
  }, [supported, selectedVoice, voiceSettings, speaking, spanishVoices]);

  const cancel = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      queueRef.current = [];
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  // Función para actualizar configuraciones de voz
  const updateVoiceSettings = useCallback((newSettings: Partial<SpeechOptions>) => {
    setVoiceSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  // Función para cambiar voz manualmente y guardar preferencia
  const changeVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setSelectedVoice(voice);
    if (voice) {
      setVoiceSettings(prev => ({
        ...prev,
        voice,
        lang: voice.lang
      }));
      
      // Guardar voz preferida
      savePreferredVoice(voice);
    }
  }, []);

  return {
    speak,
    speaking,
    supported,
    cancel,
    pause,
    resume,
    voices,
    spanishVoices,
    selectedVoice,
    setSelectedVoice: changeVoice,
    voiceSettings,
    updateVoiceSettings
  };
};
