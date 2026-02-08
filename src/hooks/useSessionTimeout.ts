 import { useEffect, useRef, useCallback, useState } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
 
 interface SessionTimeoutConfig {
   // Time of inactivity before showing warning (in milliseconds)
   warningTimeMs: number;
   // Time after warning before automatic logout (in milliseconds)
   logoutTimeMs: number;
   // Events that reset the inactivity timer
   activityEvents: string[];
 }
 
 interface UseSessionTimeoutReturn {
   showWarning: boolean;
   remainingSeconds: number;
   extendSession: () => void;
   logoutNow: () => void;
 }
 
 const DEFAULT_CONFIG: SessionTimeoutConfig = {
   warningTimeMs: 14 * 60 * 1000, // 14 minutes of inactivity before warning
   logoutTimeMs: 1 * 60 * 1000,   // 1 minute after warning to logout (15 min total)
   activityEvents: [
     'mousedown',
     'mousemove',
     'keydown',
     'scroll',
     'touchstart',
     'click',
     'focus'
   ]
 };
 
 export function useSessionTimeout(config: Partial<SessionTimeoutConfig> = {}): UseSessionTimeoutReturn {
   const { user, signOut } = useAuth();
   const [showWarning, setShowWarning] = useState(false);
   const [remainingSeconds, setRemainingSeconds] = useState(0);
   
   const mergedConfig = { ...DEFAULT_CONFIG, ...config };
   
   const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
   const lastActivityRef = useRef<number>(Date.now());
   
   // Clear all timers
   const clearAllTimers = useCallback(() => {
     if (warningTimeoutRef.current) {
       clearTimeout(warningTimeoutRef.current);
       warningTimeoutRef.current = null;
     }
     if (logoutTimeoutRef.current) {
       clearTimeout(logoutTimeoutRef.current);
       logoutTimeoutRef.current = null;
     }
     if (countdownIntervalRef.current) {
       clearInterval(countdownIntervalRef.current);
       countdownIntervalRef.current = null;
     }
   }, []);
   
   // Handle logout
   const logoutNow = useCallback(async () => {
     clearAllTimers();
     setShowWarning(false);
     try {
       await signOut();
     } catch (error) {
       console.error('Error during session timeout logout:', error);
       // Force redirect even if signOut fails
       window.location.href = '/';
     }
   }, [signOut, clearAllTimers]);
   
   // Start the logout countdown
   const startLogoutCountdown = useCallback(() => {
     setShowWarning(true);
     setRemainingSeconds(Math.floor(mergedConfig.logoutTimeMs / 1000));
     
     // Start countdown display
     countdownIntervalRef.current = setInterval(() => {
       setRemainingSeconds(prev => {
         if (prev <= 1) {
           return 0;
         }
         return prev - 1;
       });
     }, 1000);
     
     // Set logout timeout
     logoutTimeoutRef.current = setTimeout(() => {
       logoutNow();
     }, mergedConfig.logoutTimeMs);
   }, [mergedConfig.logoutTimeMs, logoutNow]);
   
   // Reset inactivity timer
   const resetInactivityTimer = useCallback(() => {
     lastActivityRef.current = Date.now();
     
     // Don't reset if warning is showing (user must explicitly extend)
     if (showWarning) return;
     
     clearAllTimers();
     
     // Set warning timeout
     warningTimeoutRef.current = setTimeout(() => {
       startLogoutCountdown();
     }, mergedConfig.warningTimeMs);
   }, [showWarning, clearAllTimers, startLogoutCountdown, mergedConfig.warningTimeMs]);
   
   // Extend session (dismiss warning and reset timer)
   const extendSession = useCallback(() => {
     clearAllTimers();
     setShowWarning(false);
     setRemainingSeconds(0);
     
     // Restart the inactivity timer
     warningTimeoutRef.current = setTimeout(() => {
       startLogoutCountdown();
     }, mergedConfig.warningTimeMs);
   }, [clearAllTimers, startLogoutCountdown, mergedConfig.warningTimeMs]);
   
   // Set up activity listeners
   useEffect(() => {
     if (!user) {
       clearAllTimers();
       setShowWarning(false);
       return;
     }
     
     // Throttled activity handler to prevent excessive timer resets
     let throttleTimeout: NodeJS.Timeout | null = null;
     const throttledResetTimer = () => {
       if (throttleTimeout) return;
       throttleTimeout = setTimeout(() => {
         throttleTimeout = null;
         resetInactivityTimer();
       }, 1000); // Throttle to once per second
     };
     
     // Add event listeners
     mergedConfig.activityEvents.forEach(event => {
       document.addEventListener(event, throttledResetTimer, { passive: true });
     });
     
     // Start initial timer
     resetInactivityTimer();
     
     return () => {
       // Remove event listeners
       mergedConfig.activityEvents.forEach(event => {
         document.removeEventListener(event, throttledResetTimer);
       });
       clearAllTimers();
       if (throttleTimeout) clearTimeout(throttleTimeout);
     };
   }, [user, mergedConfig.activityEvents, resetInactivityTimer, clearAllTimers]);
   
   // Handle visibility change (pause timer when tab is hidden)
   useEffect(() => {
     if (!user) return;
     
     const handleVisibilityChange = () => {
       if (document.visibilityState === 'visible') {
         // Check if we should have timed out while hidden
         const elapsed = Date.now() - lastActivityRef.current;
         const totalTimeout = mergedConfig.warningTimeMs + mergedConfig.logoutTimeMs;
         
         if (elapsed >= totalTimeout) {
           // Should have been logged out
           logoutNow();
         } else if (elapsed >= mergedConfig.warningTimeMs && !showWarning) {
           // Should show warning
           startLogoutCountdown();
         }
       }
     };
     
     document.addEventListener('visibilitychange', handleVisibilityChange);
     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
   }, [user, mergedConfig.warningTimeMs, mergedConfig.logoutTimeMs, showWarning, logoutNow, startLogoutCountdown]);
   
   return {
     showWarning,
     remainingSeconds,
     extendSession,
     logoutNow
   };
 }