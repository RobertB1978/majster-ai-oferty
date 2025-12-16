import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  clientSchema, 
  projectSchema, 
  profileSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('clientSchema', () => {
    it('validates correct client data', () => {
      const validClient = {
        name: 'Test Client',
        phone: '123456789',
        email: 'test@example.com',
        address: 'Test Address 123',
      };

      const result = clientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const invalidClient = {
        name: '',
        phone: '123456789',
      };

      const result = clientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it('validates phone format', () => {
      const clientWithShortPhone = {
        name: 'Test',
        phone: '12345', // Too short
      };

      const result = clientSchema.safeParse(clientWithShortPhone);
      expect(result.success).toBe(false);
    });

    it('validates email format', () => {
      const clientWithInvalidEmail = {
        name: 'Test',
        email: 'invalid-email',
      };

      const result = clientSchema.safeParse(clientWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it('allows empty optional fields', () => {
      const minimalClient = {
        name: 'Test Client',
      };

      const result = clientSchema.safeParse(minimalClient);
      expect(result.success).toBe(true);
    });
  });

  describe('projectSchema', () => {
    it('validates correct project data', () => {
      const validProject = {
        project_name: 'Test Project',
        client_id: 'client-uuid-123',
      };

      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('requires project_name', () => {
      const invalidProject = {
        project_name: '',
        client_id: 'client-uuid',
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('requires client_id', () => {
      const invalidProject = {
        project_name: 'Test',
        client_id: '',
      };

      const result = projectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('validates correct profile data', () => {
      const validProfile = {
        company_name: 'Test Company',
        owner_name: 'John Doe',
        nip: '1234567890',
        street: 'Test Street 1',
        city: 'Warsaw',
        postal_code: '00-001',
        phone: '123456789',
        email_for_offers: 'company@test.com',
      };

      const result = profileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('requires company_name', () => {
      const invalidProfile = {
        company_name: '',
      };

      const result = profileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('validates NIP format (10 digits)', () => {
      const invalidProfile = {
        company_name: 'Test',
        nip: '12345', // Should be 10 digits
      };

      const result = profileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('validates postal code format (XX-XXX)', () => {
      const invalidProfile = {
        company_name: 'Test',
        postal_code: '12345', // Should be XX-XXX
      };

      const result = profileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('requires valid email', () => {
      const invalidLogin = {
        email: 'invalid',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('requires password min 6 characters', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '12345', // Too short
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates matching passwords', () => {
      const validRegister = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('fails when passwords do not match', () => {
      const invalidRegister = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'different',
      };

      const result = registerSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });
  });
});
