 import * as React from "react"
 import { cn } from "@/lib/utils"
 import { Input, InputProps } from "@/components/ui/input"
 import { Phone } from "lucide-react"
 
 export interface PhoneInputProps extends Omit<InputProps, 'onChange' | 'value'> {
   value?: string
   onChange?: (value: string) => void
   showIcon?: boolean
 }
 
 /**
  * Formats a phone number string to xxx-xxx-xxxx format
  * Only allows digits and formats as user types
  */
 export function formatPhoneNumber(value: string): string {
   // Remove all non-digit characters
   const digits = value.replace(/\D/g, '')
   
   // Limit to 10 digits for US phone numbers
   const limitedDigits = digits.slice(0, 10)
   
   // Format based on length
   if (limitedDigits.length === 0) {
     return ''
   } else if (limitedDigits.length <= 3) {
     return limitedDigits
   } else if (limitedDigits.length <= 6) {
     return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`
   } else {
     return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
   }
 }
 
/**
 * Extracts only digits from a formatted phone number
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validates that a phone number has exactly 10 digits
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10
 }
 
 const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
   ({ className, value = '', onChange, showIcon = true, ...props }, ref) => {
     // Format the incoming value for display
     const displayValue = React.useMemo(() => formatPhoneNumber(value), [value])
     
     const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
       const inputValue = e.target.value
       const formatted = formatPhoneNumber(inputValue)
       
       // Call onChange with the formatted value (xxx-xxx-xxxx)
       onChange?.(formatted)
     }, [onChange])
     
     const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
       // Allow backspace to work naturally with formatting
       if (e.key === 'Backspace') {
         const input = e.currentTarget
         const cursorPos = input.selectionStart || 0
         
         // If cursor is right after a dash, skip over it
         if (cursorPos > 0 && displayValue[cursorPos - 1] === '-') {
           e.preventDefault()
           const newValue = displayValue.slice(0, cursorPos - 2) + displayValue.slice(cursorPos)
           onChange?.(formatPhoneNumber(newValue))
         }
       }
     }, [displayValue, onChange])
 
     return (
       <Input
         ref={ref}
         type="tel"
         inputMode="numeric"
         value={displayValue}
         onChange={handleChange}
         onKeyDown={handleKeyDown}
         placeholder="123-456-7890"
         maxLength={12} // xxx-xxx-xxxx = 12 characters
         icon={showIcon ? Phone : undefined}
         iconPosition="left"
         className={cn(className)}
         {...props}
       />
     )
   }
 )
 
 PhoneInput.displayName = "PhoneInput"
 
 export { PhoneInput }