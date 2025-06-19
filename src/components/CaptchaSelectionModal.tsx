"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CaptchaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'audio' | 'visual') => void;
}

const CaptchaSelectionModal: React.FC<CaptchaSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'audio' | 'visual' | null>(null);

  // Manejar selección y navegación
  const handleSelection = (type: 'audio' | 'visual') => {
    setSelectedType(type);
    onSelect(type);
    
    // Navegar a la página correspondiente
    if (type === 'visual') {
      router.push('/captchasordos');
    } else {
      // Mantener en la página actual (captcha de audio para ciegos)
      onClose();
    }
  };
  // Cerrar con tecla Escape y navegación por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      } else if (event.key === '1' && isOpen) {
        // Atajo de teclado para seleccionar audio
        handleSelection('audio');
      } else if (event.key === '2' && isOpen) {
        // Atajo de teclado para seleccionar visual
        handleSelection('visual');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      
      // Enfocar el modal al abrirse para lectores de pantalla
      const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
        {/* Modal Content */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 m-2 sm:m-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabIndex={-1}
      >        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6">
          <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-2 sm:mb-3">♿</div>
          <h2 
            id="modal-title" 
            className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2"
          >
            Bienvenido al Sistema Accesible
          </h2>
          <p 
            id="modal-description" 
            className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2 sm:px-0"
          >
            Seleccione el tipo de captcha que mejor se adapte a sus necesidades de accesibilidad
          </p>
        </div>        {/* Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 px-3 sm:px-4 lg:px-8">
          {/* Opción para Ciegos/Personas con Discapacidad Visual */}
          <button
            onClick={() => handleSelection('audio')}
            className="group p-3 sm:p-4 lg:p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 text-left touch-manipulation"
            aria-describedby="audio-description"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                🎵
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 lg:mb-3">
                Captcha de Audio
              </h3>
              <div 
                id="audio-description"
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-2"
              >
                <p><strong>Ideal para:</strong></p>
                <ul className="text-left space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <li>• Personas ciegas</li>
                  <li>• Discapacidad visual</li>
                  <li className="hidden sm:list-item">• Usuarios de lectores de pantalla</li>
                </ul>
                <p className="mt-1 sm:mt-2 lg:mt-3"><strong>Incluye:</strong></p>
                <ul className="text-left space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <li>• Síntesis de voz</li>
                  <li>• Desafíos auditivos</li>
                  <li className="hidden sm:list-item">• Navegación por teclado</li>
                  <li className="hidden lg:list-item">• Compatible con NVDA/JAWS</li>
                </ul>
              </div>
            </div>
          </button>          {/* Opción para Sordos/Personas con Discapacidad Auditiva */}
          <button
            onClick={() => handleSelection('visual')}
            className="group p-3 sm:p-4 lg:p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800 text-left touch-manipulation"
            aria-describedby="visual-description"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform">
                👁️
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 lg:mb-3">
                Captcha Visual
              </h3>
              <div 
                id="visual-description"
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-2"
              >
                <p><strong>Ideal para:</strong></p>
                <ul className="text-left space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <li>• Personas sordas</li>
                  <li>• Discapacidad auditiva</li>
                  <li className="hidden sm:list-item">• Preferencia visual</li>
                </ul>
                <p className="mt-1 sm:mt-2 lg:mt-3"><strong>Incluye:</strong></p>
                <ul className="text-left space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <li>• Patrones visuales</li>
                  <li>• Secuencias gráficas</li>
                  <li className="hidden sm:list-item">• Sin audio requerido</li>
                  <li className="hidden lg:list-item">• Interface intuitiva</li>
                </ul>
              </div>
            </div>
          </button>
        </div>        {/* Additional Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 lg:mb-6 mx-3 sm:mx-4 lg:mx-8">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">💡</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 text-sm sm:text-base">
                Información Importante
              </h4>
              <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-0.5 sm:space-y-1">
                <li>• Ambas opciones son completamente accesibles</li>
                <li>• Puede cambiar entre opciones en cualquier momento</li>
                <li className="hidden sm:list-item">• Su elección se recordará para futuras visitas</li>
                <li className="hidden lg:list-item">• Todos los formularios incluyen opciones de accesibilidad</li>
              </ul>
            </div>
          </div>
        </div>        {/* Close Button */}
        <div className="text-center px-3 sm:px-4 lg:px-8">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded touch-manipulation"
          >
            Cerrar (Esc)
          </button>
        </div>        {/* Accessibility shortcuts info */}
        <div className="mt-2 sm:mt-3 lg:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 px-3 sm:px-4 lg:px-8 pb-3 sm:pb-4 lg:pb-6">
          <p className="flex flex-wrap justify-center items-center gap-1 text-xs sm:text-sm">
            <span>🎯 Atajos:</span>
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">1</kbd>
            <span>Audio,</span>
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">2</kbd>
            <span>Visual</span>
          </p>
          <p className="hidden sm:block text-xs">⌨️ Navegue con Tab • Seleccione con Enter • Cierre con Esc</p>
          <p className="sm:hidden text-xs">⌨️ Tab • Enter • Esc</p>
        </div>
      </div>
    </div>
  );
};

export default CaptchaSelectionModal;
