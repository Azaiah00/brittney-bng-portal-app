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

export function useIsTablet() {
  const { width } = useWindowDimensions();
  // Standard iPad width is 768px in portrait
  return width >= 768;
}
