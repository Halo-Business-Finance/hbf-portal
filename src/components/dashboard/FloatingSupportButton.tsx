import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Phone, Mail, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingSupportButtonProps {
  className?: string;
}

export const FloatingSupportButton = ({ className }: FloatingSupportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const supportOptions = [
    {
      id: 'chat',
      label: 'Live Chat',
      icon: MessageCircle,
      action: () => navigate('/support')
    },
    {
      id: 'call',
      label: 'Call Us',
      icon: Phone,
      action: () => window.location.href = 'tel:+18001234567'
    },
    {
      id: 'email',
      label: 'Email Support',
      icon: Mail,
      action: () => window.location.href = 'mailto:support@halobf.com'
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: FileQuestion,
      action: () => navigate('/support')
    }
  ];

  return (
    <div className={cn("fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50", className)}>
      {/* Support options menu */}
      <div className={cn(
        "absolute bottom-16 sm:bottom-16 right-0 mb-2 transition-all duration-300 transform",
        isOpen 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <div className="bg-card border border-border rounded-xl shadow-xl p-2 space-y-1 min-w-[180px] sm:min-w-[160px]">
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg text-left",
                  "hover:bg-primary/10 active:bg-primary/20 transition-all duration-200",
                  "transform animate-fade-in touch-manipulation"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  option.action();
                  setIsOpen(false);
                }}
              >
                <Icon className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main FAB button - larger touch target on mobile */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 sm:h-14 sm:w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90 active:scale-95",
          "focus:ring-4 focus:ring-primary/30 touch-manipulation",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Pulse animation when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" />
      )}
    </div>
  );
};
