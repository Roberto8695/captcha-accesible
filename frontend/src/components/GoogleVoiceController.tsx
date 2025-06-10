/**
 * Componente especializado para configurar y optimizar la voz Google Español US
 */

'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface GoogleVoiceControllerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleVoiceController = ({ isOpen, onClose }: GoogleVoiceControllerProps) => {
  const { 
    voices, 
    setSelectedVoice, 
    speak,
    cancel,
    voiceSettings,
    updateVoiceSettings
  } = useSpeech();
  
  const [googleESUSVoice, setGoogleESUSVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Buscar específicamente la voz Google es-US
  useEffect(() => {
    const findGoogleESUS = () => {
      const googleVoice = voices.find(voice => 
        voice.lang === 'es-US' && 
        voice.name.toLowerCase().includes('google')
      );
      
      if (googleVoice) {
        console.log('🌟 Google es-US encontrada:', googleVoice.name);
        setGoogleESUSVoice(googleVoice);
      } else {
        console.log('❌ Google es-US no disponible');
        setGoogleESUSVoice(null);
      }
    };

    findGoogleESUS();
  }, [voices]);

  // Verificar conexión a internet
  useEffect(() => {    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        // Intentar una petición simple para verificar conectividad
        await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setConnectionStatus('online');
      } catch {
        setConnectionStatus('offline');
      }
    };

    checkConnection();
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para activar Google es-US como predeterminada
  const activateGoogleESUS = () => {
    if (googleESUSVoice) {
      setSelectedVoice(googleESUSVoice);
      
      // Configuraciones optimizadas para Google
      updateVoiceSettings({
        lang: 'es-US',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
        voice: googleESUSVoice
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('preferredVoice', JSON.stringify({
          name: googleESUSVoice.name,
          lang: googleESUSVoice.lang,
          voiceURI: googleESUSVoice.voiceURI,
          isGoogleESUS: true
        }));
        console.log('✅ Google es-US configurada como predeterminada');
      } catch (error) {
        console.warn('Error guardando preferencia:', error);
      }
    }
  };

  // Función para probar la voz
  const testVoice = async () => {
    if (!googleESUSVoice) return;
    
    setIsTestingVoice(true);
    
    const testTexts = [
      'Hola, soy la voz de Google en español de Estados Unidos.',
      'Esta es una prueba de calidad de audio y pronunciación.',
      'Botón, campo de entrada, correo electrónico, captcha.',
      'Números: uno, dos, tres, cuatro, cinco.'
    ];
    
    for (let i = 0; i < testTexts.length; i++) {
      speak(testTexts[i], {
        voice: googleESUSVoice,
        rate: voiceSettings.rate || 0.8,
        priority: 'high'
      });
      
      // Esperar entre frases
      if (i < testTexts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    setTimeout(() => setIsTestingVoice(false), 1000);
  };

  // Función para crear un "enlace local" (guardar configuraciones para uso offline)
  const createOfflineConfig = () => {
    if (!googleESUSVoice) return;
    
    const config = {
      preferredVoice: {
        name: googleESUSVoice.name,
        lang: googleESUSVoice.lang,
        voiceURI: googleESUSVoice.voiceURI
      },
      voiceSettings: {
        ...voiceSettings,
        voice: googleESUSVoice
      },
      fallbackVoices: voices
        .filter(v => v.lang.startsWith('es') && v.localService)
        .map(v => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI
        }))
    };
    
    try {
      localStorage.setItem('googleESUSConfig', JSON.stringify(config));
      localStorage.setItem('useGoogleESUSAsDefault', 'true');
      console.log('💾 Configuración offline guardada');
    } catch (error) {
      console.error('Error guardando configuración offline:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            🎤 Configuración Google Español US
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Estado de la voz Google */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Google Español US
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {googleESUSVoice ? googleESUSVoice.name : 'No disponible'}
              </p>
            </div>
            <div className="text-2xl">
              {googleESUSVoice ? '✅' : '❌'}
            </div>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conexión:
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              connectionStatus === 'online' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : connectionStatus === 'offline'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {connectionStatus === 'online' ? '🟢 En línea' : 
               connectionStatus === 'offline' ? '🔴 Sin conexión' : 
               '🟡 Verificando...'}
            </span>
          </div>
        </div>

        {/* Información sobre la voz */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Información Importante
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• La voz Google es-US requiere conexión a internet</li>
            <li>• Es la voz más natural para español americano</li>
            <li>• Se mantendrá como predeterminada cuando esté disponible</li>
            <li>• Fallback automático a voces locales sin conexión</li>
          </ul>
        </div>

        {/* Controles */}
        <div className="space-y-3">
          {googleESUSVoice && (
            <>
              <button
                onClick={activateGoogleESUS}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                🌟 Establecer como Predeterminada
              </button>
              
              <button
                onClick={testVoice}
                disabled={isTestingVoice || connectionStatus === 'offline'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isTestingVoice ? '🔊 Probando...' : '🎯 Probar Voz'}
              </button>
              
              <button
                onClick={createOfflineConfig}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                💾 Guardar Configuración Offline
              </button>
            </>
          )}
          
          {!googleESUSVoice && (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                La voz Google Español US no está disponible en este momento.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Esto puede deberse a:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 mt-2 space-y-1">
                <li>• Falta de conexión a internet</li>
                <li>• El navegador no la ha cargado aún</li>
                <li>• No está instalada en el sistema</li>
              </ul>
            </div>
          )}
          
          <button
            onClick={() => {
              cancel();
              onClose();
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            🚪 Cerrar
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>💡 Consejo:</strong> Para usar Google es-US sin depender de internet, 
            algunas versiones de Chrome permiten descargar voces para uso offline. 
            Consulte la configuración de accesibilidad de su navegador.
          </p>
        </div>
      </div>
    </div>
  );
};
