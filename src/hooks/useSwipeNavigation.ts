import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  threshold?: number;
  minSwipeDistance?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface UseSwipeNavigationReturn {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  swipeHandlers: SwipeHandlers;
  swipeOffset: number;
  isSwipping: boolean;
}

export function useSwipeNavigation(
  totalSections: number,
  config: SwipeConfig = {}
): UseSwipeNavigationReturn {
  const { threshold = 50, minSwipeDistance = 30 } = config;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwipping(true);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwipping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }
    
    // Only track horizontal swipes
    if (isHorizontalSwipe.current) {
      // Prevent default to stop page scroll during horizontal swipe
      e.preventDefault?.();
      
      // Apply resistance at boundaries
      let offset = diffX;
      if ((currentIndex === 0 && diffX > 0) || (currentIndex === totalSections - 1 && diffX < 0)) {
        offset = diffX * 0.3; // Reduce movement at boundaries
      }
      
      setSwipeOffset(offset);
    }
  }, [isSwipping, currentIndex, totalSections]);

  const onTouchEnd = useCallback(() => {
    if (!isSwipping) return;
    
    const shouldNavigate = Math.abs(swipeOffset) > threshold;
    
    if (shouldNavigate && isHorizontalSwipe.current) {
      if (swipeOffset > minSwipeDistance && currentIndex > 0) {
        // Swipe right - go to previous section
        setCurrentIndex(currentIndex - 1);
      } else if (swipeOffset < -minSwipeDistance && currentIndex < totalSections - 1) {
        // Swipe left - go to next section
        setCurrentIndex(currentIndex + 1);
      }
    }
    
    setSwipeOffset(0);
    setIsSwipping(false);
    isHorizontalSwipe.current = null;
  }, [isSwipping, swipeOffset, threshold, minSwipeDistance, currentIndex, totalSections]);

  return {
    currentIndex,
    setCurrentIndex,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeOffset,
    isSwipping,
  };
}
