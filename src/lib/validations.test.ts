import { describe, it, expect } from 'vitest';
import {
  clientSchema,
  projectSchema,
  quotePositionSchema,
  quoteSchema,
  profileSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validatePasswordStrength,
  getPasswordStrengthLabel,
  PASSWORD_REQUIREMENTS,
} from './validations';

describe('validations - Comprehensive Tests', () => {
  describe('clientSchema', () => {
    it('should accept valid client data', () => {
      const result = clientSchema.safeParse({
        name: 'Jan Kowalski',
        phone: '123456789',
        email: 'jan@example.com',
        address: 'ul. Testowa 1, 00-000 Warszawa',
      });
      expect(result.success).toBe(true);
    });

    it('should require client name', () => {
      const result = clientSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('wymagana');
      }
    });

    it('should limit name to 100 characters', () => {
      const result = clientSchema.safeParse({
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('max 100');
      }
    });

    it('should validate phone number with minimum 9 digits', () => {
      const result = clientSchema.safeParse({
        name: 'Test',
        phone: '12345678', // tylko 8 cyfr
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('min. 9 cyfr');
      }
    });

    it('should accept phone with formatting', () => {
      const result = clientSchema.safeParse({
        name: 'Test',
        phone: '+48 123-456-789',
      });
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const result = clientSchema.safeParse({
        name: 'Test',
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should accept optional fields as empty', () => {
      const result = clientSchema.safeParse({
        name: 'Test Client',
      });
      expect(result.success).toBe(true);
    });

    it('should limit address to 200 characters', () => {
      const result = clientSchema.safeParse({
        name: 'Test',
        address: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('projectSchema', () => {
    it('should accept valid project data', () => {
      const result = projectSchema.safeParse({
        project_name: 'Remont kuchni',
        client_id: 'client-uuid-123',
      });
      expect(result.success).toBe(true);
    });

    it('should require project name', () => {
      const result = projectSchema.safeParse({
        project_name: '',
        client_id: 'client-123',
      });
      expect(result.success).toBe(false);
    });

    it('should require client_id', () => {
      const result = projectSchema.safeParse({
        project_name: 'Test Project',
        client_id: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Wybierz klienta');
      }
    });

    it('should limit project name to 100 characters', () => {
      const result = projectSchema.safeParse({
        project_name: 'a'.repeat(101),
        client_id: 'client-123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('quotePositionSchema', () => {
    it('should accept valid quote position', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Cement',
        qty: 10,
        unit: 'worek',
        price: 25.50,
        category: 'Materiał',
      });
      expect(result.success).toBe(true);
    });

    it('should require positive quantity', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Test',
        qty: 0,
        unit: 'szt',
        price: 10,
        category: 'Materiał',
      });
      expect(result.success).toBe(false);
    });

    it('should not allow negative price', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Test',
        qty: 1,
        unit: 'szt',
        price: -10,
        category: 'Materiał',
      });
      expect(result.success).toBe(false);
    });

    it('should accept zero price', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Free item',
        qty: 1,
        unit: 'szt',
        price: 0,
        category: 'Materiał',
      });
      expect(result.success).toBe(true);
    });

    it('should validate category enum', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Test',
        qty: 1,
        unit: 'szt',
        price: 10,
        category: 'InvalidCategory',
      });
      expect(result.success).toBe(false);
    });

    it('should accept Robocizna category', () => {
      const result = quotePositionSchema.safeParse({
        id: '1',
        name: 'Malowanie',
        qty: 8,
        unit: 'godzina',
        price: 50,
        category: 'Robocizna',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('quoteSchema', () => {
    it('should accept valid quote', () => {
      const result = quoteSchema.safeParse({
        positions: [{
          id: '1',
          name: 'Test',
          qty: 1,
          unit: 'szt',
          price: 10,
          category: 'Materiał',
        }],
        marginPercent: 20,
      });
      expect(result.success).toBe(true);
    });

    it('should require at least one position', () => {
      const result = quoteSchema.safeParse({
        positions: [],
        marginPercent: 20,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('przynajmniej jedną pozycję');
      }
    });

    it('should not allow negative margin', () => {
      const result = quoteSchema.safeParse({
        positions: [{
          id: '1',
          name: 'Test',
          qty: 1,
          unit: 'szt',
          price: 10,
          category: 'Materiał',
        }],
        marginPercent: -5,
      });
      expect(result.success).toBe(false);
    });

    it('should limit margin to 100%', () => {
      const result = quoteSchema.safeParse({
        positions: [{
          id: '1',
          name: 'Test',
          qty: 1,
          unit: 'szt',
          price: 10,
          category: 'Materiał',
        }],
        marginPercent: 150,
      });
      expect(result.success).toBe(false);
    });

    it('should accept zero margin', () => {
      const result = quoteSchema.safeParse({
        positions: [{
          id: '1',
          name: 'Test',
          qty: 1,
          unit: 'szt',
          price: 10,
          category: 'Materiał',
        }],
        marginPercent: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('profileSchema', () => {
    it('should accept valid profile', () => {
      const result = profileSchema.safeParse({
        company_name: 'Budowa Sp. z o.o.',
        owner_name: 'Jan Kowalski',
        nip: '1234567890',
        street: 'ul. Testowa 1',
        city: 'Warszawa',
        postal_code: '00-000',
        phone: '123456789',
        email_for_offers: 'biuro@example.com',
        bank_account: '12 3456 7890 1234 5678 9012 3456',
      });
      expect(result.success).toBe(true);
    });

    it('should require company name', () => {
      const result = profileSchema.safeParse({
        company_name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should validate NIP format (10 digits)', () => {
      const result = profileSchema.safeParse({
        company_name: 'Test',
        nip: '123456789', // tylko 9 cyfr
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10 cyfr');
      }
    });

    it('should accept NIP with dashes', () => {
      const result = profileSchema.safeParse({
        company_name: 'Test',
        nip: '123-456-78-90',
      });
      expect(result.success).toBe(true);
    });

    it('should validate postal code format', () => {
      const result = profileSchema.safeParse({
        company_name: 'Test',
        postal_code: '00000', // bez kreski
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('XX-XXX');
      }
    });

    it('should accept valid postal code', () => {
      const result = profileSchema.safeParse({
        company_name: 'Test',
        postal_code: '12-345',
      });
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const result = profileSchema.safeParse({
        company_name: 'Test',
        email_for_offers: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should limit fields to max length', () => {
      const tests = [
        { field: 'company_name', value: 'a'.repeat(101), limit: 100 },
        { field: 'owner_name', value: 'a'.repeat(101), limit: 100 },
        { field: 'street', value: 'a'.repeat(101), limit: 100 },
        { field: 'city', value: 'a'.repeat(51), limit: 50 },
        { field: 'bank_account', value: 'a'.repeat(51), limit: 50 },
      ];

      tests.forEach(({ field, value }) => {
        const data = { company_name: 'Test', [field]: value };
        const result = profileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password too short', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('minimum'))).toBe(true);
    });

    it('should require uppercase letter', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('wielką literę'))).toBe(true);
    });

    it('should require lowercase letter', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('małą literę'))).toBe(true);
    });

    it('should require number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('cyfrę'))).toBe(true);
    });

    it('should detect common password patterns', () => {
      const commonPasswords = ['Password123456', 'Qwerty123!', 'Admin123!'];
      commonPasswords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('popularny wzorzec'))).toBe(true);
      });
    });

    it('should suggest special characters', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.suggestions.some(s => s.includes('znak specjalny'))).toBe(true);
    });

    it('should increase score for special characters', () => {
      const withoutSpecial = validatePasswordStrength('Password123');
      const withSpecial = validatePasswordStrength('Password123!');
      expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
    });

    it('should increase score for longer passwords', () => {
      const short = validatePasswordStrength("Test123!");
      const medium = validatePasswordStrength("LongerTest123!");
      const long = validatePasswordStrength("VeryLongComplexTest123!");
      expect(medium.score).toBeGreaterThanOrEqual(short.score);
      expect(long.score).toBeGreaterThanOrEqual(medium.score);
    });

    it('should cap score at 7', () => {
      const result = validatePasswordStrength('VeryLongAndComplexPassword123!@#$%^&*()');
      expect(result.score).toBeLessThanOrEqual(7);
    });

    it('should handle empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return "Słabe" for low scores', () => {
      expect(getPasswordStrengthLabel(0).label).toBe('Słabe');
      expect(getPasswordStrengthLabel(1).label).toBe('Słabe');
      expect(getPasswordStrengthLabel(2).label).toBe('Słabe');
    });

    it('should return "Średnie" for medium-low scores', () => {
      expect(getPasswordStrengthLabel(3).label).toBe('Średnie');
      expect(getPasswordStrengthLabel(4).label).toBe('Średnie');
    });

    it('should return "Dobre" for good scores', () => {
      expect(getPasswordStrengthLabel(5).label).toBe('Dobre');
    });

    it('should return "Silne" for high scores', () => {
      expect(getPasswordStrengthLabel(6).label).toBe('Silne');
      expect(getPasswordStrengthLabel(7).label).toBe('Silne');
    });

    it('should return correct colors', () => {
      expect(getPasswordStrengthLabel(1).color).toBe('text-destructive');
      expect(getPasswordStrengthLabel(3).color).toBe('text-yellow-500');
      expect(getPasswordStrengthLabel(5).color).toBe('text-blue-500');
      expect(getPasswordStrengthLabel(6).color).toBe('text-green-500');
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should require password min 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('should require matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPass123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('nie są identyczne'))).toBe(true);
      }
    });

    it('should enforce password requirements', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should require uppercase in password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('wielką literę'))).toBe(true);
      }
    });

    it('should require lowercase in password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123',
      });
      expect(result.success).toBe(false);
    });

    it('should require digit in password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Password',
        confirmPassword: 'Password',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('cyfrę'))).toBe(true);
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid password reset', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should require matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'Password123',
        confirmPassword: 'Different123',
      });
      expect(result.success).toBe(false);
    });

    it('should enforce password requirements', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PASSWORD_REQUIREMENTS constant', () => {
    it('should have correct requirements', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireNumber).toBe(true);
      expect(typeof PASSWORD_REQUIREMENTS.requireSpecialChar).toBe('boolean');
    });
  });
});
