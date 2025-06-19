"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AccessibleCaptchaComponent from "@/components/AccessibleCaptchaComponent";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { SoundFeedback } from "@/components/SoundFeedback";
import { HoverTestComponent } from "@/components/HoverTestComponent";
import CaptchaSelectionModal from "@/components/CaptchaSelectionModal";
import { useAccessibility } from "@/hooks/useAccessibility";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState("base");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [isFloatingPanelOpen, setIsFloatingPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Estados para el modal de selección de captcha
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [hasSelectedCaptcha, setHasSelectedCaptcha] = useState(false);
  const [selectedCaptchaType, setSelectedCaptchaType] = useState<'audio' | 'visual' | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Hook de accesibilidad avanzada
  const { 
    announceInstructions,
    readEntirePage,
    stopSpeaking,
    initializeVoice
  } = useAccessibility();

  // Funciones de accesibilidad usando useCallback
  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(!isHighContrast);
  }, [isHighContrast]);

  const changeFontSize = useCallback((size: string) => {
    setFontSize(size);
  }, []);

  // Funciones para el modal de selección de captcha
  const handleCaptchaSelection = useCallback((type: 'audio' | 'visual') => {
    setSelectedCaptchaType(type);
    setHasSelectedCaptcha(true);
    
    // Guardar la preferencia en localStorage para futuras visitas
    localStorage.setItem('preferredCaptchaType', type);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCaptchaModal(false);
    // Si no ha seleccionado, usar audio por defecto
    if (!hasSelectedCaptcha) {
      setSelectedCaptchaType('audio');
      setHasSelectedCaptcha(true);
    }
  }, [hasSelectedCaptcha]);

  // Configurar atajos de teclado adicionales
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'i':
            event.preventDefault();
            announceInstructions();
            break;
          case 'h':
            event.preventDefault();
            setIsFloatingPanelOpen(prev => !prev);
            break;
          case 'c':
            event.preventDefault();
            toggleHighContrast();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [announceInstructions, toggleHighContrast]);

  // Efecto para cerrar el panel flotante con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFloatingPanelOpen) {
        setIsFloatingPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFloatingPanelOpen]);

  // Mostrar modal de selección al cargar la página
  useEffect(() => {
    // Verificar si ya hay una preferencia guardada
    const savedPreference = localStorage.getItem('preferredCaptchaType') as 'audio' | 'visual' | null;
    
    if (savedPreference) {
      setSelectedCaptchaType(savedPreference);
      setHasSelectedCaptcha(true);
    } else {
      // Si no hay preferencia guardada, mostrar el modal después de un breve delay
      const timer = setTimeout(() => {
        setShowCaptchaModal(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Anunciar instrucciones al cargar la página (deshabilitado para evitar error not-allowed)
  // useEffect(() => {
  //   if (accessibilitySettings.autoFocus) {
  //     const timer = setTimeout(() => {
  //       announceInstructions();
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [accessibilitySettings.autoFocus, announceInstructions]);

  // Validación del formulario
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Por favor ingrese un correo electrónico válido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Anunciar errores para lectores de pantalla
  const announceErrors = () => {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      const announcement = `Se encontraron ${errorMessages.length} errores en el formulario: ${errorMessages.join('. ')}`;
      // Crear elemento para anuncio
      const announceElement = document.createElement('div');
      announceElement.setAttribute('aria-live', 'assertive');
      announceElement.setAttribute('aria-atomic', 'true');
      announceElement.className = 'sr-only';
      announceElement.textContent = announcement;
      document.body.appendChild(announceElement);
      
      // Enfocar primer campo con error
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
        }
        document.body.removeChild(announceElement);
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFocus = () => {
    // Función para manejar el enfoque (disponible para futuro uso)
  };

  const handleBlur = () => {
    // Función para manejar la pérdida de enfoque (disponible para futuro uso)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      announceErrors();
      return;
    }

    // Verificar que el captcha esté completado
    if (!isCaptchaVerified) {
      setErrors({ captcha: "Por favor complete la verificación captcha" });
      const announceElement = document.createElement('div');
      announceElement.setAttribute('aria-live', 'assertive');
      announceElement.className = 'sr-only';
      announceElement.textContent = 'Error: Debe completar la verificación captcha antes de enviar el formulario';
      document.body.appendChild(announceElement);
      setTimeout(() => document.body.removeChild(announceElement), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    // Anunciar inicio del envío
    const announceElement = document.createElement('div');
    announceElement.setAttribute('aria-live', 'polite');
    announceElement.className = 'sr-only';
    announceElement.textContent = 'Enviando formulario, por favor espere...';
    document.body.appendChild(announceElement);
    
    // Aquí se implementará la validación del captcha
    console.log("Datos del formulario:", formData);
    
    // Simular envío
    setTimeout(() => {
      setIsSubmitting(false);
      document.body.removeChild(announceElement);
      
      // Anunciar éxito
      const successElement = document.createElement('div');
      successElement.setAttribute('aria-live', 'assertive');
      successElement.className = 'sr-only';
      successElement.textContent = 'Formulario enviado correctamente. Gracias por su mensaje.';
      document.body.appendChild(successElement);
      
      // Limpiar formulario
      setFormData({ name: "", email: "", message: "" });
      setIsCaptchaVerified(false);
      
      setTimeout(() => {
        document.body.removeChild(successElement);
      }, 3000);
    }, 2000);
  };

  // Clases dinámicas para accesibilidad
  const getContainerClasses = () => {
    const baseClasses = "min-h-screen transition-all duration-300";
    const contrastClasses = isHighContrast 
      ? "bg-black text-white" 
      : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900";
    return `${baseClasses} ${contrastClasses}`;
  };

  const getCardClasses = () => {
    const baseClasses = "rounded-2xl shadow-xl border p-6 sm:p-8 transition-all duration-300";
    const contrastClasses = isHighContrast
      ? "bg-gray-900 border-white text-white"
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    return `${baseClasses} ${contrastClasses}`;
  };

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-base";
    const sizeClasses = fontSize === "large" ? "text-lg py-4" : fontSize === "small" ? "text-sm py-2" : "text-base py-3";
    const errorClasses = errors[fieldName] ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "";
    const focusClasses = "focus:ring-4 focus:outline-none";
    
    const contrastClasses = isHighContrast
      ? "bg-black border-white text-white focus:ring-white focus:border-white placeholder:text-gray-300"
      : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-800
         placeholder:text-gray-500 dark:placeholder:text-gray-400`;
    
    return `${baseClasses} ${sizeClasses} ${errorClasses} ${focusClasses} ${contrastClasses}`;
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
      {/* Modal de selección de captcha */}
      <CaptchaSelectionModal
        isOpen={showCaptchaModal}
        onClose={handleCloseModal}
        onSelect={handleCaptchaSelection}
      />

      {/* Clase para solo lectores de pantalla */}
      <style jsx global>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      {/* Skip to content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Saltar al contenido principal
      </a>

      {/* Botón Flotante de Accesibilidad */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Overlay para cerrar al hacer clic fuera */}
        {isFloatingPanelOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsFloatingPanelOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {!isFloatingPanelOpen ? (
          /* Botón flotante colapsado */
          <button
            onClick={() => setIsFloatingPanelOpen(true)}
            className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:scale-110 focus:outline-none focus:ring-4
              ${isHighContrast 
                ? 'bg-white text-black border-2 border-black focus:ring-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            aria-label="Abrir panel de opciones de accesibilidad"
            title="Opciones de Accesibilidad (Alt+H)"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        ) : (
          /* Panel expandido */
          <div className={`relative z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl border transition-all duration-300 animate-in slide-in-from-bottom-4
            ${isHighContrast 
              ? 'bg-gray-900 border-white text-white' 
              : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}
          >
            {/* Header del panel */}
            <div className={`flex items-center justify-between p-4 border-b ${isHighContrast ? 'border-white' : 'border-gray-200 dark:border-gray-700'}`}>
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Accesibilidad
              </h3>
              <button
                onClick={() => setIsFloatingPanelOpen(false)}
                className={`p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700
                  ${isHighContrast ? 'hover:bg-gray-700' : ''}`}
                aria-label="Cerrar panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del panel */}
            <div className="p-4 space-y-4">
              {/* Activar Voz - Destacado */}
              <div className={`p-3 rounded-lg border-l-4 border-blue-500 ${isHighContrast ? 'bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <button
                  onClick={initializeVoice}
                  className={`w-full text-left px-3 py-2 rounded font-medium transition-colors
                    ${isHighContrast 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  🎤 Activar Voz (Requerido)
                </button>
                <p className={`text-xs mt-1 ${isHighContrast ? 'text-gray-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  Haz clic primero para habilitar la síntesis de voz
                </p>
              </div>

              {/* Contraste Alto */}
              <div>
                <button
                  onClick={toggleHighContrast}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between
                    ${isHighContrast 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  aria-pressed={isHighContrast}
                >
                  <span className="flex items-center">
                    <span className="mr-2">{isHighContrast ? '◉' : '○'}</span>
                    Alto Contraste
                  </span>
                  <span className="text-xs opacity-75">Alt+C</span>
                </button>
              </div>

              {/* Tamaño de Fuente */}
              <div>
                <p className="text-xs mb-2 font-medium opacity-75">Tamaño de texto:</p>
                <div className="flex gap-1">
                  {['small', 'base', 'large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => changeFontSize(size)}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors
                        ${fontSize === size
                          ? (isHighContrast ? 'bg-white text-black' : 'bg-blue-500 text-white')
                          : (isHighContrast ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500')
                        }`}
                      aria-pressed={fontSize === size}
                    >
                      {size === 'small' ? 'A' : size === 'large' ? 'A' : 'A'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Efectos de Sonido */}
              <div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between
                    ${isHighContrast 
                      ? (soundEnabled ? 'bg-white text-black' : 'bg-gray-700 text-white hover:bg-gray-600')
                      : (soundEnabled ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600')
                    }`}
                  aria-pressed={soundEnabled}
                >
                  <span className="flex items-center">
                    <span className="mr-2">{soundEnabled ? '🔊' : '🔇'}</span>
                    Efectos de Sonido
                  </span>
                </button>
              </div>

              {/* Panel Avanzado */}
              <div>
                <button
                  onClick={() => {
                    // Cerrar el panel flotante y abrir el modal avanzado
                    setIsFloatingPanelOpen(false);
                    setTimeout(() => {
                      // Esta variable controla el modal avanzado de AccessibilityPanel
                      setIsAccessibilityPanelOpen(true);
                    }, 100);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between
                    ${isHighContrast 
                      ? 'bg-yellow-300 text-black hover:bg-yellow-200' 
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                    }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">🎯</span>
                    Panel Avanzado
                  </span>
                  <span className="text-xs opacity-75">Alt+H</span>
                </button>
              </div>

              {/* Atajos rápidos */}
              <div className={`border-t pt-3 mt-3 ${isHighContrast ? 'border-white' : 'border-gray-200 dark:border-gray-700'}`}>
                <p className="text-xs font-medium mb-2 opacity-75">Atajos rápidos:</p>
                <div className="space-y-1">
                  <button
                    onClick={announceInstructions}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-600
                      ${isHighContrast ? 'hover:bg-gray-700' : ''}`}
                  >
                    📢 Leer Instrucciones (Alt+I)
                  </button>
                  <button
                    onClick={readEntirePage}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-600
                      ${isHighContrast ? 'hover:bg-gray-700' : ''}`}
                  >
                    📖 Leer Página (Alt+R)
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-600
                      ${isHighContrast ? 'hover:bg-gray-700' : ''}`}
                  >
                    ⏹️ Detener (Esc)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                Sistema de Captcha Accesible
              </h1>
            </div>
            
            {/* Botón para cambiar tipo de captcha */}
            {hasSelectedCaptcha && (
              <div className="flex flex-col items-end space-y-2">
                <button
                  onClick={() => setShowCaptchaModal(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isHighContrast 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                  aria-label="Cambiar tipo de captcha"
                >
                  🔄 Cambiar Captcha
                </button>
                <span className={`text-xs ${isHighContrast ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  Actual: {selectedCaptchaType === 'audio' ? '🎵 Audio' : '👁️ Visual'}
                </span>
              </div>
            )}
          </div>
          
          <p className={`text-lg sm:text-xl text-center max-w-2xl mx-auto ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>
            Una alternativa inclusiva y accesible para la verificación humana, diseñada para todos los usuarios
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Formulario */}
          <div className={getCardClasses()}>
            <div className="mb-8 text-center">
              <h2 className={`text-2xl sm:text-3xl font-semibold mb-3 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                Formulario de Prueba
              </h2>
              <p className={`${getFontSizeClasses()} ${isHighContrast ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                Complete este formulario para probar nuestro sistema de captcha accesible
              </p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Campo Nombre */}
              <div>
                <label 
                  htmlFor="name" 
                  className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                >
                  Nombre completo
                  <span className="text-red-500 ml-1" aria-label="campo requerido">*</span>
                </label>
                <input
                  ref={errors.name ? firstErrorRef : undefined}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  aria-required="true"
                  aria-describedby="name-help name-error"
                  aria-invalid={!!errors.name}
                  className={getInputClasses('name')}
                  placeholder="Ingrese su nombre completo"
                />
                {errors.name && (
                  <div 
                    id="name-error" 
                    role="alert" 
                    aria-live="polite"
                    className={`mt-1 text-sm text-red-600 font-medium ${getFontSizeClasses()}`}
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.name}
                  </div>
                )}
                <p id="name-help" className={`mt-1 text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Este campo es obligatorio para procesar su solicitud
                </p>
              </div>

              {/* Campo Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                >
                  Correo electrónico
                  <span className="text-red-500 ml-1" aria-label="campo requerido">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  aria-required="true"
                  aria-describedby="email-help email-error"
                  aria-invalid={!!errors.email}
                  className={getInputClasses('email')}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && (
                  <div 
                    id="email-error" 
                    role="alert" 
                    aria-live="polite"
                    className={`mt-1 text-sm text-red-600 font-medium ${getFontSizeClasses()}`}
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </div>
                )}
                <p id="email-help" className={`mt-1 text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Utilizaremos este correo para enviarle confirmaciones
                </p>
              </div>

              {/* Campo Mensaje */}
              <div>
                <label 
                  htmlFor="message" 
                  className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                >
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  rows={fontSize === 'large' ? 6 : fontSize === 'small' ? 3 : 4}
                  aria-describedby="message-help"
                  className={`${getInputClasses('message')} resize-vertical`}
                  placeholder="Escriba su mensaje aquí (opcional)"
                />
                <p id="message-help" className={`mt-1 text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Comparta cualquier comentario o consulta adicional
                </p>
              </div>              {/* Área del Captcha - Componente Real */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Verificación de Seguridad
                  <span className="text-red-500 ml-1" aria-label="campo requerido">*</span>
                </label>
                
                {/* Indicador del tipo de captcha seleccionado */}
                {hasSelectedCaptcha && selectedCaptchaType && (
                  <div className={`mb-3 p-2 rounded-lg text-sm ${
                    selectedCaptchaType === 'audio' 
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700'
                      : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700'
                  }`}>
                    <span className="font-medium">
                      {selectedCaptchaType === 'audio' ? '🎵 Captcha de Audio' : '👁️ Captcha Visual'} - 
                    </span>
                    <span className="ml-1">
                      {selectedCaptchaType === 'audio' 
                        ? 'Optimizado para personas con discapacidad visual'
                        : 'Optimizado para personas con discapacidad auditiva'
                      }
                    </span>
                  </div>
                )}
                
                <AccessibleCaptchaComponent
                  onVerificationChange={setIsCaptchaVerified}
                  isHighContrast={isHighContrast}
                  fontSize={fontSize}
                />
                {errors.captcha && (
                  <div 
                    id="captcha-error" 
                    role="alert" 
                    aria-live="polite"
                    className={`mt-1 text-sm text-red-600 font-medium ${getFontSizeClasses()}`}
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.captcha}
                  </div>
                )}
                <p className={`mt-1 text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Complete la verificación para demostrar que es una persona real
                </p>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold py-4 px-6 rounded-lg text-lg
                         focus:ring-4 focus:outline-none
                         transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg hover:shadow-xl
                         ${getFontSizeClasses()}
                         ${isSubmitting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                         ${isHighContrast 
                           ? 'bg-white text-black hover:bg-gray-100 focus:ring-white border-2 border-white' 
                           : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white focus:ring-blue-200 dark:focus:ring-blue-800'
                         }`}
                aria-describedby="submit-help"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  "Enviar Formulario"
                )}
              </button>
              <p id="submit-help" className={`text-center text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                Al enviar este formulario, acepta nuestros términos de servicio y política de privacidad
              </p>
            </form>
          </div>

          {/* Información de Accesibilidad Mejorada */}
          <div className={`mt-8 border rounded-lg p-6 ${isHighContrast ? 'bg-gray-800 border-gray-400 text-white' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
            <h3 className={`text-lg font-semibold mb-3 flex items-center ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-green-900 dark:text-green-100'}`}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Características de Accesibilidad Mejoradas
            </h3>
            <ul className={`space-y-2 text-sm ${getFontSizeClasses()} ${isHighContrast ? 'text-gray-200' : 'text-green-800 dark:text-green-200'}`}>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Navegación por teclado completa:</strong> Tab, Enter, Escape y flechas funcionan correctamente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Lectores de pantalla optimizados:</strong> ARIA labels, live regions y roles semánticos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Alto contraste disponible:</strong> Modo de contraste extremo para baja visión</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Texto escalable:</strong> Tres tamaños de fuente para diferentes necesidades</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Validación accesible:</strong> Errores anunciados y enfoque automático</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Enlace de salto:</strong> Navegación rápida al contenido principal</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Indicadores de estado:</strong> Cambios anunciados en tiempo real</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span><strong>Captcha accesible implementado:</strong> Verificación con síntesis de voz y múltiples métodos</span>
              </li>
            </ul>
            
            <div className={`mt-4 p-3 rounded border-l-4 ${isHighContrast ? 'border-white bg-gray-700' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'}`}>
              <p className={`text-sm font-medium ${getFontSizeClasses()} ${isHighContrast ? 'text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                💡 <strong>Tip:</strong> Use el botón flotante de accesibilidad en la esquina inferior derecha para personalizar su experiencia visual.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Panel de Accesibilidad Avanzada */}
      <AccessibilityPanel 
        isOpen={isAccessibilityPanelOpen}
        onClose={() => setIsAccessibilityPanelOpen(false)}
      />

      {/* Componente de Feedback de Sonido */}
      <SoundFeedback enabled={soundEnabled} />
      
      {/* Componente de Prueba de Hover (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8">
          <HoverTestComponent />
        </div>
      )}      {/* Modal de Selección de Captcha (nuevo) */}
      <CaptchaSelectionModal
        isOpen={showCaptchaModal}
        onClose={handleCloseModal}
        onSelect={handleCaptchaSelection}
      />
    </div>
  );
}
