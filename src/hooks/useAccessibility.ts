'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSpeechSimple } from './useSpeechSimple';

interface AccessibilitySettings {
  hoverToRead: boolean;
  continuousReading: boolean;
  keyboardNavigation: boolean;
  soundEffects: boolean;
  readingSpeed: number;
  autoFocus: boolean;
}

interface NavigationElement {
  element: HTMLElement;
  type: string;
  description: string;
}

export const useAccessibility = () => {
  const { speak, cancel: stopSpeaking, speaking, initializeVoice } = useSpeechSimple();
  const [settings, setSettings] = useState<AccessibilitySettings>({
    hoverToRead: true,
    continuousReading: false,
    keyboardNavigation: true,
    soundEffects: true,
    readingSpeed: 0.8,
    autoFocus: true
  });

  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);  const [navigableElements, setNavigableElements] = useState<NavigationElement[]>([]);
  const hoverTimeoutRef = useRef<number | undefined>(undefined);
  const lastHoveredElement = useRef<HTMLElement | null>(null);

  // Obtener elementos navegables
  const updateNavigableElements = useCallback(() => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(', '))) as HTMLElement[];
    
    const navElements: NavigationElement[] = elements
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               window.getComputedStyle(el).visibility !== 'hidden';
      })
      .map(el => ({
        element: el,
        type: getElementType(el),
        description: getElementDescription(el)
      }));

    setNavigableElements(navElements);
  }, []);

  // Obtener tipo de elemento
  const getElementType = (element: HTMLElement): string => {
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const type = element.getAttribute('type');

    if (role) return role;
    if (tag === 'input' && type) return `${type} input`;
    return tag;
  };

  // Obtener descripción del elemento
  const getElementDescription = (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const title = element.getAttribute('title');
    const placeholder = element.getAttribute('placeholder');
    const altText = element.getAttribute('alt');
    
    if (ariaLabel) return ariaLabel;
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    if (title) return title;
    if (altText) return altText;
    if (placeholder) return placeholder;
    
    return element.textContent?.trim() || element.innerText?.trim() || 'Elemento sin texto';
  };
  // Leer elemento en hover
  const handleElementHover = useCallback((element: HTMLElement) => {
    if (!settings.hoverToRead) return;
    
    if (lastHoveredElement.current === element) return;
    lastHoveredElement.current = element;    // Limpiar timeout anterior
    if (hoverTimeoutRef.current !== undefined) {
      window.clearTimeout(hoverTimeoutRef.current);
    }// Esperar un poco antes de leer para evitar lecturas accidentales
    hoverTimeoutRef.current = window.setTimeout(() => {
      const description = getElementDescription(element);
      const type = getElementType(element);
      const text = `${type}: ${description}`;
      
      // Usar prioridad alta para hover (cancela lecturas anteriores si es necesario)
      speak(text);
    }, 500) as unknown as number;
  }, [settings.hoverToRead, speak]);

  // Navegar al siguiente elemento
  const navigateNext = useCallback(() => {
    if (navigableElements.length === 0) return;
    
    const nextIndex = (currentFocusIndex + 1) % navigableElements.length;
    setCurrentFocusIndex(nextIndex);
    
    const element = navigableElements[nextIndex].element;
    element.focus();
      if (settings.keyboardNavigation) {
      const description = navigableElements[nextIndex].description;
      const type = navigableElements[nextIndex].type;
      speak(`${type}: ${description}`);
    }
  }, [currentFocusIndex, navigableElements, settings.keyboardNavigation, speak]);

  // Navegar al elemento anterior
  const navigatePrevious = useCallback(() => {
    if (navigableElements.length === 0) return;
    
    const prevIndex = currentFocusIndex <= 0 
      ? navigableElements.length - 1 
      : currentFocusIndex - 1;
    setCurrentFocusIndex(prevIndex);
    
    const element = navigableElements[prevIndex].element;
    element.focus();
      if (settings.keyboardNavigation) {
      const description = navigableElements[prevIndex].description;
      const type = navigableElements[prevIndex].type;
      speak(`${type}: ${description}`);
    }
  }, [currentFocusIndex, navigableElements, settings.keyboardNavigation, speak]);

  // Activar elemento actual
  const activateCurrentElement = useCallback(() => {
    if (currentFocusIndex >= 0 && currentFocusIndex < navigableElements.length) {
      const element = navigableElements[currentFocusIndex].element;
      
      if (element.tagName.toLowerCase() === 'button' || element.getAttribute('role') === 'button') {
        element.click();
      } else if (element.tagName.toLowerCase() === 'a') {
        element.click();
      } else if (element.tagName.toLowerCase() === 'input') {
        element.focus();
      }
    }
  }, [currentFocusIndex, navigableElements]);

  // Leer página completa
  const readEntirePage = useCallback(() => {
    const mainContent = document.querySelector('main') || document.body;
    const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const paragraphs = mainContent.querySelectorAll('p');
    const buttons = mainContent.querySelectorAll('button');
    const inputs = mainContent.querySelectorAll('input, select, textarea');

    let textToRead = '';

    // Leer encabezados
    headings.forEach(heading => {
      textToRead += `Encabezado: ${heading.textContent?.trim()}. `;
    });

    // Leer párrafos
    paragraphs.forEach(p => {
      if (p.textContent?.trim()) {
        textToRead += `${p.textContent.trim()}. `;
      }
    });

    // Leer controles interactivos
    buttons.forEach(button => {
      if (button.textContent?.trim()) {
        textToRead += `Botón: ${button.textContent.trim()}. `;
      }
    });

    inputs.forEach(input => {
      const label = getElementDescription(input as HTMLElement);
      textToRead += `Campo: ${label}. `;
    });    if (textToRead) {
      speak(textToRead);
    }
  }, [speak]);

  // Configurar atajos de teclado
  useHotkeys('alt+n', navigateNext, { preventDefault: true });
  useHotkeys('alt+p', navigatePrevious, { preventDefault: true });
  useHotkeys('alt+enter', activateCurrentElement, { preventDefault: true });
  useHotkeys('alt+r', readEntirePage, { preventDefault: true });
  useHotkeys('alt+s', stopSpeaking, { preventDefault: true });
  useHotkeys('escape', stopSpeaking, { preventDefault: true });
  // Configurar eventos de hover
  useEffect(() => {
    if (!settings.hoverToRead) return;

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verificar que target es un HTMLElement válido
      if (target && target.nodeType === Node.ELEMENT_NODE && typeof target.hasAttribute === 'function') {
        const tagName = target.tagName?.toLowerCase();
        if (tagName === 'button' || tagName === 'input' || 
            tagName === 'a' || tagName === 'select' || tagName === 'textarea' ||
            target.hasAttribute('role') || target.hasAttribute('tabindex')) {
          handleElementHover(target);
        }
      }
    };    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        if (hoverTimeoutRef.current !== undefined) {
          window.clearTimeout(hoverTimeoutRef.current);
        }
        lastHoveredElement.current = null;
      }
    };

    // Usar mouseover y mouseout en lugar de mouseenter y mouseleave
    document.addEventListener('mouseover', handleMouseEnter, true);
    document.addEventListener('mouseout', handleMouseLeave, true);    return () => {
      document.removeEventListener('mouseover', handleMouseEnter, true);
      document.removeEventListener('mouseout', handleMouseLeave, true);
      if (hoverTimeoutRef.current !== undefined) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [settings.hoverToRead, handleElementHover]);

  // Actualizar elementos navegables cuando cambie el DOM
  useEffect(() => {
    updateNavigableElements();
    
    const observer = new MutationObserver(updateNavigableElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'hidden', 'aria-hidden']
    });

    return () => observer.disconnect();
  }, [updateNavigableElements]);

  // Funciones de configuración
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const announceInstructions = useCallback(() => {
    const instructions = `
      Instrucciones de navegación accesible:
      Alt + N para siguiente elemento,
      Alt + P para elemento anterior,
      Alt + Enter para activar elemento,
      Alt + R para leer toda la página,
      Alt + S o Escape para detener lectura.
      Pase el cursor sobre los elementos para escuchar su descripción.
    `;
    speak(instructions);
  }, [speak]);
  return {
    settings,
    updateSettings,
    navigateNext,
    navigatePrevious,
    activateCurrentElement,
    readEntirePage,
    stopSpeaking,
    announceInstructions,
    initializeVoice,
    currentFocusIndex,
    navigableElements: navigableElements.length,
    speaking
  };
};
