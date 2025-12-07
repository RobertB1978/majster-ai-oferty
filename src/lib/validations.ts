import { z } from 'zod';

// Client validation
export const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa klienta jest wymagana').max(100, 'Nazwa max 100 znaków'),
  phone: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length >= 9, {
      message: 'Numer telefonu musi mieć min. 9 cyfr',
    }),
  email: z.string()
    .optional()
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: 'Nieprawidłowy format email',
    }),
  address: z.string().max(200, 'Adres max 200 znaków').optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Project validation
export const projectSchema = z.object({
  project_name: z.string().min(1, 'Nazwa projektu jest wymagana').max(100, 'Nazwa max 100 znaków'),
  client_id: z.string().min(1, 'Wybierz klienta'),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// Quote position validation
export const quotePositionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nazwa pozycji jest wymagana'),
  qty: z.number().min(0.01, 'Ilość musi być większa od 0'),
  unit: z.string().min(1, 'Jednostka jest wymagana'),
  price: z.number().min(0, 'Cena nie może być ujemna'),
  category: z.enum(['Materiał', 'Robocizna'], { required_error: 'Kategoria jest wymagana' }),
});

export const quoteSchema = z.object({
  positions: z.array(quotePositionSchema).min(1, 'Dodaj przynajmniej jedną pozycję'),
  marginPercent: z.number().min(0, 'Marża nie może być ujemna').max(100, 'Marża max 100%'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

// Profile validation
export const profileSchema = z.object({
  company_name: z.string().min(1, 'Nazwa firmy jest wymagana').max(100, 'Nazwa max 100 znaków'),
  owner_name: z.string().max(100, 'Imię i nazwisko max 100 znaków').optional(),
  nip: z.string()
    .optional()
    .refine(val => !val || /^\d{10}$/.test(val.replace(/\D/g, '')), {
      message: 'NIP musi mieć 10 cyfr',
    }),
  street: z.string().max(100, 'Ulica max 100 znaków').optional(),
  city: z.string().max(50, 'Miasto max 50 znaków').optional(),
  postal_code: z.string()
    .optional()
    .refine(val => !val || /^\d{2}-\d{3}$/.test(val), {
      message: 'Kod pocztowy: XX-XXX',
    }),
  phone: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length >= 9, {
      message: 'Numer telefonu musi mieć min. 9 cyfr',
    }),
  email_for_offers: z.string()
    .optional()
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: 'Nieprawidłowy format email',
    }),
  bank_account: z.string().max(50, 'Numer konta max 50 znaków').optional(),
  email_subject_template: z.string().max(200, 'Temat max 200 znaków').optional(),
  email_greeting: z.string().max(500, 'Powitanie max 500 znaków').optional(),
  email_signature: z.string().max(500, 'Podpis max 500 znaków').optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================
// PASSWORD SECURITY VALIDATION
// ============================================

// Password strength requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Opcjonalne, ale dodaje punkty siły
};

export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  score: number; 
  errors: string[];
  suggestions: string[];
} => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Minimum length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Hasło musi mieć minimum ${PASSWORD_REQUIREMENTS.minLength} znaków`);
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }
  
  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną wielką literę');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną małą literę');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną cyfrę');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  // Special character (optional but adds strength)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  } else {
    suggestions.push('Dodaj znak specjalny (!@#$%^&*) aby wzmocnić hasło');
  }
  
  // Common password patterns to avoid
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Hasło zawiera zbyt popularny wzorzec');
    score = Math.max(0, score - 2);
  }
  
  return {
    isValid: errors.length === 0,
    score: Math.min(score, 7), // Max score 7
    errors,
    suggestions
  };
};

export const getPasswordStrengthLabel = (score: number): { label: string; color: string } => {
  if (score <= 2) return { label: 'Słabe', color: 'text-destructive' };
  if (score <= 4) return { label: 'Średnie', color: 'text-yellow-500' };
  if (score <= 5) return { label: 'Dobre', color: 'text-blue-500' };
  return { label: 'Silne', color: 'text-green-500' };
};

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Hasło musi mieć min. ${PASSWORD_REQUIREMENTS.minLength} znaków`)
    .refine(val => /[A-Z]/.test(val), 'Hasło musi zawierać wielką literę')
    .refine(val => /[a-z]/.test(val), 'Hasło musi zawierać małą literę')
    .refine(val => /\d/.test(val), 'Hasło musi zawierać cyfrę'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Hasło musi mieć min. ${PASSWORD_REQUIREMENTS.minLength} znaków`)
    .refine(val => /[A-Z]/.test(val), 'Hasło musi zawierać wielką literę')
    .refine(val => /[a-z]/.test(val), 'Hasło musi zawierać małą literę')
    .refine(val => /\d/.test(val), 'Hasło musi zawierać cyfrę'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
