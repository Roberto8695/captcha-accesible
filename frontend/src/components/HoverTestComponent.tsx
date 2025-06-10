/**
 * Componente de prueba para verificar la funcionalidad hover-to-read
 * con diferentes tipos de voces (locales y externas)
 */

'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

export const HoverTestComponent = () => {
  const { spanishVoices, selectedVoice, setSelectedVoice, speak } = useSpeech();
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  // Función para probar hover-to-read con una voz específica
  const testHoverWithVoice = async (voiceName: string, voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    
    // Simular hover
    setTimeout(() => {
      speak(`Probando hover con voz ${voiceName}`, { 
        priority: 'high',
        rate: 0.8 
      });
      
      // Marcar como probado después de 2 segundos
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [voiceName]: true }));
      }, 2000);
    }, 500);
  };

  // Categorizar voces
  const localVoices = spanishVoices.filter(v => v.isLocal);
  const externalVoices = spanishVoices.filter(v => !v.isLocal);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🧪 Pruebas de Hover-to-Read con Voces
      </h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Voz actual: <strong>{selectedVoice?.name || 'Ninguna'}</strong>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tipo: <strong>
            {selectedVoice ? 
              (spanishVoices.find(v => v.voice === selectedVoice)?.isLocal ? 'Local' : 'Externa') 
              : 'N/A'
            }
          </strong>
        </p>
      </div>

      {/* Elementos de prueba para hover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div 
          className="p-4 bg-blue-100 dark:bg-blue-900 rounded border-2 border-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-colors"
          title="Botón de prueba 1"
        >
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            🎯 Elemento 1: Botón de Prueba
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Pase el cursor sobre este elemento para probar hover-to-read
          </p>
        </div>

        <div 
          className="p-4 bg-green-100 dark:bg-green-900 rounded border-2 border-green-300 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer transition-colors"
          title="Campo de entrada de prueba"
        >
          <p className="font-semibold text-green-900 dark:text-green-100">
            📝 Elemento 2: Campo de Entrada
          </p>
          <input 
            type="text" 
            placeholder="Campo de prueba para hover"
            className="w-full mt-2 p-2 border rounded"
            aria-label="Campo de entrada para probar hover-to-read"
          />
        </div>

        <div 
          className="p-4 bg-purple-100 dark:bg-purple-900 rounded border-2 border-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 cursor-pointer transition-colors"
          title="Enlace de prueba"
        >
          <p className="font-semibold text-purple-900 dark:text-purple-100">
            🔗 Elemento 3: Enlace
          </p>
          <a href="#" className="text-purple-600 dark:text-purple-400 underline">
            Enlace de prueba para hover-to-read
          </a>
        </div>

        <div 
          className="p-4 bg-orange-100 dark:bg-orange-900 rounded border-2 border-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 cursor-pointer transition-colors"
          title="Botón interactivo"
        >
          <p className="font-semibold text-orange-900 dark:text-orange-100">
            ⚡ Elemento 4: Botón Interactivo
          </p>
          <button className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
            Botón clickeable para pruebas
          </button>
        </div>
      </div>

      {/* Pruebas automatizadas de voces */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔬 Pruebas Automatizadas
        </h3>

        {/* Voces locales */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            📱 Voces Locales ({localVoices.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {localVoices.slice(0, 4).map((voiceInfo, index) => (
              <button
                key={index}
                onClick={() => testHoverWithVoice(voiceInfo.voice.name, voiceInfo.voice)}
                className={`p-2 text-sm rounded border transition-colors ${
                  testResults[voiceInfo.voice.name] 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                }`}
              >
                {testResults[voiceInfo.voice.name] ? '✅' : '🔄'} {voiceInfo.voice.name}
                <br />
                <span className="text-xs opacity-75">
                  {voiceInfo.voice.lang} • Calidad: {voiceInfo.quality}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Voces externas */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            🌐 Voces Externas ({externalVoices.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {externalVoices.slice(0, 4).map((voiceInfo, index) => (
              <button
                key={index}
                onClick={() => testHoverWithVoice(voiceInfo.voice.name, voiceInfo.voice)}
                className={`p-2 text-sm rounded border transition-colors ${
                  testResults[voiceInfo.voice.name] 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-blue-100 hover:bg-blue-200 border-blue-300'
                }`}
              >
                {testResults[voiceInfo.voice.name] ? '✅' : '🔄'} {voiceInfo.voice.name}
                <br />
                <span className="text-xs opacity-75">
                  {voiceInfo.voice.lang} • Calidad: {voiceInfo.quality}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          📋 Instrucciones de Prueba
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">          <li>Haga clic en los botones de &quot;Pruebas Automatizadas&quot; para cambiar de voz</li>
          <li>Después de cada cambio, pase el cursor sobre los elementos de prueba</li>
          <li>Verifique que el hover-to-read funciona correctamente</li>
          <li>Las voces externas pueden tardar más en cargar</li>
          <li>Si una voz externa falla, debería hacer fallback automáticamente</li>
        </ol>
      </div>

      {/* Reset */}
      <div className="mt-4">
        <button
          onClick={() => setTestResults({})}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🔄 Reiniciar Pruebas
        </button>
      </div>
    </div>
  );
};
