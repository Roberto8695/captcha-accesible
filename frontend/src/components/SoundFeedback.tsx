'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SoundFeedbackProps {
  enabled: boolean;
}

// Definir tipos para las funciones de sonido
interface AccessibilitySounds {
  success: () => void;
  error: () => void;
  focus: () => void;
  click: () => void;
  navigation: () => void;
  warning: () => void;
}

// Extender window para incluir accessibilitySounds
declare global {
  interface Window {
    accessibilitySounds?: AccessibilitySounds;
  }
}

export const SoundFeedback: React.FC<SoundFeedbackProps> = ({ enabled }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      try {
        // Crear AudioContext de manera compatible
        if (window.AudioContext) {
          audioContextRef.current = new window.AudioContext();
        } else {
          const webkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (webkitAudioContext) {
            audioContextRef.current = new webkitAudioContext();
          }
        }
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled]);

  const playSound = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [enabled]);

  // Exponer funciones de sonido globalmente para uso en otros componentes
  useEffect(() => {
    if (enabled) {
      window.accessibilitySounds = {
        success: () => playSound(800, 0.2),
        error: () => playSound(300, 0.3),
        focus: () => playSound(600, 0.1),
        click: () => playSound(1000, 0.05),
        navigation: () => playSound(400, 0.1),
        warning: () => playSound(450, 0.25)
      };
    } else {
      window.accessibilitySounds = {
        success: () => {},
        error: () => {},
        focus: () => {},
        click: () => {},
        navigation: () => {},
        warning: () => {}
      };
    }

    return () => {
      delete window.accessibilitySounds;
    };
  }, [enabled, playSound]);

  return null; // Este componente no renderiza nada visible
};

// Funciones utilitarias para reproducir sonidos específicos
export const playSuccessSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.success();
  }
};

export const playErrorSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.error();
  }
};

export const playFocusSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.focus();
  }
};

export const playClickSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.click();
  }
};

export const playNavigationSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.navigation();
  }
};

export const playWarningSound = () => {
  if (typeof window !== 'undefined' && window.accessibilitySounds) {
    window.accessibilitySounds.warning();
  }
};
