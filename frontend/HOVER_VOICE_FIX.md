# Corrección del Problema Hover-to-Read con Voces Externas

## Problema Identificado

La funcionalidad de hover-to-read (lectura automática al posicionar el cursor) dejaba de funcionar cuando se cambiaba a voces externas como Google TTS. Esto ocurría debido a varios problemas:

### Causas del Problema

1. **Estado `speaking` bloqueante**: El hook `useAccessibility` verificaba si `speaking` era `true` antes de permitir la lectura en hover, pero con voces externas este estado a veces se quedaba en `true` incluso cuando la síntesis había fallado.

2. **Timeouts de voces externas**: Las voces externas pueden tardar más en cargar o fallar silenciosamente, dejando el sistema en un estado inconsistente.

3. **Falta de manejo de errores de red**: Cuando las voces externas fallaban por problemas de red, el sistema no tenía un mecanismo de recuperación adecuado.

## Soluciones Implementadas

### 1. Eliminación del Bloqueo por Estado `speaking`

**Archivo**: `src/hooks/useAccessibility.ts`

```typescript
// ANTES:
const handleElementHover = useCallback((element: HTMLElement) => {
  if (!settings.hoverToRead || speaking) return; // ❌ Bloqueaba con voces externas
  // ...
}, [settings.hoverToRead, settings.readingSpeed, speak, speaking]);

// DESPUÉS:
const handleElementHover = useCallback((element: HTMLElement) => {
  if (!settings.hoverToRead) return; // ✅ Solo verifica configuración
  // ...
  speak(text, { rate: settings.readingSpeed, priority: 'high' }); // ✅ Usa prioridad alta
}, [settings.hoverToRead, settings.readingSpeed, speak]);
```

**Beneficios**:
- El hover-to-read ahora funciona independientemente del estado de la síntesis de voz
- Usa prioridad alta para cancelar lecturas anteriores automáticamente
- Elimina la dependencia problemática del estado `speaking`

### 2. Timeout de Seguridad para Voces Externas

**Archivo**: `src/hooks/useSpeech.ts`

```typescript
// Timeout de seguridad para voces externas que pueden fallar silenciosamente
let safetyTimeout: NodeJS.Timeout | undefined;
if (finalVoice && !spanishVoices.find(v => v.voice === finalVoice)?.isLocal) {
  safetyTimeout = setTimeout(() => {
    if (speaking) {
      console.warn('Timeout de seguridad: voz externa no respondió');
      setSpeaking(false);
      window.speechSynthesis.cancel();
    }
  }, 5000); // 5 segundos de timeout para voces externas
}
```

**Beneficios**:
- Evita que el sistema se quede "colgado" cuando una voz externa no responde
- Libera el estado `speaking` automáticamente después de 5 segundos
- Solo se aplica a voces externas (no locales)

### 3. Manejo Mejorado de Errores de Red

```typescript
utterance.onerror = (event) => {
  setSpeaking(false);
  
  // Limpiar timeout de seguridad
  if (safetyTimeout) {
    clearTimeout(safetyTimeout);
  }
  
  // Manejo específico para errores de red y síntesis
  if (event.error === 'network' || event.error === 'synthesis-failed') {
    console.log('Error de red/síntesis, reintentando con voz local...');
    setTimeout(() => {
      const localVoice = spanishVoices.find(v => v.isLocal)?.voice;
      speak(text, { ...options, voice: localVoice, isRetry: true });
    }, 100);
  }
};
```

**Beneficios**:
- Detecta errores específicos de red y síntesis
- Automáticamente reintenta con una voz local cuando la externa falla
- Garantiza que el estado se resetee correctamente

### 4. Limpieza de Timeouts en Eventos de Finalización

```typescript
utterance.onend = () => {
  setSpeaking(false);
  
  // Limpiar timeout de seguridad si existe
  if (safetyTimeout) {
    clearTimeout(safetyTimeout);
  }
  
  // ... resto del código
};
```

## Comportamiento Mejorado

### Antes de la Corrección
1. Usuario cambia a voz externa (ej: Google TTS)
2. Hover-to-read funciona inicialmente
3. Si la voz externa falla o se demora, `speaking` queda en `true`
4. Hover-to-read deja de funcionar hasta reiniciar la página

### Después de la Corrección
1. Usuario cambia a voz externa (ej: Google TTS)
2. Hover-to-read funciona consistentemente
3. Si la voz externa falla:
   - Se resetea automáticamente el estado
   - Se reintenta con voz local como respaldo
   - Hover-to-read continúa funcionando
4. Timeout de seguridad evita estados "colgados"

## Casos de Prueba

Para verificar que la corrección funciona:

1. **Prueba básica**: Hover-to-read con voz local
2. **Prueba con voz externa exitosa**: Cambiar a Google TTS y probar hover
3. **Prueba con voz externa fallida**: Simular falta de conexión y probar hover
4. **Prueba de timeout**: Usar voz externa lenta y verificar timeout de 5s
5. **Prueba de prioridad**: Verificar que hover cancela lecturas largas

## Archivos Modificados

- `src/hooks/useAccessibility.ts`: Eliminado bloqueo por estado `speaking`
- `src/hooks/useSpeech.ts`: Agregado timeout de seguridad y mejor manejo de errores

## Compatibilidad

- ✅ Mantiene compatibilidad con voces locales
- ✅ Mejora el funcionamiento con voces externas
- ✅ No afecta otras funcionalidades existentes
- ✅ Funciona en todos los navegadores compatibles con Web Speech API
