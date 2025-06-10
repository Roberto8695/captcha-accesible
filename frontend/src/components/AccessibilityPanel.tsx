'use client';

import React, { useState } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { VoiceSettings } from './VoiceSettings';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    announceInstructions, 
    readEntirePage,
    stopSpeaking,
    navigableElements,
    speaking
  } = useAccessibility();

  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      role="dialog"
      aria-labelledby="accessibility-title"
      aria-describedby="accessibility-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="accessibility-title" className="text-xl font-bold">
            Panel de Accesibilidad Avanzada
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Cerrar panel de accesibilidad"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="accessibility-description" className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Configure las opciones de accesibilidad para una mejor experiencia de navegación.
          Elementos navegables detectados: {navigableElements}
        </div>

        <div className="space-y-6">
          {/* Controles de lectura */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Controles de Lectura</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={announceInstructions}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                aria-label="Escuchar instrucciones de navegación"
              >
                📢 Instrucciones
              </button>
              
              <button
                onClick={readEntirePage}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                aria-label="Leer toda la página"
              >
                📖 Leer Página
              </button>
                <button
                onClick={stopSpeaking}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                aria-label="Detener lectura"
                disabled={!speaking}
              >
                ⏹️ Detener
              </button>

              <button
                onClick={() => setIsVoiceSettingsOpen(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                aria-label="Configurar voz y calidad de audio"
              >
                🎤 Configurar Voz
              </button>
              
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${speaking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="text-sm">{speaking ? 'Leyendo...' : 'Silencio'}</span>
              </div>
            </div>
          </div>

          {/* Configuraciones de lectura automática */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Lectura Automática</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.hoverToRead}
                  onChange={(e) => updateSettings({ hoverToRead: e.target.checked })}
                  className="mr-2"
                  aria-describedby="hover-help"
                />
                <span>Leer al pasar el cursor (hover)</span>
              </label>
              <div id="hover-help" className="text-xs text-gray-500 ml-6">
                Los elementos se leerán automáticamente cuando pase el cursor sobre ellos
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.continuousReading}
                  onChange={(e) => updateSettings({ continuousReading: e.target.checked })}
                  className="mr-2"
                  aria-describedby="continuous-help"
                />
                <span>Lectura continua</span>
              </label>
              <div id="continuous-help" className="text-xs text-gray-500 ml-6">
                Continuar leyendo automáticamente el siguiente elemento
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.keyboardNavigation}
                  onChange={(e) => updateSettings({ keyboardNavigation: e.target.checked })}
                  className="mr-2"
                  aria-describedby="keyboard-help"
                />
                <span>Navegación con teclado mejorada</span>
              </label>
              <div id="keyboard-help" className="text-xs text-gray-500 ml-6">
                Usar Alt+N/P para navegar entre elementos
              </div>
            </div>
          </div>

          {/* Velocidad de lectura */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Velocidad de Lectura</h3>
            <div className="space-y-2">
              <label htmlFor="reading-speed" className="block text-sm">
                Velocidad: {settings.readingSpeed}x
              </label>
              <input
                id="reading-speed"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.readingSpeed}
                onChange={(e) => updateSettings({ readingSpeed: parseFloat(e.target.value) })}
                className="w-full"
                aria-describedby="speed-help"
              />
              <div id="speed-help" className="text-xs text-gray-500">
                0.5x (muy lento) - 2x (muy rápido)
              </div>
            </div>
          </div>

          {/* Atajos de teclado */}
          <div>
            <h3 className="font-semibold mb-3">Atajos de Teclado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Siguiente elemento:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Alt + N</kbd>
              </div>
              <div className="flex justify-between">
                <span>Elemento anterior:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Alt + P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Activar elemento:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Alt + Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Leer página:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Alt + R</kbd>
              </div>
              <div className="flex justify-between">
                <span>Detener lectura:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Alt + S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Detener lectura:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Escape</kbd>
              </div>
            </div>
          </div>
        </div>        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Panel de Configuración de Voz */}
      <VoiceSettings 
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
    </div>
  );
};
