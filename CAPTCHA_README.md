# Sistema de Captcha Accesible

Un sistema de captcha completamente accesible diseñado para personas con discapacidades visuales y otros tipos de discapacidades.

## 🚀 Características Principales

### 🔊 **Síntesis de Voz Integrada**
- Utiliza la **Web Speech API** nativa del navegador
- Soporte para español (es-ES) con velocidad y tono optimizados
- Sin dependencias externas - funciona completamente en el cliente

### 🧮 **Múltiples Tipos de Verificación**
1. **Desafíos Matemáticos**: Operaciones simples (suma, resta, multiplicación)
2. **Preguntas de Lógica**: Conocimiento general y razonamiento básico
3. **Futuras expansiones**: Patrones, secuencias, reconocimiento de audio

### ♿ **Accesibilidad Completa**
- **WCAG 2.1 AA** compliant
- Navegación completa por teclado
- Lectores de pantalla optimizados
- Alto contraste disponible
- Tamaños de fuente escalables

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **Next.js 14+** - Framework React con App Router
- **TypeScript** - Tipado estático para mejor desarrollo
- **Tailwind CSS** - Diseño responsivo y utilitario
- **Web Speech API** - Síntesis de voz nativa del navegador

### **APIs Nativas del Navegador**
```typescript
// Síntesis de voz sin bibliotecas externas
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'es-ES';
utterance.rate = 0.8;
utterance.pitch = 1;
window.speechSynthesis.speak(utterance);
```

## 📦 Instalación y Configuración

### **Requisitos Previos**
- Node.js 18+ 
- npm o yarn

### **Instalación**
```bash
# Clonar el repositorio
git clone <repo-url>
cd captcha-accesible/frontend

# Instalar dependencias
npm install
# o
yarn install

# Ejecutar en desarrollo
npm run dev
# o
yarn dev
```

### **Dependencias del Proyecto**
```json
{
  "dependencies": {
    "next": "14.0.0+",
    "react": "18.0.0+",
    "react-dom": "18.0.0+",
    "typescript": "5.0.0+"
  },
  "devDependencies": {
    "tailwindcss": "3.0.0+",
    "autoprefixer": "10.0.0+",
    "postcss": "8.0.0+"
  }
}
```

## 🎯 Uso del Componente CaptchaComponent

### **Implementación Básica**
```tsx
import CaptchaComponent from '@/components/CaptchaComponent';

function MyForm() {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  return (
    <form>
      {/* Otros campos del formulario */}
      
      <CaptchaComponent 
        onVerificationChange={setIsCaptchaVerified}
        isHighContrast={false}
        fontSize="base"
      />
      
      <button 
        type="submit" 
        disabled={!isCaptchaVerified}
      >
        Enviar
      </button>
    </form>
  );
}
```

### **Props del Componente**
```typescript
interface CaptchaComponentProps {
  onVerificationChange: (isVerified: boolean) => void; // Callback cuando cambia el estado
  isHighContrast?: boolean;                           // Modo alto contraste
  fontSize?: 'small' | 'base' | 'large';             // Tamaño de fuente
}
```

## 🔧 Características Técnicas

### **Accesibilidad Implementada**

#### **ARIA y Semántica**
```tsx
// Roles y propiedades ARIA
<div role="alert" aria-live="polite">
<input aria-required="true" aria-describedby="help-text">
<button aria-pressed={isActive}>
```

#### **Navegación por Teclado**
- **Tab**: Navegación entre elementos
- **Enter**: Activar botones y enviar respuestas
- **Escape**: Cancelar acciones (futuro)
- **Flechas**: Navegación en opciones múltiples

#### **Lectores de Pantalla**
```typescript
// Anuncios dinámicos
const announceElement = document.createElement('div');
announceElement.setAttribute('aria-live', 'assertive');
announceElement.textContent = 'Mensaje importante';
document.body.appendChild(announceElement);
```

### **Generación de Desafíos**

#### **Matemáticas**
```typescript
const generateMathChallenge = (): MathChallenge => {
  const operations = ['+', '-', '×'];
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  // ... lógica de generación
};
```

#### **Lógica**
```typescript
const challenges = [
  {
    question: "¿Cuál de estos es un animal?",
    options: ["Mesa", "Perro", "Libro", "Teléfono"],
    correctIndex: 1,
    audioText: "¿Cuál de estas opciones es un animal?"
  }
  // ... más desafíos
];
```

## 🎨 Personalización de Estilos

### **Modo Alto Contraste**
```typescript
const getContainerClasses = () => {
  const contrastClasses = isHighContrast
    ? "bg-gray-900 border-white text-white"
    : "bg-white dark:bg-gray-800 border-gray-300";
  return `base-classes ${contrastClasses}`;
};
```

### **Tamaños de Fuente Dinámicos**
```typescript
const getFontSizeClasses = () => {
  switch(fontSize) {
    case "small": return "text-sm";
    case "large": return "text-lg";
    default: return "text-base";
  }
};
```

## 🔊 Síntesis de Voz

### **Configuración Optimizada**
```typescript
const speakText = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';        // Español de España
  utterance.rate = 0.8;            // Velocidad reducida para claridad
  utterance.pitch = 1;             // Tono normal
  utterance.volume = 1;            // Volumen máximo
  window.speechSynthesis.speak(utterance);
};
```

### **Soporte de Navegadores**
- ✅ **Chrome/Edge**: Excelente soporte
- ✅ **Firefox**: Buen soporte
- ✅ **Safari**: Soporte básico
- ❌ **IE**: No soportado

## 🔄 Futuras Mejoras

### **Planned Features**
1. **Reconocimiento de Voz**: Respuestas por voz
2. **Captcha de Audio**: Identificar sonidos
3. **Patrones Táctiles**: Para dispositivos móviles
4. **Multi-idioma**: Soporte para más idiomas
5. **API Backend**: Validación del lado del servidor

### **Bibliotecas Opcionales para Futuro**
```bash
# Para reconocimiento de voz más avanzado
npm install @azure/cognitiveservices-speech-sdk

# Para mejores efectos de audio
npm install howler

# Para patrones táctiles
npm install react-spring

# Para análisis de accesibilidad
npm install @axe-core/react
```

## 🧪 Testing de Accesibilidad

### **Herramientas Recomendadas**
1. **axe DevTools**: Extensión de navegador
2. **WAVE**: Evaluador web de accesibilidad
3. **Lighthouse**: Auditoría automática
4. **Lectores de pantalla**: NVDA, JAWS, VoiceOver

### **Tests Manuales**
- [ ] Navegación solo con teclado
- [ ] Funcionamiento con lector de pantalla
- [ ] Usabilidad en modo alto contraste
- [ ] Pruebas con diferentes tamaños de fuente
- [ ] Funcionalidad de síntesis de voz

## 📝 Licencia

MIT License - Siéntete libre de usar y modificar este código para tus proyectos.

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork del repositorio
2. Crea una rama para tu feature
3. Prueba la accesibilidad de tus cambios
4. Envía un Pull Request

## 📞 Soporte

Para preguntas sobre accesibilidad o implementación, por favor abre un issue en GitHub.

---

**¡Construyamos un web más accesible para todos! 🌐♿**
