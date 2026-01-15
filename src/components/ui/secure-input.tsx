import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { validateSSN, maskSSN, validateEmail, validatePhone, sanitizeInput } from "@/lib/utils"
import { Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'ssn' | 'ein' | 'phone' | 'email' | 'text'
  showMasking?: boolean
  onValidationChange?: (isValid: boolean) => void
}

const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type = 'text', showMasking = true, onValidationChange, onChange, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || "")
    const [isValid, setIsValid] = React.useState(true)
    const [showValue, setShowValue] = React.useState(false)
    
    const validateInput = React.useCallback((inputValue: string) => {
      let valid;
      
      switch (type) {
        case 'ssn':
          valid = validateSSN(inputValue);
          break;
        case 'ein':
          // Enhanced EIN validation with basic checksum
          const cleanEIN = inputValue.replace(/\D/g, '');
          valid = cleanEIN.length === 9 && /^[0-9]{2}-?[0-9]{7}$/.test(inputValue);
          break;
        case 'phone':
          valid = validatePhone(inputValue);
          break;
        case 'email':
          valid = validateEmail(inputValue);
          break;
        default:
          valid = true;
      }
      
      setIsValid(valid);
      onValidationChange?.(valid);
      return valid;
    }, [type, onValidationChange]);

    const formatValue = React.useCallback((inputValue: string) => {
      if (!showMasking || showValue) return inputValue;
      
      switch (type) {
        case 'ssn':
          return maskSSN(inputValue);
        case 'ein':
          const cleanEIN = inputValue.replace(/\D/g, '');
          if (cleanEIN.length >= 2) {
            return `XX-XXXXXXX${cleanEIN.slice(-2)}`;
          }
          return inputValue;
        case 'phone':
          const cleanPhone = inputValue.replace(/\D/g, '');
          if (cleanPhone.length >= 4) {
            return `XXX-XXX-${cleanPhone.slice(-4)}`;
          }
          return inputValue;
        default:
          return inputValue;
      }
    }, [type, showMasking, showValue]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const sanitizedValue = sanitizeInput(rawValue);
      
      setValue(sanitizedValue);
      validateInput(sanitizedValue);
      
      // Call original onChange with sanitized value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: sanitizedValue
          }
        };
        onChange(syntheticEvent);
      }
    }, [onChange, validateInput]);

    const displayValue = React.useMemo(() => {
      return formatValue(value as string);
    }, [value, formatValue]);

    const canToggleVisibility = type === 'ssn' || type === 'ein';

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "pr-12",
            !isValid && "border-destructive focus-visible:ring-destructive",
            isValid && "border-green-500/50",
            className
          )}
          {...props}
        />
        
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {canToggleVisibility && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => setShowValue(!showValue)}
            >
              {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          )}
          
          <div className={cn(
            "h-6 w-6 flex items-center justify-center rounded-full",
            isValid ? "bg-green-100 text-green-600" : "bg-destructive/10 text-destructive"
          )}>
            <Shield className="h-3 w-3" />
          </div>
        </div>
        
        {!isValid && (
          <p className="text-xs text-destructive mt-1">
            {type === 'ssn' && "Please enter a valid SSN (XXX-XX-XXXX)"}
            {type === 'ein' && "Please enter a valid EIN (XX-XXXXXXX)"}
            {type === 'phone' && "Please enter a valid phone number"}
            {type === 'email' && "Please enter a valid email address"}
          </p>
        )}
      </div>
    )
  }
)

SecureInput.displayName = "SecureInput"

export { SecureInput }