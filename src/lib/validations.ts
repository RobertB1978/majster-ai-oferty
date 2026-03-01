import { z } from 'zod';
import i18n from '@/i18n';

// Client validation
export const clientSchema = z.object({
  type: z.enum(['person', 'company']),
  name: z.string()
    .min(1, i18n.t('validations.client.nameRequired'))
    .max(100, i18n.t('validations.client.nameMaxLength', { max: 100 })),
  company_name: z.string()
    .max(200, i18n.t('validations.client.companyNameMaxLength', { max: 200 }))
    .optional(),
  nip: z.string()
    .optional()
    .refine(val => !val || /^\d{10}$/.test(val.replace(/[\s-]/g, '')), {
      message: i18n.t('validations.client.nipFormat', { digits: 10 }),
    }),
  phone: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length >= 9, {
      message: i18n.t('validations.client.phoneMinDigits', { min: 9 }),
    }),
  email: z.string()
    .optional()
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: i18n.t('validations.client.emailInvalid'),
    }),
  address: z.string()
    .max(200, i18n.t('validations.client.addressMaxLength', { max: 200 }))
    .optional(),
  notes: z.string()
    .max(2000, i18n.t('validations.client.notesMaxLength', { max: 2000 }))
    .optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Project validation
export const projectSchema = z.object({
  project_name: z.string()
    .min(1, i18n.t('validations.project.nameRequired'))
    .max(100, i18n.t('validations.project.nameMaxLength', { max: 100 })),
  client_id: z.string()
    .min(1, i18n.t('validations.project.clientRequired')),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// Quote position validation
export const quotePositionSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(1, i18n.t('validations.quote.positionNameRequired')),
  qty: z.number()
    .min(0.01, i18n.t('validations.quote.quantityMin', { min: 0 })),
  unit: z.string()
    .min(1, 'Unit is required'),
  price: z.number()
    .min(0, i18n.t('validations.quote.priceNonNegative')),
  category: z.enum(['Materiał', 'Robocizna'], {
    required_error: i18n.t('validations.quote.categoryRequired')
  }),
});

export const quoteSchema = z.object({
  positions: z.array(quotePositionSchema)
    .min(1, i18n.t('validations.quote.positionsMin')),
  marginPercent: z.number()
    .min(0, i18n.t('validations.quote.marginMin'))
    .max(100, i18n.t('validations.quote.marginMax', { max: 100 })),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

// Profile validation
export const profileSchema = z.object({
  company_name: z.string()
    .min(1, i18n.t('validations.profile.companyNameRequired'))
    .max(100, i18n.t('validations.profile.companyNameMaxLength', { max: 100 })),
  owner_name: z.string()
    .max(100, i18n.t('validations.profile.ownerNameMaxLength', { max: 100 }))
    .optional(),
  nip: z.string()
    .optional()
    .refine(val => !val || /^\d{10}$/.test(val.replace(/\D/g, '')), {
      message: i18n.t('validations.profile.nipFormat', { digits: 10 }),
    }),
  street: z.string()
    .max(100, i18n.t('validations.profile.streetMaxLength', { max: 100 }))
    .optional(),
  address_line2: z.string()
    .max(100, i18n.t('validations.profile.streetMaxLength', { max: 100 }))
    .optional(),
  city: z.string()
    .max(50, i18n.t('validations.profile.cityMaxLength', { max: 50 }))
    .optional(),
  postal_code: z.string()
    .optional()
    .refine(val => !val || /^\d{2}-\d{3}$/.test(val), {
      message: i18n.t('validations.profile.postalCodeFormat'),
    }),
  country: z.string()
    .max(50)
    .optional(),
  phone: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length >= 9, {
      message: i18n.t('validations.profile.phoneMinDigits', { min: 9 }),
    }),
  email_for_offers: z.string()
    .optional()
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: i18n.t('validations.profile.emailInvalid'),
    }),
  bank_account: z.string()
    .max(50, i18n.t('validations.profile.bankAccountMaxLength', { max: 50 }))
    .optional(),
  website: z.string()
    .max(200)
    .optional()
    .refine(val => !val || /^https?:\/\/.+/.test(val), {
      message: i18n.t('validations.profile.websiteInvalid'),
    }),
  email_subject_template: z.string()
    .max(200, i18n.t('validations.profile.emailSubjectMaxLength', { max: 200 }))
    .optional(),
  email_greeting: z.string()
    .max(500, i18n.t('validations.profile.emailGreetingMaxLength', { max: 500 }))
    .optional(),
  email_signature: z.string()
    .max(500, i18n.t('validations.profile.emailSignatureMaxLength', { max: 500 }))
    .optional(),
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
  requireSpecialChar: false,
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
    errors.push(i18n.t('validations.password.minLength', { min: PASSWORD_REQUIREMENTS.minLength }));
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(i18n.t('validations.password.requireUppercase'));
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(i18n.t('validations.password.requireLowercase'));
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push(i18n.t('validations.password.requireNumber'));
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Special character (optional but adds strength)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  } else {
    suggestions.push(i18n.t('validations.password.addSpecialChar'));
  }

  // Common password patterns to avoid
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push(i18n.t('validations.password.commonPattern'));
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
  if (score <= 2) return { label: i18n.t('validations.password.strengthWeak'), color: 'text-destructive' };
  if (score <= 4) return { label: i18n.t('validations.password.strengthMedium'), color: 'text-yellow-500' };
  if (score <= 5) return { label: i18n.t('validations.password.strengthGood'), color: 'text-blue-500' };
  return { label: i18n.t('validations.password.strengthStrong'), color: 'text-green-500' };
};

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string()
    .min(1, i18n.t('validations.auth.emailRequired'))
    .email(i18n.t('validations.auth.emailInvalid')),
  password: z.string()
    .min(6, i18n.t('validations.auth.passwordMinLength', { min: 6 })),
});

export const registerSchema = z.object({
  email: z.string()
    .min(1, i18n.t('validations.auth.emailRequired'))
    .email(i18n.t('validations.auth.emailInvalid')),
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, i18n.t('validations.auth.passwordMinLength', { min: PASSWORD_REQUIREMENTS.minLength }))
    .refine(val => /[A-Z]/.test(val), i18n.t('validations.auth.passwordRequireUppercase'))
    .refine(val => /[a-z]/.test(val), i18n.t('validations.auth.passwordRequireLowercase'))
    .refine(val => /\d/.test(val), i18n.t('validations.auth.passwordRequireDigit')),
  confirmPassword: z.string()
    .min(1, i18n.t('validations.auth.confirmPasswordRequired')),
}).refine(data => data.password === data.confirmPassword, {
  message: i18n.t('validations.auth.passwordsNotMatch'),
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, i18n.t('validations.auth.emailRequired'))
    .email(i18n.t('validations.auth.emailInvalid')),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, i18n.t('validations.auth.passwordMinLength', { min: PASSWORD_REQUIREMENTS.minLength }))
    .refine(val => /[A-Z]/.test(val), i18n.t('validations.auth.passwordRequireUppercase'))
    .refine(val => /[a-z]/.test(val), i18n.t('validations.auth.passwordRequireLowercase'))
    .refine(val => /\d/.test(val), i18n.t('validations.auth.passwordRequireDigit')),
  confirmPassword: z.string()
    .min(1, i18n.t('validations.auth.confirmPasswordRequired')),
}).refine(data => data.password === data.confirmPassword, {
  message: i18n.t('validations.auth.passwordsNotMatch'),
  path: ['confirmPassword'],
});

// Line item (price library) validation
export const lineItemSchema = z.object({
  name: z.string()
    .min(1, i18n.t('validations.lineItem.nameRequired'))
    .max(200, i18n.t('validations.lineItem.nameMaxLength', { max: 200 })),
  category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  unit: z.string().min(1, i18n.t('validations.lineItem.unitRequired')).max(20),
  unit_price_net: z.number().min(0, i18n.t('validations.lineItem.priceNonNegative')),
  vat_rate: z.number().min(0).max(100).optional(),
  item_type: z.enum(['labor', 'material', 'service', 'travel', 'lump_sum']),
  favorite: z.boolean().optional(),
});

export type LineItemFormData = z.infer<typeof lineItemSchema>;
