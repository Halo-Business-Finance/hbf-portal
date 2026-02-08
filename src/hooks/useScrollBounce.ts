import { useCallback, useRef, useState } from 'react';

interface UseScrollBounceReturn {
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  bounceClass: string;
  scrollRef: React.RefObject<HTMLDivElement>;
}

// Trigger subtle haptic feedback if supported
const triggerHaptic = (duration: number = 10) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Vibration API not available or blocked
    }
  }
};

export function useScrollBounce(): UseScrollBounceReturn {
  const [bounceClass, setBounceClass] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const bounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const scrollingUp = scrollTop < lastScrollTop.current;
    const scrollingDown = scrollTop > lastScrollTop.current;

    // Clear any existing timeout
    if (bounceTimeout.current) {
      clearTimeout(bounceTimeout.current);
    }

    // Apply bounce effect and haptic feedback when hitting scroll limits
    if (isAtTop && scrollingUp && lastScrollTop.current > 0) {
      setBounceClass('animate-bounce-top');
      triggerHaptic(15); // Subtle vibration for top bounce
      bounceTimeout.current = setTimeout(() => setBounceClass(''), 300);
    } else if (isAtBottom && scrollingDown && lastScrollTop.current + clientHeight < scrollHeight - 1) {
      setBounceClass('animate-bounce-bottom');
      triggerHaptic(15); // Subtle vibration for bottom bounce
      bounceTimeout.current = setTimeout(() => setBounceClass(''), 300);
    }

    lastScrollTop.current = scrollTop;
  }, []);

  return { onScroll, bounceClass, scrollRef };
}
