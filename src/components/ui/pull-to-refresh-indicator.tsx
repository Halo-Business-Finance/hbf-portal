 import { cn } from '@/lib/utils';
 import { RefreshCw } from 'lucide-react';
 
 interface PullToRefreshIndicatorProps {
   pullDistance: number;
   progress: number;
   isRefreshing: boolean;
   threshold?: number;
 }
 
 export const PullToRefreshIndicator = ({
   pullDistance,
   progress,
   isRefreshing,
   threshold = 80,
 }: PullToRefreshIndicatorProps) => {
   if (pullDistance === 0 && !isRefreshing) return null;
 
   const isReady = progress >= 1;
 
   return (
     <div
       className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200 md:hidden"
       style={{
         top: Math.max(pullDistance - 40, 8),
         opacity: isRefreshing ? 1 : Math.min(progress * 1.5, 1),
       }}
     >
       <div
         className={cn(
           "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg transition-all duration-200",
           isReady && !isRefreshing && "bg-primary border-primary",
           isRefreshing && "bg-primary border-primary"
         )}
       >
         <RefreshCw
           className={cn(
             "w-5 h-5 transition-all duration-200",
             isReady || isRefreshing ? "text-primary-foreground" : "text-muted-foreground",
             isRefreshing && "animate-spin"
           )}
           style={{
             transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
           }}
         />
       </div>
     </div>
   );
 };