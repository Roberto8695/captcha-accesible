"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CaptchaSelectionModal from '../../components/CaptchaSelectionModal';
import { playSuccessSound, playErrorSound } from '@/components/SoundFeedback';

interface FormData {
  name: string;
  email: string;
  message: string;
  phoneNumber: string;
  preferredContact: 'email' | 'video' | 'text';
}

type CaptchaType = 'pattern' | 'sequence' | 'matching' | 'sorting';

// Tipos específicos para las respuestas de usuario
type PatternAnswer = number;
type SequenceAnswer = number;
type MatchingAnswer = number[];
type SortingAnswer = number[];
type UserAnswer = PatternAnswer | SequenceAnswer | MatchingAnswer | SortingAnswer | null;

interface PatternChallenge {
  type: 'pattern';
  title: string;
  description: string;
  patterns: string[];
  correctPattern: number;
}

interface SequenceChallenge {
  type: 'sequence';
  title: string;
  description: string;
  sequence: string[];
  missingIndex: number;
  options: string[];
  correctOption: number;
}

interface MatchingChallenge {
  type: 'matching';
  title: string;
  description: string;
  items: { id: number; emoji: string; category: string }[];
  targetCategory: string;
}

interface SortingChallenge {
  type: 'sorting';
  title: string;
  description: string;
  items: { id: number; emoji: string; order: number }[];
  currentOrder: number[];
}

type Challenge = PatternChallenge | SequenceChallenge | MatchingChallenge | SortingChallenge;

export default function CaptchaSordosPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
    phoneNumber: "",
    preferredContact: 'email'
  });
  const [currentCaptchaType, setCurrentCaptchaType] = useState<CaptchaType>('pattern');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [userAnswer, setUserAnswer] = useState<UserAnswer>(null);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'base' | 'large'>('base');
  const [showSuccess, setShowSuccess] = useState(false);
  // Referencias
  const formRef = useRef<HTMLFormElement>(null);
  // Generar desafío de patrones
  const generatePatternChallenge = (): PatternChallenge => {
    const challenges = [
      {
        type: 'pattern' as const,
        title: "Patrón Visual",
        description: "Seleccione cuál de las opciones continúa el patrón:",
        patterns: ["🔵", "🔴", "🔵", "🔴", "🔵", "❓"],
        correctPattern: 0 // 🔴 (index 0 in options array)
      },
      {
        type: 'pattern' as const,
        title: "Secuencia de Formas",
        description: "¿Qué forma sigue en la secuencia?",
        patterns: ["⭐", "⬛", "⭐", "⬛", "⭐", "❓"],
        correctPattern: 1 // ⬛ (index 1 in options array)
      },
      {
        type: 'pattern' as const,
        title: "Patrón de Números",
        description: "Complete la secuencia numérica:",
        patterns: ["1️⃣", "3️⃣", "5️⃣", "7️⃣", "❓"],
        correctPattern: 2 // 9️⃣ (index 2 in options array)
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Generar desafío de secuencia
  const generateSequenceChallenge = (): SequenceChallenge => {
    const challenges = [
      {
        type: 'sequence' as const,
        title: "Días de la Semana",
        description: "¿Qué día falta en la secuencia?",
        sequence: ["🌅 Lunes", "🌞 Martes", "❓", "🌤️ Jueves"],
        missingIndex: 2,
        options: ["🌈 Miércoles", "🌙 Viernes", "☀️ Sábado", "🌟 Domingo"],
        correctOption: 0
      },
      {
        type: 'sequence' as const,
        title: "Meses del Año",
        description: "¿Qué mes completa la secuencia?",
        sequence: ["❄️ Enero", "💕 Febrero", "❓", "🌸 Abril"],
        missingIndex: 2,
        options: ["🍃 Marzo", "☀️ Mayo", "🌺 Junio", "🎆 Julio"],
        correctOption: 0
      },
      {
        type: 'sequence' as const,
        title: "Animales por Tamaño",
        description: "Ordene de menor a mayor tamaño:",
        sequence: ["🐁", "❓", "🐕", "🐘"],
        missingIndex: 1,
        options: ["🐱", "🦏", "🐋", "🦒"],
        correctOption: 0
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Generar desafío de emparejamiento
  const generateMatchingChallenge = (): MatchingChallenge => {
    const challenges = [
      {
        type: 'matching' as const,
        title: "Seleccionar Frutas",
        description: "Haga clic en todas las FRUTAS:",
        items: [
          { id: 1, emoji: "🍎", category: "fruta" },
          { id: 2, emoji: "🥕", category: "verdura" },
          { id: 3, emoji: "🍌", category: "fruta" },
          { id: 4, emoji: "🥬", category: "verdura" },
          { id: 5, emoji: "🍊", category: "fruta" },
          { id: 6, emoji: "🍖", category: "carne" },
          { id: 7, emoji: "🍇", category: "fruta" },
          { id: 8, emoji: "🥒", category: "verdura" }
        ],
        targetCategory: "fruta"
      },
      {
        type: 'matching' as const,
        title: "Seleccionar Animales",
        description: "Haga clic en todos los ANIMALES:",
        items: [
          { id: 1, emoji: "🐶", category: "animal" },
          { id: 2, emoji: "🌳", category: "planta" },
          { id: 3, emoji: "🐱", category: "animal" },
          { id: 4, emoji: "🌸", category: "planta" },
          { id: 5, emoji: "🐰", category: "animal" },
          { id: 6, emoji: "🏠", category: "objeto" },
          { id: 7, emoji: "🐸", category: "animal" },
          { id: 8, emoji: "⭐", category: "objeto" }
        ],
        targetCategory: "animal"
      },
      {
        type: 'matching' as const,
        title: "Seleccionar Vehículos",
        description: "Haga clic en todos los VEHÍCULOS:",
        items: [
          { id: 1, emoji: "🚗", category: "vehiculo" },
          { id: 2, emoji: "🏠", category: "edificio" },
          { id: 3, emoji: "🚲", category: "vehiculo" },
          { id: 4, emoji: "🌳", category: "planta" },
          { id: 5, emoji: "✈️", category: "vehiculo" },
          { id: 6, emoji: "🏢", category: "edificio" },
          { id: 7, emoji: "🚢", category: "vehiculo" },
          { id: 8, emoji: "🌺", category: "planta" }
        ],
        targetCategory: "vehiculo"
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Generar desafío de ordenamiento
  const generateSortingChallenge = (): SortingChallenge => {
    const challenges = [
      {
        type: 'sorting' as const,
        title: "Ordenar por Tamaño",
        description: "Ordene de MENOR a MAYOR tamaño (arrastre o haga clic):",
        items: [
          { id: 1, emoji: "🐘", order: 4 },
          { id: 2, emoji: "🐭", order: 1 },
          { id: 3, emoji: "🐕", order: 3 },
          { id: 4, emoji: "🐱", order: 2 }
        ],
        currentOrder: [1, 3, 4, 2] // Orden inicial mezclado
      },
      {
        type: 'sorting' as const,
        title: "Ordenar por Velocidad",
        description: "Ordene de MÁS LENTO a MÁS RÁPIDO:",
        items: [
          { id: 1, emoji: "🚗", order: 3 },
          { id: 2, emoji: "🐌", order: 1 },
          { id: 3, emoji: "✈️", order: 4 },
          { id: 4, emoji: "🚲", order: 2 }
        ],
        currentOrder: [3, 1, 4, 2] // Orden inicial mezclado
      },
      {
        type: 'sorting' as const,
        title: "Ordenar Números",
        description: "Ordene los números de MENOR a MAYOR:",
        items: [
          { id: 1, emoji: "8️⃣", order: 4 },
          { id: 2, emoji: "2️⃣", order: 1 },
          { id: 3, emoji: "5️⃣", order: 3 },
          { id: 4, emoji: "3️⃣", order: 2 }
        ],
        currentOrder: [1, 3, 4, 2] // Orden inicial mezclado
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  // Generar nuevo desafío
  const generateNewChallenge = useCallback(() => {
    setUserAnswer(null);
    setErrors(prev => ({ ...prev, captcha: '' }));
    
    switch (currentCaptchaType) {
      case 'pattern':
        setCurrentChallenge(generatePatternChallenge());
        break;
      case 'sequence':
        setCurrentChallenge(generateSequenceChallenge());
        break;
      case 'matching':
        const matchingChallenge = generateMatchingChallenge();
        setCurrentChallenge(matchingChallenge);
        setUserAnswer([]); // Array para múltiples selecciones
        break;
      case 'sorting':
        const sortingChallenge = generateSortingChallenge();
        setCurrentChallenge(sortingChallenge);
        setUserAnswer([...sortingChallenge.currentOrder]);
        break;
    }
  }, [currentCaptchaType]);

  // Verificar respuesta del captcha
  const verifyCaptcha = () => {
    if (!currentChallenge) return false;

    let isCorrect = false;

    switch (currentChallenge.type) {
      case 'pattern':
        isCorrect = userAnswer === currentChallenge.correctPattern;
        break;
        
      case 'sequence':
        isCorrect = userAnswer === currentChallenge.correctOption;
        break;
          case 'matching':
        const correctIds = currentChallenge.items
          .filter(item => item.category === currentChallenge.targetCategory)
          .map(item => item.id)
          .sort();
        const selectedIds = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIds);
        break;
        
      case 'sorting':
        const correctOrder = currentChallenge.items
          .sort((a, b) => a.order - b.order)
          .map(item => item.id);
        isCorrect = Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(correctOrder);
        break;
    }

    if (isCorrect) {
      setIsCaptchaVerified(true);
      setErrors(prev => ({ ...prev, captcha: '' }));
      playSuccessSound();
      return true;
    } else {
      setAttempts(prev => prev + 1);
      setErrors(prev => ({ 
        ...prev, 
        captcha: `Respuesta incorrecta. Intento ${attempts + 1} de 3.` 
      }));
      playErrorSound();
      
      if (attempts >= 2) {
        setTimeout(() => {
          generateNewChallenge();
          setAttempts(0);
        }, 1500);
      }
      return false;
    }
  };

  // Cambiar tipo de captcha
  const changeCaptchaType = (type: CaptchaType) => {
    setCurrentCaptchaType(type);
    setIsCaptchaVerified(false);
    setAttempts(0);
  };

  // Handlers para el modal de selección
  const handleCaptchaSelection = (type: 'audio' | 'visual') => {
    localStorage.setItem('captchaPreference', type);
    setShowModal(false);
    
    if (type === 'audio') {
      router.push('/');
    }
    // Si selecciona 'visual', se queda en esta página
  };

  const handleSwitchCaptchaType = () => {
    setShowModal(true);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    }

    if (!isCaptchaVerified) {
      newErrors.captcha = 'Debe completar la verificación visual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      setFormData({
        name: "",
        email: "",
        message: "",
        phoneNumber: "",
        preferredContact: 'email'
      });      setIsCaptchaVerified(false);
      generateNewChallenge();
      
    } catch {
      setErrors({ submit: 'Error al enviar el formulario. Intente nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efectos
  useEffect(() => {
    generateNewChallenge();
  }, [generateNewChallenge]);

  // Clases CSS dinámicas
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getContainerClasses = () => {
    return `min-h-screen transition-colors duration-300 ${
      isHighContrast 
        ? 'bg-black text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900'
    }`;
  };

  // Renderizar desafío de patrón
  const renderPatternChallenge = () => {
    if (currentChallenge?.type !== 'pattern') return null;
    
    const options = ["🔴", "⬛", "9️⃣"];

    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center space-x-2 text-4xl">
          {currentChallenge.patterns.map((pattern, index) => (
            <div 
              key={index}
              className={`w-16 h-16 flex items-center justify-center rounded-lg ${
                pattern === "❓" 
                  ? 'bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400' 
                  : 'bg-white dark:bg-gray-800 shadow-md'
              }`}
            >
              {pattern}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => setUserAnswer(index)}
              className={`w-16 h-16 flex items-center justify-center text-3xl rounded-lg border-2 transition-all ${
                userAnswer === index
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 scale-110'
                  : 'border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-300 hover:scale-105'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar desafío de secuencia
  const renderSequenceChallenge = () => {
    if (currentChallenge?.type !== 'sequence') return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center space-x-2 text-lg">
          {currentChallenge.sequence.map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg text-center min-w-[100px] ${
                item === "❓" 
                  ? 'bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400' 
                  : 'bg-white dark:bg-gray-800 shadow-md'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {currentChallenge.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setUserAnswer(index)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                userAnswer === index
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                  : 'border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };
  // Renderizar desafío de emparejamiento
  const renderMatchingChallenge = () => {
    if (currentChallenge?.type !== 'matching') return null;

    const toggleSelection = (id: number) => {
      const currentSelections = Array.isArray(userAnswer) ? userAnswer : [];
      if (currentSelections.includes(id)) {
        setUserAnswer(currentSelections.filter((selectedId: number) => selectedId !== id));
      } else {
        setUserAnswer([...currentSelections, id]);
      }
    };

    return (
      <div className="space-y-4">        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {currentChallenge.items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleSelection(item.id)}
              className={`w-16 h-16 flex items-center justify-center text-3xl rounded-lg border-2 transition-all ${
                Array.isArray(userAnswer) && userAnswer.includes(item.id)
                  ? 'border-green-500 bg-green-100 dark:bg-green-900 scale-110'
                  : 'border-gray-300 bg-white dark:bg-gray-800 hover:border-green-300 hover:scale-105'
              }`}
            >
              {item.emoji}
            </button>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Seleccionados: {Array.isArray(userAnswer) ? userAnswer.length : 0} elementos
        </div>
      </div>
    );
  };
  // Renderizar desafío de ordenamiento
  const renderSortingChallenge = () => {
    if (currentChallenge?.type !== 'sorting') return null;

    const moveItem = (fromIndex: number, toIndex: number) => {
      const currentOrder = Array.isArray(userAnswer) ? userAnswer : [];
      const newOrder = [...currentOrder];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      setUserAnswer(newOrder);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center space-x-2">
          {Array.isArray(userAnswer) && userAnswer.map((itemId: number, index: number) => {
            const item = currentChallenge.items.find(i => i.id === itemId);
            return (
              <div key={index} className="relative">
                <div className="w-16 h-16 flex items-center justify-center text-3xl rounded-lg bg-white dark:bg-gray-800 shadow-md border-2 border-gray-300">
                  {item?.emoji}
                </div>
                <div className="flex justify-center mt-1 space-x-1">
                  {index > 0 && (
                    <button
                      onClick={() => moveItem(index, index - 1)}
                      className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      ←
                    </button>
                  )}
                  {Array.isArray(userAnswer) && index < userAnswer.length - 1 && (
                    <button
                      onClick={() => moveItem(index, index + 1)}
                      className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Use las flechas ← → para cambiar el orden
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className={getContainerClasses()}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              ¡Mensaje Enviado!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Su mensaje ha sido enviado correctamente. Nos pondremos en contacto con usted pronto.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar Otro Mensaje
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${getFontSizeClasses()} ${
            isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            🤟 Formulario Accesible para Personas Sordas
          </h1>
          <p className={`text-lg ${getFontSizeClasses()} ${
            isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
          }`}>
            Captcha completamente visual - Sin audio requerido
          </p>
        </div>

        {/* Panel de Accesibilidad */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-3">⚙️ Opciones de Accesibilidad</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsHighContrast(!isHighContrast)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isHighContrast 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {isHighContrast ? '🌞' : '🌙'} Alto Contraste
              </button>
                <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'small' | 'base' | 'large')}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700"
              >
                <option value="small">📝 Texto Pequeño</option>
                <option value="base">📄 Texto Normal</option>
                <option value="large">📰 Texto Grande</option>
              </select>
              <button
                onClick={handleSwitchCaptchaType}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Cambiar a captcha de audio"
              >
                🔊 Cambiar de Captcha
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <h2 className={`text-2xl font-bold mb-6 ${getFontSizeClasses()}`}>
              📝 Información de Contacto
            </h2>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}>
                  👤 Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${getFontSizeClasses()} ${
                    errors.name 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 focus:border-blue-500'
                  } dark:bg-gray-700 dark:border-gray-600`}
                  placeholder="Ingrese su nombre completo"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">⚠️ {errors.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}>
                  📧 Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${getFontSizeClasses()} ${
                    errors.email 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 focus:border-blue-500'
                  } dark:bg-gray-700 dark:border-gray-600`}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">⚠️ {errors.email}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}>
                  📱 Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${getFontSizeClasses()} border-gray-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600`}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}>
                  🗨️ Método de Contacto Preferido
                </label>
                <select
                  value={formData.preferredContact}
                  onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${getFontSizeClasses()} border-gray-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600`}
                >
                  <option value="email">📧 Email</option>
                  <option value="video">📹 Videollamada</option>
                  <option value="text">💬 Mensaje de Texto</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()}`}>
                  💭 Mensaje *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${getFontSizeClasses()} ${
                    errors.message 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 focus:border-blue-500'
                  } dark:bg-gray-700 dark:border-gray-600`}
                  placeholder="Escriba su mensaje aquí..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">⚠️ {errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isCaptchaVerified || isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${getFontSizeClasses()} ${
                  isCaptchaVerified && !isSubmitting
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Enviando...
                  </>
                ) : (
                  '📤 Enviar Mensaje'
                )}
              </button>

              {errors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                  <p className="text-red-700 dark:text-red-300">⚠️ {errors.submit}</p>
                </div>
              )}
            </form>
          </div>

          {/* Captcha Visual */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <h2 className={`text-2xl font-bold mb-6 ${getFontSizeClasses()}`}>
              👁️ Verificación Visual
            </h2>

            {/* Selector de tipo de captcha */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { type: 'pattern' as CaptchaType, label: '🧩 Patrones', desc: 'Completar secuencias' },
                { type: 'sequence' as CaptchaType, label: '📅 Secuencias', desc: 'Ordenar elementos' },
                { type: 'matching' as CaptchaType, label: '🎯 Selección', desc: 'Escoger categorías' },
                { type: 'sorting' as CaptchaType, label: '↕️ Ordenar', desc: 'Organizar elementos' }
              ].map(({ type, label, desc }) => (
                <button
                  key={type}
                  onClick={() => changeCaptchaType(type)}
                  disabled={isCaptchaVerified}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    currentCaptchaType === type
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                  } ${isCaptchaVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold">{label}</div>
                  <div className="text-xs opacity-75">{desc}</div>
                </button>
              ))}
            </div>

            {/* Área del desafío */}
            {currentChallenge && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className={`font-semibold mb-2 ${getFontSizeClasses()}`}>
                  {currentChallenge.title}
                </h3>
                <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${getFontSizeClasses()}`}>
                  {currentChallenge.description}
                </p>

                {currentChallenge.type === 'pattern' && renderPatternChallenge()}
                {currentChallenge.type === 'sequence' && renderSequenceChallenge()}
                {currentChallenge.type === 'matching' && renderMatchingChallenge()}
                {currentChallenge.type === 'sorting' && renderSortingChallenge()}
              </div>
            )}

            {/* Error del captcha */}
            {errors.captcha && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                <p className="text-red-700 dark:text-red-300">⚠️ {errors.captcha}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={verifyCaptcha}
                disabled={userAnswer === null || isCaptchaVerified}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  isCaptchaVerified
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isCaptchaVerified ? '✅ Verificado' : '🔍 Verificar'}
              </button>
              
              <button
                onClick={generateNewChallenge}
                disabled={isCaptchaVerified}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                🔄 Nuevo
              </button>
            </div>

            {/* Estado verificado */}
            {isCaptchaVerified && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  ✅ ¡Verificación Visual Completada!
                </p>
              </div>
            )}

            {/* Información de accesibilidad */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">
                🌟 Características Visuales
              </h4>
              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                <li>• <strong>100% Visual:</strong> Sin audio requerido</li>
                <li>• <strong>Múltiples opciones:</strong> 4 tipos de desafíos</li>
                <li>• <strong>Interface intuitiva:</strong> Interacciones simples</li>
                <li>• <strong>Alto contraste:</strong> Fácil de ver</li>
                <li>• <strong>Tamaño ajustable:</strong> Texto y elementos escalables</li>
              </ul>
            </div>
          </div>        </div>
      </div>
      
      {/* Modal de selección de captcha */}
      <CaptchaSelectionModal
        isOpen={showModal}
        onSelect={handleCaptchaSelection}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
