import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  return windowDimensions;
}

// Mobile: < 768, Tablet: 768–1199, Desktop: >= 1200
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (width >= 1200) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

export function useIsTablet() {
  const { width } = useWindowDimensions();
  return width >= 768;
}

// Responsive padding based on screen width
export function useResponsivePadding() {
  const bp = useBreakpoint();
  if (bp === 'desktop') return 40;
  if (bp === 'tablet') return 28;
  return 16;
}
