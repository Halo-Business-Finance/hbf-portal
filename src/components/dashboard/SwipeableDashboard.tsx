import { ReactNode, useEffect } from 'react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { cn } from '@/lib/utils';

interface DashboardSection {
  id: string;
  label: string;
  content: ReactNode;
}

interface SwipeableDashboardProps {
  sections: DashboardSection[];
  className?: string;
}

export function SwipeableDashboard({ sections, className }: SwipeableDashboardProps) {
  const { 
    currentIndex, 
    setCurrentIndex, 
    swipeHandlers, 
    swipeOffset, 
    isSwipping 
  } = useSwipeNavigation(sections.length, {
    threshold: 60,
    minSwipeDistance: 40,
  });

  return (
    <div className={cn("md:hidden", className)}>
      {/* Section Indicators */}
      <div className="flex items-center justify-center gap-2 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 touch-manipulation min-h-[32px]",
              index === currentIndex
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span className="truncate max-w-[80px]">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Swipe Hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
        <span className="animate-pulse">← Swipe to navigate →</span>
      </div>

      {/* Swipeable Content Area */}
      <div 
        className="relative overflow-hidden touch-pan-y"
        {...swipeHandlers}
      >
        <div 
          className={cn(
            "flex transition-transform",
            !isSwipping && "duration-300 ease-out"
          )}
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${swipeOffset}px))`,
          }}
        >
          {sections.map((section) => (
            <div
              key={section.id}
              className="w-full flex-shrink-0 px-1"
              style={{ minWidth: '100%' }}
            >
              {section.content}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "rounded-full transition-all duration-200 touch-manipulation",
              index === currentIndex
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
