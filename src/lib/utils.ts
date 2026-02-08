import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Security utility functions for input sanitization
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function validateSSN(ssn: string): boolean {
  // Basic SSN validation - remove all non-digits and check format
  const cleanSSN = ssn.replace(/\D/g, '');
  return cleanSSN.length === 9 && !/^000|666|9\d{2}/.test(cleanSSN);
}

export function maskSSN(ssn: string): string {
  const cleanSSN = ssn.replace(/\D/g, '');
  if (cleanSSN.length === 9) {
    return `***-**-${cleanSSN.slice(-4)}`;
  }
  return ssn;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
   // Validate US phone numbers (10 digits)
   return cleanPhone.length === 10;
}
