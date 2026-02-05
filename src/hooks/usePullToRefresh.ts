 import { useState, useEffect, useCallback, useRef } from 'react';
 
 interface UsePullToRefreshOptions {
   onRefresh: () => Promise<void>;
   threshold?: number;
   resistance?: number;
 }
 
 export const usePullToRefresh = ({
   onRefresh,
   threshold = 80,
   resistance = 2.5,
 }: UsePullToRefreshOptions) => {
   const [isPulling, setIsPulling] = useState(false);
   const [pullDistance, setPullDistance] = useState(0);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const startY = useRef(0);
   const containerRef = useRef<HTMLDivElement>(null);
 
   const triggerHaptic = useCallback(() => {
     if ('vibrate' in navigator) {
       navigator.vibrate(15);
     }
   }, []);
 
   const handleTouchStart = useCallback((e: TouchEvent) => {
     if (window.scrollY === 0 && !isRefreshing) {
       startY.current = e.touches[0].clientY;
       setIsPulling(true);
     }
   }, [isRefreshing]);
 
   const handleTouchMove = useCallback((e: TouchEvent) => {
     if (!isPulling || isRefreshing) return;
     
     const currentY = e.touches[0].clientY;
     const diff = currentY - startY.current;
     
     if (diff > 0 && window.scrollY === 0) {
       e.preventDefault();
       const distance = Math.min(diff / resistance, threshold * 1.5);
       setPullDistance(distance);
       
       if (distance >= threshold && pullDistance < threshold) {
         triggerHaptic();
       }
     }
   }, [isPulling, isRefreshing, resistance, threshold, pullDistance, triggerHaptic]);
 
   const handleTouchEnd = useCallback(async () => {
     if (!isPulling) return;
     
     if (pullDistance >= threshold && !isRefreshing) {
       setIsRefreshing(true);
       triggerHaptic();
       
       try {
         await onRefresh();
       } finally {
         setIsRefreshing(false);
       }
     }
     
     setIsPulling(false);
     setPullDistance(0);
   }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, triggerHaptic]);
 
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;
 
     container.addEventListener('touchstart', handleTouchStart, { passive: true });
     container.addEventListener('touchmove', handleTouchMove, { passive: false });
     container.addEventListener('touchend', handleTouchEnd, { passive: true });
 
     return () => {
       container.removeEventListener('touchstart', handleTouchStart);
       container.removeEventListener('touchmove', handleTouchMove);
       container.removeEventListener('touchend', handleTouchEnd);
     };
   }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
 
   const progress = Math.min(pullDistance / threshold, 1);
 
   return {
     containerRef,
     isPulling,
     isRefreshing,
     pullDistance,
     progress,
   };
 };