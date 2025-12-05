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
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Auth validation
export const loginSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
  password: z.string().min(6, 'Hasło musi mieć min. 6 znaków'),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
  password: z.string().min(6, 'Hasło musi mieć min. 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Hasło musi mieć min. 6 znaków'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
