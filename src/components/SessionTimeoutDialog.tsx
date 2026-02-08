 import { useEffect } from 'react';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { Clock, LogOut, RefreshCw } from 'lucide-react';
 
 interface SessionTimeoutDialogProps {
   open: boolean;
   remainingSeconds: number;
   onExtend: () => void;
   onLogout: () => void;
 }
 
 export function SessionTimeoutDialog({
   open,
   remainingSeconds,
   onExtend,
   onLogout
 }: SessionTimeoutDialogProps) {
   // Play warning sound when dialog opens
   useEffect(() => {
     if (open && remainingSeconds > 0) {
       // Attempt to play a subtle notification (browsers may block autoplay)
       try {
         const context = new (window.AudioContext || (window as any).webkitAudioContext)();
         const oscillator = context.createOscillator();
         const gainNode = context.createGain();
         
         oscillator.connect(gainNode);
         gainNode.connect(context.destination);
         
         oscillator.frequency.value = 440;
         oscillator.type = 'sine';
         gainNode.gain.value = 0.1;
         
         oscillator.start(context.currentTime);
         oscillator.stop(context.currentTime + 0.15);
       } catch {
         // Audio not supported or blocked - fail silently
       }
     }
   }, [open]);
   
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     if (mins > 0) {
       return `${mins}:${secs.toString().padStart(2, '0')}`;
     }
     return `${secs} seconds`;
   };
   
   return (
     <AlertDialog open={open}>
       <AlertDialogContent className="max-w-md">
         <AlertDialogHeader>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
               <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
             </div>
             <AlertDialogTitle className="text-xl">Session Timeout Warning</AlertDialogTitle>
           </div>
           <AlertDialogDescription className="text-base space-y-3">
             <p>
               For your security, you will be automatically logged out due to inactivity.
             </p>
             <div className="flex items-center justify-center py-4">
               <div className="text-center">
             <div className="text-4xl font-bold text-destructive dark:text-destructive tabular-nums">
                   {formatTime(remainingSeconds)}
                 </div>
                 <p className="text-sm text-muted-foreground mt-1">
                   until automatic logout
                 </p>
               </div>
             </div>
             <p className="text-sm text-muted-foreground">
               Click "Stay Logged In" to continue your session, or "Log Out Now" to end your session immediately.
             </p>
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter className="flex-col sm:flex-row gap-2">
           <AlertDialogCancel
             onClick={onLogout}
             className="w-full sm:w-auto"
           >
             <LogOut className="h-4 w-4 mr-2" />
             Log Out Now
           </AlertDialogCancel>
           <AlertDialogAction
             onClick={onExtend}
             className="w-full sm:w-auto bg-primary hover:bg-primary/90"
           >
             <RefreshCw className="h-4 w-4 mr-2" />
             Stay Logged In
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }