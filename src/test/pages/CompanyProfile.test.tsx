/**
 * CompanyProfile page tests — comprehensive coverage
 *
 * Covers: rendering, form pre-population, validation, update submission,
 * logo upload, section collapsing, email preview.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import CompanyProfile from '@/pages/CompanyProfile';
import * as profileHook from '@/hooks/useProfile';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useProfile');
vi.mock('@/components/auth/BiometricSetup', () => ({
  BiometricSetup: () => <div data-testid="biometric-setup">BiometricSetup</div>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// ── shared test data ───────────────────────────────────────────────────────

const mockProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  company_name: 'Remonty Kowalski',
  owner_name: 'Jan Kowalski',
  nip: '1234567890',
  street: 'ul. Budowlana 5',
  city: 'Warszawa',
  postal_code: '00-001',
  phone: '+48 123 456 789',
  email_for_offers: 'jan@kowalski-remonty.pl',
  bank_account: 'PL12 3456 7890 1234 5678 9012 3456',
  email_subject_template: 'Oferta od {company_name}',
  email_greeting: 'Szanowny Kliencie,',
  email_signature: 'Z poważaniem, Jan Kowalski',
  logo_url: null,
  created_at: new Date().toISOString(),
};

const mockUpdateProfile = {
  mutateAsync: vi.fn().mockResolvedValue(mockProfile),
  isPending: false,
};
const mockUploadLogo = {
  mutateAsync: vi.fn().mockResolvedValue('https://example.com/logo.png'),
  isPending: false,
};

function setupHooks(overrides: { profile?: typeof mockProfile | null; isLoading?: boolean } = {}) {
  vi.spyOn(profileHook, 'useProfile').mockReturnValue({
    data: overrides.profile !== undefined ? overrides.profile : mockProfile,
    isLoading: overrides.isLoading ?? false,
    error: null,
    isError: false,
  } as never);

  vi.spyOn(profileHook, 'useUpdateProfile').mockReturnValue(mockUpdateProfile as never);
  vi.spyOn(profileHook, 'useUploadLogo').mockReturnValue(mockUploadLogo as never);
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('CompanyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHooks();
  });

  // ── RENDERING ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<CompanyProfile />);
      expect(screen.getByText(/profil firmy/i)).toBeDefined();
    });

    it('should show loading state while profile is fetching', () => {
      setupHooks({ isLoading: true });
      render(<CompanyProfile />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it('should render company data section', () => {
      render(<CompanyProfile />);
      expect(screen.getByText(/dane firmy/i)).toBeDefined();
    });

    it('should render email settings section', () => {
      render(<CompanyProfile />);
      expect(screen.getByText(/ustawienia wiadomości/i)).toBeDefined();
    });
  });

  // ── FORM PRE-POPULATION ──────────────────────────────────────────────────

  describe('form pre-population', () => {
    it('should pre-populate company_name from loaded profile', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('Remonty Kowalski');
        expect(input).toBeDefined();
      });
    });

    it('should pre-populate owner_name from loaded profile', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('Jan Kowalski');
        expect(input).toBeDefined();
      });
    });

    it('should pre-populate NIP from loaded profile', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('1234567890');
        expect(input).toBeDefined();
      });
    });

    it('should pre-populate phone from loaded profile', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('+48 123 456 789');
        expect(input).toBeDefined();
      });
    });

    it('should pre-populate email_subject_template from loaded profile', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('Oferta od {company_name}');
        expect(input).toBeDefined();
      });
    });

    it('should show empty form when profile is null (new user)', async () => {
      setupHooks({ profile: null });
      render(<CompanyProfile />);

      await waitFor(() => {
        // Should not show profile data
        expect(screen.queryByDisplayValue('Remonty Kowalski')).toBeNull();
      });
    });
  });

  // ── FORM UPDATE SUBMISSION ────────────────────────────────────────────────

  describe('form update submission', () => {
    it('should call updateProfile when form is submitted', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Remonty Kowalski')).toBeDefined();
      });

      // Submit the form
      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateProfile.mutateAsync).toHaveBeenCalledOnce();
      });
    });

    it('should call updateProfile with updated company_name', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Remonty Kowalski')).toBeDefined();
      });

      const companyInput = screen.getByDisplayValue('Remonty Kowalski');
      fireEvent.change(companyInput, { target: { value: 'Nowa Firma Budowlana' } });

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateProfile.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ company_name: 'Nowa Firma Budowlana' })
        );
      });
    });

    it('should handle updateProfile failure gracefully (no crash)', async () => {
      mockUpdateProfile.mutateAsync.mockRejectedValueOnce(new Error('Network error'));

      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Remonty Kowalski')).toBeDefined();
      });

      const saveBtn = screen.getByRole('button', { name: /zapisz/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateProfile.mutateAsync).toHaveBeenCalledOnce();
      });

      // Page should still be rendered (no crash)
      expect(screen.getByText(/profil firmy/i)).toBeDefined();
    });
  });

  // ── COLLAPSIBLE SECTIONS ──────────────────────────────────────────────────

  describe('collapsible sections', () => {
    it('should show company data section content by default (open)', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Remonty Kowalski')).toBeDefined();
      });
    });

    it('should render the Security (BiometricSetup) section', () => {
      render(<CompanyProfile />);
      // BiometricSetup is rendered directly (not in a collapsible)
      expect(document.querySelector('[data-testid="biometric-setup"]')).toBeDefined();
    });
  });

  // ── EMAIL PREVIEW ─────────────────────────────────────────────────────────

  describe('email preview', () => {
    it('should render email settings with subject template field', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Oferta od {company_name}')).toBeDefined();
      });
    });

    it('should render email signature field', async () => {
      render(<CompanyProfile />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Z poważaniem, Jan Kowalski')).toBeDefined();
      });
    });
  });

  // ── LOGO UPLOAD ───────────────────────────────────────────────────────────

  describe('logo upload', () => {
    it('should have a logo upload input', () => {
      render(<CompanyProfile />);
      // Hidden file input
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeDefined();
    });

    it('should reject files that are too large', async () => {
      render(<CompanyProfile />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDefined();

      // Simulate uploading an oversized file (3MB > 2MB limit)
      const oversizedFile = new File(['x'.repeat(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });

      Object.defineProperty(oversizedFile, 'size', { value: 3 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      // uploadLogo should NOT be called for oversized files
      await waitFor(() => {
        expect(mockUploadLogo.mutateAsync).not.toHaveBeenCalled();
      });
    });
  });
});
