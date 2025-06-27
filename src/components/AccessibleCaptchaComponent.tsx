"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { playSuccessSound, playErrorSound } from './SoundFeedback';

interface CaptchaComponentProps {
  onVerificationChange: (isVerified: boolean) => void;
  isHighContrast?: boolean;
  fontSize?: string;
}

type CaptchaMethod = 'audio' | 'sequence' | 'pattern' | 'story';

interface AudioChallenge {
  question: string;
  audioFile?: string;
  answer: string;
  hints: string[];
}

interface SequenceChallenge {
  description: string;
  sequence: string[];
  missing: number;
  answer: string;
}

interface PatternChallenge {
  description: string;
  pattern: string;
  answer: string;
}

interface StoryChallenge {
  story: string;
  question: string;
  options: string[];
  correctIndex: number;
}

type Challenge = AudioChallenge | SequenceChallenge | PatternChallenge | StoryChallenge;

const AccessibleCaptchaComponent: React.FC<CaptchaComponentProps> = ({ 
  onVerificationChange, 
  isHighContrast = false, 
  fontSize = "base" 
}) => {
  const [captchaMethod, setCaptchaMethod] = useState<CaptchaMethod>('audio');
  const [isVerified, setIsVerified] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);  // Función para sintetizar voz con voz optimizada de Google
  const speakText = (text: string, isInitializing: boolean = false) => {
    return new Promise<void>((resolve) => {
      if (!voiceInitialized && !isInitializing) {
        console.log('Voz no inicializada');
        resolve();
        return;
      }

      if ('speechSynthesis' in window) {
        setIsPlaying(true);
        
        // Cancelar síntesis anterior de forma más suave
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          // Esperar más tiempo para que la cancelación se complete
          setTimeout(() => {
            startSpeaking();
          }, 200);
        } else {
          startSpeaking();
        }
        
        function startSpeaking() {
          try {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Buscar la mejor voz de Google en español
            const voices = window.speechSynthesis.getVoices();
            const googleVoices = voices.filter(voice => 
              (voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('chrome')) &&
              (voice.lang.startsWith('es-') || voice.lang === 'es')
            );

            // Prioridad: es-US > es-ES > otras variantes de español
            const priorityOrder = ['es-US', 'es-ES', 'es-MX', 'es-AR', 'es'];
            let bestVoice = null;
            for (const lang of priorityOrder) {
              bestVoice = googleVoices.find(voice => voice.lang === lang);
              if (bestVoice) break;
            }

            if (!bestVoice) {
              bestVoice = voices.find(voice => 
                voice.lang.startsWith('es-') && voice.localService
              ) || voices.find(voice => voice.lang.startsWith('es-'));
            }

            if (bestVoice) {
              utterance.voice = bestVoice;
              utterance.lang = bestVoice.lang;
            } else {
              utterance.lang = 'es-US';
            }
            
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onend = () => {
              setIsPlaying(false);
              resolve();
            };
            
            utterance.onerror = (event) => {
              setIsPlaying(false);
              // No tratar 'interrupted' o 'canceled' como errores críticos
              if (event.error === 'interrupted' || event.error === 'canceled') {
                console.log(`Síntesis ${event.error} (normal)`);
                resolve(); // Resolver en lugar de rechazar
              } else {
                console.warn(`Error en síntesis de voz: ${event.error}`);
                resolve(); // Resolver en lugar de rechazar para no romper el flujo
              }
            };
            
            // Intentar hablar
            window.speechSynthesis.speak(utterance);
            
            // Timeout de seguridad
            setTimeout(() => {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
              }
              setIsPlaying(false);
              resolve();
            }, 10000); // 10 segundos máximo
            
          } catch (error) {
            setIsPlaying(false);
            console.warn(`Error al iniciar síntesis: ${error}`);
            resolve(); // Resolver en lugar de rechazar
          }
        }
      } else {
        setIsPlaying(false);
        console.warn('Su navegador no soporta síntesis de voz.');
        resolve(); // Resolver en lugar de rechazar
      }
    });
  };  // Inicializar voz (requiere interacción del usuario)
  const initializeVoice = async () => {
    if (voiceInitialized) return;
    
    setVoiceLoading(true);
    setErrorMessage('');
    
    try {
      // Verificar soporte de síntesis de voz
      if (!('speechSynthesis' in window)) {
        throw new Error('Su navegador no soporta síntesis de voz');
      }

      // Cancelar cualquier síntesis en curso
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Esperar un poco para que se complete la cancelación
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Esperar a que las voces se carguen
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          let attempts = 0;
          const checkVoices = () => {
            attempts++;
            if (window.speechSynthesis.getVoices().length > 0 || attempts > 20) {
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }
      
      // Hacer una prueba de voz más simple para activar la API
      try {
        await speakText('Voz lista', true);
        setVoiceInitialized(true);
        setErrorMessage('');
        console.log('Voz inicializada correctamente');
      } catch (speechError) {
        // Si la prueba de voz falla, aún marcamos como inicializada
        // para permitir intentos posteriores
        console.warn('Prueba de voz falló, pero marcando como inicializada:', speechError);
        setVoiceInitialized(true);
        setErrorMessage('');
      }
      
    } catch (error) {
      console.error('Error al inicializar voz:', error);
      setErrorMessage('Error al inicializar la voz. Su navegador puede no soportar esta función.');
      // No marcar como inicializada en caso de error grave
    } finally {
      setVoiceLoading(false);
    }
  };

  // Generar desafío de audio
  const generateAudioChallenge = (): AudioChallenge => {
    const challenges = [
      {
        question: "¿Cuántos días tiene una semana?",
        answer: "7",
        hints: [
          "Piense en los días laborales más el fin de semana",
          "De lunes a domingo",
          "Son exactamente 7 días"
        ]
      },
      {
        question: "¿Cuál es el color que se forma mezclando azul y amarillo?",
        answer: "verde",
        hints: [
          "Es el color de la hierba",
          "Es un color primario en la naturaleza",
          "Rima con 'sede'"
        ]
      },
      {
        question: "¿Cuántas patas tiene un gato?",
        answer: "4",
        hints: [
          "Los gatos son mamíferos de cuatro patas",
          "Es menos de 5 pero más de 3",
          "El mismo número que un perro"
        ]
      },
      {
        question: "¿En qué estación del año caen las hojas?",
        answer: "otoño",
        hints: [
          "Es después del verano",
          "Los árboles se preparan para el invierno",
          "También se llama 'autumn' en inglés"
        ]
      },
      {
        question: "¿Qué animal hace 'miau'?",
        answer: "gato",
        hints: [
          "Es una mascota doméstica",
          "Le gusta la leche",
          "Caza ratones"
        ]
      },
      {
        question: "¿Cuántos minutos tiene una hora?",
        answer: "60",
        hints: [
          "Es un número redondo",
          "Sesenta minutos",
          "La mitad de 120"
        ]
      },
      {
        question: "¿Qué fruta es roja y se asocia con los maestros?",
        answer: "manzana",
        hints: [
          "Es una fruta muy común",
          "Puede ser roja, verde o amarilla",
          "Se dice que 'una al día mantiene alejado al doctor'"
        ]
      },
      {
        question: "¿Cuál es el primer día de la semana?",
        answer: "lunes",
        hints: [
          "Es después del domingo",
          "Muchas personas lo consideran el inicio de la semana laboral",
          "En inglés es 'Monday'"
        ]
      }
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Generar desafío de secuencia
  const generateSequenceChallenge = (): SequenceChallenge => {
    const sequences = [
      {
        description: "Complete la secuencia numérica simple: 1, 2, 3, 4, ?",
        sequence: ["1", "2", "3", "4"],
        missing: 4,
        answer: "5"
      },
      {
        description: "Complete los días de la semana: Lunes, Martes, ?",
        sequence: ["Lunes", "Martes"],
        missing: 2,
        answer: "miércoles"
      },
      {
        description: "Complete la secuencia: 10, 20, 30, ?",
        sequence: ["10", "20", "30"],
        missing: 3,
        answer: "40"
      },
      {
        description: "Complete las estaciones: Primavera, Verano, Otoño, ?",
        sequence: ["Primavera", "Verano", "Otoño"],
        missing: 3,
        answer: "invierno"
      },
      {
        description: "Complete la secuencia de colores del semáforo: Rojo, Amarillo, ?",
        sequence: ["Rojo", "Amarillo"],
        missing: 2,
        answer: "verde"
      }
    ];
    
    return sequences[Math.floor(Math.random() * sequences.length)];
  };

  // Generar desafío de patrón
  const generatePatternChallenge = (): PatternChallenge => {
    const patterns = [
      {
        description: "¿Qué tienen en común: Manzana, Naranja, Plátano?",
        pattern: "Son todas frutas",
        answer: "frutas"
      },
      {
        description: "¿Qué tienen en común: Coche, Bicicleta, Autobús?",
        pattern: "Son medios de transporte",
        answer: "transporte"
      },
      {
        description: "¿Qué tienen en común: Mesa, Silla, Sofá?",
        pattern: "Son muebles",
        answer: "muebles"
      },
      {
        description: "¿Qué tienen en común: Rojo, Azul, Verde?",
        pattern: "Son colores",
        answer: "colores"
      },
      {
        description: "¿Qué tienen en común: Lunes, Martes, Miércoles?",
        pattern: "Son días de la semana",
        answer: "días"
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  };
  // Generar desafío de historia
  const generateStoryChallenge = (): StoryChallenge => {
    const stories = [
      {
        story: "Juan tiene sed y va a la cocina.",
        question: "¿Qué es lo más probable que busque Juan?",
        options: ["Agua", "Un libro", "Sus llaves", "Una pelota"],
        correctIndex: 0
      },
      {
        story: "María escucha que llueve fuerte afuera y va a salir.",
        question: "¿Qué debería llevar María?",
        options: ["Gafas de sol", "Paraguas", "Shorts", "Sandalias"],
        correctIndex: 1
      },
      {
        story: "Pedro está en la biblioteca y quiere leer.",
        question: "¿Qué necesita Pedro?",
        options: ["Una pelota", "Un libro", "Comida", "Música"],
        correctIndex: 1
      },
      {
        story: "Ana tiene hambre y va a la cocina.",
        question: "¿Qué busca Ana?",
        options: ["Un teléfono", "Ropa", "Comida", "Un juguete"],
        correctIndex: 2
      },
      {
        story: "Luis quiere enviar una carta y va a la oficina de correos.",
        question: "¿Qué necesita comprar Luis?",
        options: ["Un sello", "Pan", "Leche", "Flores"],
        correctIndex: 0
      },
      {
        story: "Carmen está muy cansada después del trabajo.",
        question: "¿Qué es lo más probable que quiera hacer Carmen?",
        options: ["Correr", "Dormir", "Estudiar", "Cocinar"],
        correctIndex: 1
      }
    ];
    
    const selectedStory = stories[Math.floor(Math.random() * stories.length)];
    
    // Verificar que el objeto tiene todas las propiedades requeridas
    if (!selectedStory.story || !selectedStory.question || !selectedStory.options || selectedStory.correctIndex === undefined) {
      // Fallback en caso de error
      return {
        story: "Un error ocurrió al cargar la historia.",
        question: "¿Puede intentar refrescar la página?",
        options: ["Sí", "No", "Tal vez", "Más tarde"],
        correctIndex: 0
      };
    }
    
    return selectedStory;
  };
  // Generar nuevo desafío según el método seleccionado
  const generateNewChallenge = useCallback(() => {
    setUserAnswer('');
    setErrorMessage('');
    setCurrentHintIndex(0);
    
    switch (captchaMethod) {
      case 'audio':
        setCurrentChallenge(generateAudioChallenge());
        break;
      case 'sequence':
        setCurrentChallenge(generateSequenceChallenge());
        break;
      case 'pattern':
        setCurrentChallenge(generatePatternChallenge());
        break;
      case 'story':
        setCurrentChallenge(generateStoryChallenge());
        break;      default:
        setCurrentChallenge(generateAudioChallenge());
    }
  }, [captchaMethod]);  // Leer el desafío actual
  const readChallenge = async () => {
    if (!currentChallenge) return;
    
    if (!voiceInitialized) {
      setErrorMessage('Primero debe inicializar la voz haciendo clic en "Activar Voz".');
      return;
    }
    
    try {
      setErrorMessage(''); // Limpiar errores previos
      
      switch (captchaMethod) {
        case 'audio':
          const audioChallenge = currentChallenge as AudioChallenge;
          await speakText(audioChallenge.question);
          
          if (audioChallenge.question.includes('clicks')) {
            // Simular clicks para el desafío de audio de manera secuencial
            await new Promise(resolve => setTimeout(resolve, 500));
            await speakText('Click');
            await new Promise(resolve => setTimeout(resolve, 500));
            await speakText('Click');
            await new Promise(resolve => setTimeout(resolve, 500));
            await speakText('Click');
          }
          break;
          
        case 'sequence':
          const sequenceChallenge = currentChallenge as SequenceChallenge;
          await speakText(sequenceChallenge.description);
          break;
          
        case 'pattern':
          const patternChallenge = currentChallenge as PatternChallenge;
          await speakText(patternChallenge.description);
          break;
          
        case 'story':
          const storyChallenge = currentChallenge as StoryChallenge;
          // Leer historia completa de manera secuencial
          await speakText(storyChallenge.story);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await speakText(storyChallenge.question);
          await new Promise(resolve => setTimeout(resolve, 500));          
          const optionsText = storyChallenge.options?.map((option, index) => 
            `Opción ${index + 1}: ${option}`
          ).join('. ') || 'No hay opciones disponibles';
          await speakText(`Las opciones son: ${optionsText}`);
          break;
      }    } catch (error) {
      console.error('Error al leer desafío:', error);
      // Solo mostrar error si no fue una interrupción intencional
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('interrupted')) {
        setErrorMessage('Error al reproducir audio. Verifique que la voz esté funcionando correctamente.');
      }
    }
  };
  // Mostrar pista
  const showHint = async () => {
    if (!voiceInitialized) {
      setErrorMessage('Primero debe inicializar la voz haciendo clic en "Activar Voz".');
      return;
    }
    
    if (captchaMethod === 'audio' && currentChallenge) {
      const audioChallenge = currentChallenge as AudioChallenge;
      if (currentHintIndex < audioChallenge.hints.length) {
        try {
          await speakText(`Pista ${currentHintIndex + 1}: ${audioChallenge.hints[currentHintIndex]}`);
          setCurrentHintIndex(prev => prev + 1);
        } catch (error) {
          console.error('Error al mostrar pista:', error);
          setErrorMessage('Error al reproducir la pista.');
        }
      }
    }
  };

  // Verificar respuesta
  const verifyAnswer = async () => {
    if (!currentChallenge) return;
    
    let isCorrect = false;
    let correctAnswer = '';
    
    switch (captchaMethod) {
      case 'audio':
        const audioChallenge = currentChallenge as AudioChallenge;
        correctAnswer = audioChallenge.answer.toLowerCase();
        isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;
        break;
        
      case 'sequence':
        const sequenceChallenge = currentChallenge as SequenceChallenge;
        correctAnswer = sequenceChallenge.answer.toLowerCase();
        isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;
        break;
        
      case 'pattern':
        const patternChallenge = currentChallenge as PatternChallenge;
        correctAnswer = patternChallenge.answer.toLowerCase();
        isCorrect = userAnswer.toLowerCase().includes(correctAnswer) || 
                   correctAnswer.includes(userAnswer.toLowerCase().trim());
        break;
        
      case 'story':
        const storyChallenge = currentChallenge as StoryChallenge;
        const selectedIndex = parseInt(userAnswer) - 1;
        isCorrect = selectedIndex === storyChallenge.correctIndex;
        break;
    }    if (isCorrect) {
      setIsVerified(true);
      setErrorMessage('');
      onVerificationChange(true);
      if (voiceInitialized) {
        try {
          await speakText('¡Excelente! Verificación completada correctamente. Captcha resuelto exitosamente.');
        } catch (error) {
          console.error('Error al reproducir mensaje de éxito:', error);
        }
      }
      playSuccessSound();
    } else {
      setAttempts(prev => prev + 1);
      setErrorMessage(`Respuesta incorrecta. Intento ${attempts + 1} de 3.`);
      if (voiceInitialized) {
        try {
          await speakText(`Respuesta incorrecta. ${3 - attempts - 1} intentos restantes. Intente de nuevo.`);
        } catch (error) {
          console.error('Error al reproducir mensaje de error:', error);
        }
      }
      playErrorSound();
      
      if (attempts >= 2) {
        generateNewChallenge();
        setAttempts(0);
        if (voiceInitialized) {
          try {
            await speakText('Se ha generado un nuevo desafío después de 3 intentos fallidos.');
          } catch (error) {
            console.error('Error al reproducir mensaje de nuevo desafío:', error);
          }
        }
      }
    }
  };

  // Cambiar método de captcha
  const changeCaptchaMethod = (method: CaptchaMethod) => {
    setCaptchaMethod(method);
    setIsVerified(false);
    setAttempts(0);
    onVerificationChange(false);
  };  // Efectos
  useEffect(() => {
    // Inicializar voces automáticamente cuando estén disponibles
    const loadVoices = () => {
      if (window.speechSynthesis.getVoices().length > 0 && !voiceInitialized && !voiceLoading) {
        // No inicializar automáticamente, esperar click del usuario
        // Solo preparar el sistema
      }
    };

    if ('speechSynthesis' in window) {
      // Cargar voces inmediatamente si están disponibles
      loadVoices();
      // Escuchar cuando las voces se carguen
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [voiceInitialized, voiceLoading]);

  useEffect(() => {
    generateNewChallenge();
  }, [captchaMethod, generateNewChallenge]);
  useEffect(() => {
    if (inputRef.current && errorMessage) {
      inputRef.current.focus();
    }
  }, [errorMessage]);

  // Cleanup: detener voz al desmontar componente
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Función para detener la síntesis de voz
  const stopSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Clases CSS responsivas
  const getContainerClasses = () => {
    return `w-full max-w-2xl mx-auto p-6 rounded-lg border-2 transition-all duration-300 ${
      isHighContrast 
        ? 'bg-black border-white text-white' 
        : isVerified 
          ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-600' 
          : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600'
    }`;
  };

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  if (!currentChallenge) {
    return (
      <div className={getContainerClasses()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={getFontSizeClasses()}>Cargando captcha accesible...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className={`text-xl font-bold mb-2 ${getFontSizeClasses()} ${
          isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>
          🔐 Captcha Accesible Avanzado
        </h3>
        <p className={`${getFontSizeClasses()} ${
          isHighContrast ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'
        }`}>
          Sistema de verificación diseñado para máxima accesibilidad
        </p>
      </div>

      {/* Botones de método de captcha */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { method: 'audio' as CaptchaMethod, label: '🎵 Audio', desc: 'Desafíos auditivos' },
          { method: 'sequence' as CaptchaMethod, label: '🔢 Secuencia', desc: 'Completar patrones' },
          { method: 'pattern' as CaptchaMethod, label: '🧩 Patrón', desc: 'Reconocer similitudes' },
          { method: 'story' as CaptchaMethod, label: '📖 Historia', desc: 'Comprensión narrativa' }
        ].map(({ method, label, desc }) => (
          <button
            key={method}
            onClick={() => changeCaptchaMethod(method)}
            disabled={isVerified}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              captchaMethod === method
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : isHighContrast
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            } ${isVerified ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={`${label}: ${desc}`}
          >
            <div className="font-bold">{label}</div>
            <div className="text-xs opacity-75">{desc}</div>
          </button>
        ))}
      </div>      {/* Inicialización de voz */}
      {!voiceInitialized && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                🎤 {voiceLoading ? 'Inicializando Voz...' : 'Inicializar Voz'}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {voiceLoading 
                  ? 'Preparando el sistema de síntesis de voz...' 
                  : 'Haga clic para activar la síntesis de voz'}
              </p>
            </div>
            <button
              onClick={initializeVoice}
              disabled={voiceLoading}
              className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                voiceLoading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {voiceLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cargando...
                </>
              ) : (
                'Activar Voz'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Estado de voz inicializada */}
      {voiceInitialized && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            ✅ <strong>Voz inicializada correctamente</strong> - Sistema de audio listo
          </p>
        </div>
      )}

      {/* Área del desafío */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className={`font-semibold ${getFontSizeClasses()}`}>
            Desafío Actual: {captchaMethod === 'audio' ? 'Audio' : 
                           captchaMethod === 'sequence' ? 'Secuencia' :
                           captchaMethod === 'pattern' ? 'Patrón' : 'Historia'}
          </h4>
          <div className="flex gap-2">            <button
              onClick={isPlaying ? stopSpeaking : readChallenge}
              disabled={!voiceInitialized}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isPlaying 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlaying ? '⏹️ Detener' : '🔊 Escuchar'}
            </button>
            {captchaMethod === 'audio' && (
              <button
                onClick={showHint}
                disabled={!voiceInitialized || currentHintIndex >= 3}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💡 Pista ({currentHintIndex}/3)
              </button>
            )}
          </div>
        </div>

        {/* Mostrar texto del desafío */}
        <div className={`p-3 bg-white dark:bg-gray-800 rounded border ${getFontSizeClasses()}`}>
          {captchaMethod === 'audio' && (
            <p>{(currentChallenge as AudioChallenge).question}</p>
          )}
          {captchaMethod === 'sequence' && (
            <p>{(currentChallenge as SequenceChallenge).description}</p>
          )}
          {captchaMethod === 'pattern' && (
            <p>{(currentChallenge as PatternChallenge).description}</p>
          )}          {captchaMethod === 'story' && (
            <div>
              <p className="mb-3 italic">{(currentChallenge as StoryChallenge).story}</p>
              <p className="font-medium">{(currentChallenge as StoryChallenge).question}</p>
              <div className="mt-2 grid gap-1">
                {(currentChallenge as StoryChallenge).options?.map((option, index) => (
                  <p key={index} className="text-sm">
                    <span className="font-bold">{index + 1}.</span> {option}
                  </p>
                )) || <p className="text-sm text-red-500">Error: No se pudieron cargar las opciones</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campo de respuesta */}
      <div className="mb-6">
        <label 
          htmlFor="captcha-answer" 
          className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}
        >
          Su respuesta:
          {captchaMethod === 'story' && (
            <span className="text-xs font-normal ml-2">(Escriba el número de la opción: 1, 2, 3, o 4)</span>
          )}
        </label>
        <input
          ref={inputRef}
          type="text"
          id="captcha-answer"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && verifyAnswer()}
          disabled={isVerified}
          className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${getFontSizeClasses()} ${
            isHighContrast 
              ? 'bg-gray-800 border-gray-400 text-white' 
              : errorMessage 
                ? 'border-red-500 focus:border-red-600 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600'
          } focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder={
            captchaMethod === 'story' 
              ? "Escriba el número de la opción (1-4)" 
              : "Escriba su respuesta aquí"
          }
          aria-describedby="answer-help"
          aria-invalid={!!errorMessage}
        />
        <p id="answer-help" className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Presione Enter para verificar o use el botón &ldquo;Verificar&rdquo;
        </p>
      </div>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded" role="alert">
          <p className={`text-red-700 dark:text-red-300 font-medium ${getFontSizeClasses()}`}>
            ⚠️ {errorMessage}
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={verifyAnswer}
          disabled={!userAnswer.trim() || isVerified || !voiceInitialized}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${getFontSizeClasses()} ${
            isVerified
              ? 'bg-green-600 text-white cursor-not-allowed opacity-75'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
          } disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-200`}
        >
          {isVerified ? '✅ Verificado' : '🔍 Verificar Respuesta'}
        </button>
        
        <button
          onClick={generateNewChallenge}
          disabled={isVerified}
          className={`sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${getFontSizeClasses()} ${
            isHighContrast 
              ? 'bg-gray-600 text-white hover:bg-gray-500' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-200`}
        >
          🔄 Nuevo Desafío
        </button>
      </div>

      {/* Estado verificado */}
      {isVerified && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className={`text-green-700 dark:text-green-300 font-semibold ${getFontSizeClasses()}`}>
                ¡Verificación Exitosa!
              </p>
              <p className={`text-green-600 dark:text-green-400 text-sm ${getFontSizeClasses()}`}>
                Captcha completado correctamente. Puede continuar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información de accesibilidad */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
        <h5 className={`font-semibold mb-2 text-blue-900 dark:text-blue-300 ${getFontSizeClasses()}`}>
          🌟 Características de Accesibilidad
        </h5>
        <ul className={`text-blue-800 dark:text-blue-200 text-sm space-y-1 ${getFontSizeClasses()}`}>
          <li>• <strong>Múltiples métodos:</strong> Audio, secuencias, patrones e historias</li>
          <li>• <strong>Síntesis de voz:</strong> Lectura automática de desafíos</li>
          <li>• <strong>Pistas progresivas:</strong> Ayuda adicional cuando es necesaria</li>
          <li>• <strong>Alto contraste:</strong> Compatible con preferencias visuales</li>
          <li>• <strong>Navegación por teclado:</strong> Funciona completamente sin ratón</li>
          <li>• <strong>Lectores de pantalla:</strong> Optimizado para NVDA, JAWS y VoiceOver</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibleCaptchaComponent;
