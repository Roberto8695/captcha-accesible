# Guía de Instalación de Voces Locales de Google

## 📋 Resumen

Este documento explica cómo instalar y configurar voces locales de Google en diferentes sistemas operativos para mejorar la velocidad y calidad del sistema de captcha accesible.

## 🎯 Beneficios de las Voces Locales

- **Mayor velocidad**: No requieren conexión a internet
- **Mejor calidad**: Audio más claro y estable
- **Mayor privacidad**: Procesamiento local
- **Funcionamiento offline**: Disponible sin conexión

## 🖥️ Instalación por Sistema Operativo

### Windows 10/11

#### Método 1: Configuración del Sistema
1. **Abrir Configuración**:
   - Presiona `Win + I`
   - Ve a `Hora e idioma` > `Idioma`

2. **Agregar Español**:
   - Haz clic en `Agregar un idioma`
   - Busca y selecciona `Español (Estados Unidos)` o `Español (España)`
   - Haz clic en `Siguiente` y luego `Instalar`

3. **Instalar Características de Voz**:
   - Selecciona el idioma español agregado
   - Haz clic en `Opciones`
   - En `Síntesis de voz`, descarga las voces disponibles

4. **Configurar como Predeterminado**:
   - Ve a `Configuración` > `Hora e idioma` > `Voz`
   - Selecciona una voz en español como predeterminada

#### Método 2: Vía PowerShell (Avanzado)
```powershell
# Ejecutar como administrador
Add-WindowsCapability -Online -Name "Language.Speech.es-US~~~0.0.1.0"
Add-WindowsCapability -Online -Name "Language.Speech.es-ES~~~0.0.1.0"
```

### macOS

#### Configuración del Sistema
1. **Abrir Preferencias del Sistema**:
   - Ve a `Apple Menu` > `Preferencias del Sistema`
   - Selecciona `Accesibilidad`

2. **Configurar Voz**:
   - En el panel izquierdo, selecciona `Contenido hablado`
   - Haz clic en `Voz del sistema`
   - Selecciona `Personalizar...`

3. **Descargar Voces en Español**:
   - Busca voces como:
     - `Monica (Español - México)`
     - `Paulina (Español - México)`
     - `Diego (Español - Argentina)`
   - Haz clic en el botón de descarga junto a cada voz

### Linux (Ubuntu/Debian)

#### Instalación via APT
```bash
# Actualizar repositorios
sudo apt update

# Instalar espeak-ng con voces en español
sudo apt install espeak-ng espeak-ng-data

# Instalar Festival con voces españolas
sudo apt install festival festvox-ellpc11k

# Para voces más avanzadas (opcional)
sudo apt install speech-dispatcher-espeak-ng
```

#### Configuración
```bash
# Probar la voz
espeak-ng -v es "Hola, esta es una prueba de voz en español"

# Configurar como predeterminada
echo 'DefaultVoice "spanish"' | sudo tee -a /etc/speech-dispatcher/speechd.conf
```

### Chrome OS

1. **Configuración de Accesibilidad**:
   - Ve a `Configuración` > `Avanzado` > `Accesibilidad`
   - Activa `Usar ChromeVox (lector de pantalla)`

2. **Configurar Voz**:
   - En `Texto a voz`, selecciona una voz en español
   - Las voces de Google suelen estar preinstaladas

## 🌐 Verificación de Voces en el Navegador

### Código de Prueba JavaScript
```javascript
// Ejecutar en la consola del navegador para ver voces disponibles
function checkVoices() {
  const voices = speechSynthesis.getVoices();
  const spanishVoices = voices.filter(voice => 
    voice.lang.startsWith('es-') || voice.lang === 'es'
  );
  
  console.log('Voces en español disponibles:');
  spanishVoices.forEach(voice => {
    console.log(`
      Nombre: ${voice.name}
      Idioma: ${voice.lang}
      Local: ${voice.localService ? 'Sí' : 'No'}
      URI: ${voice.voiceURI}
    `);
  });
}

// Llamar la función después de que las voces se carguen
if (speechSynthesis.getVoices().length > 0) {
  checkVoices();
} else {
  speechSynthesis.addEventListener('voiceschanged', checkVoices);
}
```

## 🔧 Configuración Recomendada para el Sistema

### Voces Prioritarias
1. **Primera opción**: `Google español (Estados Unidos)` - es-US
2. **Segunda opción**: `Google español (España)` - es-ES  
3. **Tercera opción**: `Microsoft Sabina` (Windows)
4. **Cuarta opción**: `Mónica` (macOS)

### Parámetros Optimizados
```javascript
const optimizedSettings = {
  lang: 'es-US',
  rate: 0.9,     // Velocidad ligeramente reducida para claridad
  pitch: 1.0,    // Tono neutro
  volume: 1.0    // Volumen máximo
};
```

## 🧪 Prueba de Instalación

Una vez instaladas las voces, puedes probar que funcionen correctamente:

1. **Abrir el sistema de captcha accesible**
2. **Usar el componente de prueba** (solo en desarrollo)
3. **Verificar que la voz sea local** en la información del navegador
4. **Comprobar la velocidad** de respuesta (debe ser inmediata)

## 🐛 Solución de Problemas

### Problemas Comunes

#### "No se detectan voces en español"
- **Solución**: Reiniciar el navegador después de la instalación
- **Alternativa**: Limpiar caché y datos del navegador

#### "La voz es muy lenta"
- **Causa**: Se está usando una voz de red en lugar de local
- **Solución**: Verificar que las voces locales estén instaladas correctamente

#### "La voz no se carga"
- **Solución**: Ejecutar `speechSynthesis.getVoices()` en la consola
- **Verificar**: Que el evento `voiceschanged` se haya disparado

### Comandos de Diagnóstico

#### Windows
```cmd
# Verificar idiomas instalados
dism /online /get-packages | findstr "Language"
```

#### macOS
```bash
# Listar voces disponibles
say -v "?" | grep Spanish
```

#### Linux
```bash
# Verificar instalación de espeak
espeak-ng --voices | grep es
```

## 📚 Referencias Adicionales

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Chrome Speech Synthesis](https://developers.google.com/web/updates/2014/01/Web-apps-that-talk-Introduction-to-the-Speech-Synthesis-API)
- [WCAG 2.1 Audio Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/audio-control.html)

## 🔄 Actualizaciones

**Última actualización**: 12 de junio de 2025
**Próxima revisión**: Julio 2025

---

*Este documento se actualiza regularmente para incluir nuevas voces y métodos de instalación.*
