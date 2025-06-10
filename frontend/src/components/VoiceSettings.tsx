'use client';

import React, { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ isOpen, onClose }) => {
  const {
    speak,
    spanishVoices,
    selectedVoice,
    setSelectedVoice,
    voiceSettings,
    updateVoiceSettings,
    supported
  } = useSpeech();
  const [testText, setTestText] = useState('Hola, esta es una prueba de la calidad de voz en español. ¿Se escucha clara y natural?');

  if (!isOpen || !supported) return null;

  const testVoice = (voice?: SpeechSynthesisVoice) => {
    if (voice) {
      speak(testText, { voice, priority: 'high' });
    } else {
      speak(testText, { priority: 'high' });
    }
  };

  const getVoiceQualityLabel = (quality: number): { label: string; color: string } => {
    if (quality >= 50) return { label: 'Excelente', color: 'text-green-600' };
    if (quality >= 35) return { label: 'Buena', color: 'text-blue-600' };
    if (quality >= 20) return { label: 'Regular', color: 'text-yellow-600' };
    return { label: 'Básica', color: 'text-gray-600' };
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'female': return '♀️';
      case 'male': return '♂️';
      default: return '👤';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configuración de Voz Avanzada</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Cerrar configuración de voz"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Prueba de Voz</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Texto para probar la voz..."
            />
            <button
              onClick={() => testVoice()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔊 Probar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Voces Disponibles */}
          <div>
            <h3 className="font-semibold mb-3">
              Voces en Español Disponibles ({spanishVoices.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {spanishVoices.map((voiceInfo, index) => {
                const isSelected = selectedVoice?.name === voiceInfo.voice.name;
                const qualityInfo = getVoiceQualityLabel(voiceInfo.quality);
                
                return (
                  <div
                    key={`${voiceInfo.voice.name}-${index}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                    onClick={() => setSelectedVoice(voiceInfo.voice)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {voiceInfo.voice.name}
                          </span>
                          <span className="text-sm">
                            {getGenderIcon(voiceInfo.gender)}
                          </span>
                          {voiceInfo.isLocal && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Local
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {voiceInfo.voice.lang} • 
                          <span className={`ml-1 ${qualityInfo.color}`}>
                            {qualityInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voiceInfo.voice);
                          }}
                          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          title="Probar esta voz"
                        >
                          🔊
                        </button>
                        {isSelected && (
                          <span className="text-blue-500 text-sm px-2 py-1">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuraciones de Voz */}
          <div>
            <h3 className="font-semibold mb-3">Configuraciones de Voz</h3>
            <div className="space-y-4">
              {/* Velocidad */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Velocidad: {voiceSettings.rate?.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                  value={voiceSettings.rate || 0.85}
                  onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy lento</span>
                  <span>Normal</span>
                  <span>Muy rápido</span>
                </div>
              </div>

              {/* Tono */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tono: {voiceSettings.pitch?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={voiceSettings.pitch || 1.0}
                  onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Grave</span>
                  <span>Normal</span>
                  <span>Agudo</span>
                </div>
              </div>

              {/* Volumen */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volumen: {Math.round((voiceSettings.volume || 1.0) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={voiceSettings.volume || 1.0}
                  onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Información de la voz actual */}
              {selectedVoice && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-medium mb-2">Voz Actual:</h4>
                  <p className="text-sm">
                    <strong>{selectedVoice.name}</strong><br/>
                    Idioma: {selectedVoice.lang}<br/>
                    Tipo: {selectedVoice.localService ? 'Local' : 'En línea'}
                  </p>
                </div>
              )}

              {/* Presets rápidos */}
              <div>
                <h4 className="font-medium mb-2">Configuraciones Rápidas:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateVoiceSettings({ rate: 0.7, pitch: 1.0 })}
                    className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded"
                  >
                    🐌 Clara y lenta
                  </button>
                  <button
                    onClick={() => updateVoiceSettings({ rate: 0.85, pitch: 1.0 })}
                    className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded"
                  >
                    ⚡ Normal
                  </button>
                  <button
                    onClick={() => updateVoiceSettings({ rate: 1.1, pitch: 1.0 })}
                    className="px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 rounded"
                  >
                    🚀 Rápida
                  </button>
                  <button
                    onClick={() => updateVoiceSettings({ rate: 0.85, pitch: 1.2 })}
                    className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded"
                  >
                    🎵 Expresiva
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              // Restaurar configuraciones por defecto
              updateVoiceSettings({ rate: 0.85, pitch: 1.0, volume: 1.0 });
              if (spanishVoices.length > 0) {
                setSelectedVoice(spanishVoices[0].voice);
              }
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Restaurar por defecto
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
