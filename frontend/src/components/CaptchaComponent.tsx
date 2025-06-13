"use client";

import { useState, useEffect, useRef } from "react";
import { playSuccessSound, playErrorSound } from './SoundFeedback';

interface CaptchaComponentProps {
  onVerificationChange: (isVerified: boolean) => void;
  isHighContrast?: boolean;
  fontSize?: string;
}

type CaptchaType = 'math' | 'logic';

interface MathChallenge {
  question: string;
  answer: number;
  audioText: string;
}

interface LogicChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  audioText: string;
}

const CaptchaComponent: React.FC<CaptchaComponentProps> = ({ 
  onVerificationChange, 
  isHighContrast = false, 
  fontSize = "base" 
}) => {
  const [captchaType, setCaptchaType] = useState<CaptchaType>('math');
  const [isVerified, setIsVerified] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<MathChallenge | LogicChallenge | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Generar desafío matemático simple
  const generateMathChallenge = (): MathChallenge => {
    const operations = [
      { type: 'add', symbol: '+' },
      { type: 'subtract', symbol: '-' },
      { type: 'multiply', symbol: '×' }
    ];
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer, question, audioText;
    
    switch (operation.type) {
      case 'add':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        question = `${num1} ${operation.symbol} ${num2} = ?`;
        audioText = `¿Cuánto es ${num1} más ${num2}?`;
        break;
      case 'subtract':
        num1 = Math.floor(Math.random() * 30) + 10;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
        question = `${num1} ${operation.symbol} ${num2} = ?`;
        audioText = `¿Cuánto es ${num1} menos ${num2}?`;
        break;
      case 'multiply':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} ${operation.symbol} ${num2} = ?`;
        audioText = `¿Cuánto es ${num1} por ${num2}?`;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
        question = "5 + 3 = ?";
        audioText = "¿Cuánto es 5 más 3?";
    }
    
    return { question, answer, audioText };
  };

  // Generar desafío de lógica simple
  const generateLogicChallenge = (): LogicChallenge => {
    const challenges = [
      {
        question: "¿Cuál de estos es un animal?",
        options: ["Mesa", "Perro", "Libro", "Teléfono"],
        correctIndex: 1,
        audioText: "¿Cuál de estas opciones es un animal? Mesa, Perro, Libro, o Teléfono?"
      },
      {
        question: "¿Cuál es un color primario?",
        options: ["Verde", "Naranja", "Rojo", "Morado"],
        correctIndex: 2,
        audioText: "¿Cuál de estos es un color primario? Verde, Naranja, Rojo, o Morado?"
      },
      {
        question: "¿Cuántos días tiene una semana?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
        audioText: "¿Cuántos días tiene una semana? 5, 6, 7, u 8?"
      },
      {
        question: "¿En qué estación del año hace más calor?",
        options: ["Primavera", "Verano", "Otoño", "Invierno"],
        correctIndex: 1,
        audioText: "¿En qué estación del año hace más calor? Primavera, Verano, Otoño, o Invierno?"
      }
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  };
  // Función para sintetizar voz con voz optimizada de Google
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      window.speechSynthesis.cancel();
      
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

      // Si no hay voces de Google, buscar cualquier voz clara en español
      if (!bestVoice) {
        bestVoice = voices.find(voice => 
          voice.lang.startsWith('es-') && voice.localService
        ) || voices.find(voice => voice.lang.startsWith('es-'));
      }

      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = 'es-US'; // Fallback
      }
      
      // Configuración optimizada para claridad y velocidad
      utterance.rate = 0.9; // Velocidad ligeramente reducida para mejor comprensión
      utterance.pitch = 1.0; // Tono neutro
      utterance.volume = 1.0; // Volumen máximo
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Su navegador no soporta síntesis de voz. Por favor, use la opción de texto.');
    }
  };

  // Generar nuevo desafío
  const generateNewChallenge = () => {
    setUserAnswer('');
    setErrorMessage('');
    
    if (captchaType === 'math') {
      setCurrentChallenge(generateMathChallenge());
    } else if (captchaType === 'logic') {
      setCurrentChallenge(generateLogicChallenge());
    }
  };

  // Verificar respuesta
  const verifyAnswer = () => {
    if (!currentChallenge) return;
    
    let isCorrect = false;
    
    if (captchaType === 'math') {
      const mathChallenge = currentChallenge as MathChallenge;
      isCorrect = parseInt(userAnswer) === mathChallenge.answer;
    } else if (captchaType === 'logic') {
      const logicChallenge = currentChallenge as LogicChallenge;
      const selectedIndex = parseInt(userAnswer);
      isCorrect = selectedIndex === logicChallenge.correctIndex;
    }

    if (isCorrect) {
      setIsVerified(true);
      setErrorMessage('');
      onVerificationChange(true);
      speakText('¡Verificación exitosa! Captcha completado correctamente.');
      playSuccessSound();
      
      const successElement = document.createElement('div');
      successElement.setAttribute('aria-live', 'assertive');
      successElement.className = 'sr-only';
      successElement.textContent = 'Captcha verificado exitosamente';
      document.body.appendChild(successElement);
      
      setTimeout(() => document.body.removeChild(successElement), 3000);
    } else {
      setAttempts(prev => prev + 1);
      setErrorMessage('Respuesta incorrecta. Por favor, inténtelo de nuevo.');
      setUserAnswer('');
      playErrorSound();
      
      if (attempts >= 2) {
        generateNewChallenge();
        setAttempts(0);
        speakText('Demasiados intentos incorrectos. Se ha generado un nuevo desafío.');
      } else {
        speakText('Respuesta incorrecta. Por favor, inténtelo de nuevo.');
      }
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Cambiar tipo de captcha
  const changeCaptchaType = (type: CaptchaType) => {
    setCaptchaType(type);
    setIsVerified(false);
    setUserAnswer('');
    setAttempts(0);
    setErrorMessage('');
    onVerificationChange(false);
  };

  // Inicializar desafío
  useEffect(() => {
    const timer = setTimeout(() => generateNewChallenge(), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaType]);

  // Inicialización al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => generateNewChallenge(), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar Enter en input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim() && !isVerified) {
      verifyAnswer();
    }
  };

  // Clases dinámicas
  const getContainerClasses = () => {
    const baseClasses = "border-2 rounded-lg p-6 transition-all duration-300";
    const contrastClasses = isHighContrast
      ? "bg-gray-900 border-white text-white"
      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600";
    const successClasses = isVerified ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "";
    return `${baseClasses} ${contrastClasses} ${successClasses}`;
  };

  const getButtonClasses = (active = false) => {
    const baseClasses = "px-3 py-2 rounded text-sm font-medium transition-all duration-200 focus:ring-2 focus:outline-none";
    const activeClasses = active 
      ? (isHighContrast ? "bg-white text-black" : "bg-blue-600 text-white")
      : (isHighContrast ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500");
    return `${baseClasses} ${activeClasses}`;
  };

  const getFontSizeClasses = () => {
    switch(fontSize) {
      case "small": return "text-sm";
      case "large": return "text-lg";
      default: return "text-base";
    }
  };

  return (
    <div className={getContainerClasses()}>
      <div className="space-y-4">
        {/* Header del Captcha */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 flex items-center justify-center ${getFontSizeClasses()}`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.25-4.5l-2.36 2.36a8.5 8.5 0 11-1.47 1.47l2.36-2.36A8.5 8.5 0 1021.75 7.5z" />
            </svg>
            Verificación Accesible
          </h3>
          <p className={`text-sm ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'} ${getFontSizeClasses()}`}>
            Elija su método preferido de verificación
          </p>
        </div>

        {/* Selector de Tipo de Captcha */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => changeCaptchaType('math')}
            className={getButtonClasses(captchaType === 'math')}
            aria-pressed={captchaType === 'math'}
          >
            🔢 Matemáticas
          </button>
          <button
            onClick={() => changeCaptchaType('logic')}
            className={getButtonClasses(captchaType === 'logic')}
            aria-pressed={captchaType === 'logic'}
          >
            🧠 Lógica
          </button>
        </div>

        {/* Área del Desafío */}
        {currentChallenge && !isVerified && (
          <div className="space-y-4">
            {/* Pregunta Visual */}
            <div className={`p-4 rounded border ${isHighContrast ? 'border-gray-400 bg-gray-800' : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'}`}>
              <p className={`text-center font-medium mb-3 ${getFontSizeClasses()}`}>
                {currentChallenge.question}
              </p>

              {/* Opciones para lógica */}
              {captchaType === 'logic' && 'options' in currentChallenge && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(currentChallenge as LogicChallenge).options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setUserAnswer(index.toString())}
                      className={`p-2 rounded border text-sm transition-all ${getFontSizeClasses()}
                        ${userAnswer === index.toString() 
                          ? (isHighContrast ? 'bg-white text-black border-white' : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200')
                          : (isHighContrast ? 'bg-gray-700 border-gray-400 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500')
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Input para matemáticas */}
              {captchaType === 'math' && (
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escriba su respuesta"
                  className={`w-full px-3 py-2 border rounded text-center transition-all ${getFontSizeClasses()}
                    ${isHighContrast 
                      ? 'bg-black border-white text-white placeholder:text-gray-300' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                  aria-describedby="math-help"
                />
              )}
            </div>

            {/* Controles de Audio */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => speakText(currentChallenge.audioText)}
                disabled={isPlaying}
                className={`flex items-center justify-center px-4 py-2 rounded font-medium transition-all ${getFontSizeClasses()}
                  ${isPlaying ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'}
                  ${isHighContrast 
                    ? 'bg-gray-700 text-white border border-white hover:bg-gray-600' 
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-200'
                  }`}
                aria-label="Escuchar pregunta en audio"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 9a3 3 0 000 6v-6z" />
                </svg>
                {isPlaying ? 'Reproduciendo...' : '🔊 Escuchar'}
              </button>

              <button
                onClick={generateNewChallenge}
                className={`flex items-center justify-center px-4 py-2 rounded font-medium transition-all ${getFontSizeClasses()}
                  ${isHighContrast 
                    ? 'bg-gray-700 text-white border border-white hover:bg-gray-600' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-200'
                  }`}
                aria-label="Generar nueva pregunta"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                🔄 Nueva Pregunta
              </button>
            </div>

            {/* Botón de Verificación */}
            <button
              onClick={verifyAnswer}
              disabled={!userAnswer.trim()}
              className={`w-full py-3 px-6 rounded font-semibold transition-all ${getFontSizeClasses()}
                ${!userAnswer.trim() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }
                ${isHighContrast 
                  ? 'bg-white text-black hover:bg-gray-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
                }`}
            >
              ✓ Verificar Respuesta
            </button>

            {/* Mensajes de Error */}
            {errorMessage && (
              <div 
                role="alert" 
                aria-live="polite"
                className="text-red-600 text-center font-medium p-2 bg-red-50 border border-red-200 rounded"
              >
                <span className="mr-1">⚠️</span>
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Estado de Éxito */}
        {isVerified && (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className={`font-semibold text-green-700 dark:text-green-300 ${getFontSizeClasses()}`}>
                ✅ Verificación Exitosa
              </h4>
              <p className={`text-sm text-green-600 dark:text-green-400 ${getFontSizeClasses()}`}>
                Captcha completado correctamente
              </p>
            </div>
            <button
              onClick={() => {
                setIsVerified(false);
                onVerificationChange(false);
                generateNewChallenge();
              }}
              className={`text-sm underline hover:no-underline transition-all ${getFontSizeClasses()}
                ${isHighContrast ? 'text-gray-300 hover:text-white' : 'text-blue-600 hover:text-blue-800 dark:text-blue-400'}`}
            >
              🔄 Realizar nueva verificación
            </button>
          </div>
        )}

        {/* Información de Intentos */}
        {attempts > 0 && !isVerified && (
          <div className={`text-center text-sm ${getFontSizeClasses()}`}>
            <span className={isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}>
              Intento {attempts} de 3
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptchaComponent;