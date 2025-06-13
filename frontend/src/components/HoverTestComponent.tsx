/**
 * Componente de prueba para verificar la funcionalidad hover-to-read
 * con la voz optimizada de Google
 */

'use client';

import { useState } from 'react';
import { useSpeechSimple } from '@/hooks/useSpeechSimple';

export const HoverTestComponent = () => {
  const { speak, speaking } = useSpeechSimple();
  const [tested, setTested] = useState(false);

  // Función para probar hover-to-read
  const testHover = () => {
    speak(`Probando hover con voz optimizada de Google. Esta es una prueba de la funcionalidad de lectura al pasar el cursor.`);
    setTested(true);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        🧪 Prueba de Hover-to-Read
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Estado de la voz: <strong>Optimizada (Google es-US)</strong>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Estado: {speaking ? 'Hablando...' : 'Silencio'}
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
            Prueba de Voz
          </h4>
          <button
            onClick={testHover}
            disabled={speaking}
            className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
              tested 
                ? 'border-green-400 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
            } ${speaking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {speaking ? '🔊 Reproduciendo...' : 
             tested ? '✅ Probado - Voz Google optimizada' : 
             '🎯 Hacer clic para probar voz'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h5 className="font-medium mb-2 text-gray-900 dark:text-white">
            Información de la Voz
          </h5>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Idioma:</strong> Español (es-US preferido)</li>
            <li>• <strong>Proveedor:</strong> Google Chrome/Google Cloud</li>
            <li>• <strong>Velocidad:</strong> 0.9 (optimizada para claridad)</li>
            <li>• <strong>Calidad:</strong> Alta definición</li>
            <li>• <strong>Tipo:</strong> Local cuando está disponible</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            <strong>💡 Nota:</strong> Esta voz está optimizada para accesibilidad. 
            Se prioriza automáticamente la mejor voz de Google disponible sin necesidad de configuración manual.
          </p>
        </div>
      </div>
    </div>
  );
};
