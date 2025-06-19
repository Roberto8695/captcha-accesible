# 🎯 Plan de Simplificación del Sistema de Voces

## 📋 Objetivo
Eliminar todo el sistema complejo de voces y usar **únicamente una voz de Google** que sea:
- **Entendible y clara** para español
- **Local si es posible** para mayor velocidad
- **Simple y confiable** sin configuraciones complejas

## 🔍 Análisis de Opciones

### **Opción 1: Voz Google Local (Recomendada)**
- **Voz:** Google Español (España) o Google Español (Estados Unidos)
- **Ventajas:** Velocidad máxima, no requiere internet
- **Instalación:** A través de configuración del navegador/sistema

### **Opción 2: Voz del Sistema Optimizada**
- **Voz:** Mejor voz local del sistema en español
- **Ventajas:** Siempre disponible, rápida
- **Optimización:** Configuración específica para claridad

### **Opción 3: Paquete de Voz Descargable**
- **Investigar:** APIs como responsivevoice.org, Amazon Polly offline
- **Ventajas:** Control total, calidad garantizada
- **Consideraciones:** Tamaño del paquete, licencias

## 🎯 Recomendación Final
**Usar Google Español (Estados Unidos) local** con fallback automático a la mejor voz del sistema disponible.

## 📝 Cambios a Realizar
1. ✅ Eliminar todos los paneles de configuración de voz
2. ✅ Simplificar `useSpeech.ts` para usar solo una voz
3. ✅ Eliminar componentes relacionados con selección de voces
4. ✅ Optimizar para Google es-US local
5. ✅ Configuración automática sin intervención del usuario
