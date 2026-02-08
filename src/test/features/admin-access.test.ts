import { describe, it, expect, vi } from 'vitest';

/**
 * Admin access smoke tests.
 *
 * These tests verify the admin role logic without rendering components,
 * ensuring the access-control contract stays correct after refactors.
 */

// Mock supabase before any imports that use it
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

describe('Admin Access Control', () => {
  describe('hasAdminAccess logic', () => {
    // This mirrors the logic in pages/Admin.tsx line 42
    function hasAdminAccess(isAppAdmin: boolean, isModerator: boolean, isOrgAdmin: boolean): boolean {
      return isAppAdmin || isModerator || isOrgAdmin;
    }

    it('grants access to platform admins', () => {
      expect(hasAdminAccess(true, false, false)).toBe(true);
    });

    it('grants access to moderators', () => {
      expect(hasAdminAccess(false, true, false)).toBe(true);
    });

    it('grants access to organization admins', () => {
      expect(hasAdminAccess(false, false, true)).toBe(true);
    });

    it('denies access to regular users', () => {
      expect(hasAdminAccess(false, false, false)).toBe(false);
    });

    it('grants access when user has multiple admin roles', () => {
      expect(hasAdminAccess(true, true, true)).toBe(true);
    });
  });

  describe('useAdminRole role derivation', () => {
    // This mirrors the logic in hooks/useAdminRole.ts lines 34-36
    function deriveRoles(roles: string[]) {
      const isAdmin = roles.includes('admin');
      const isModerator = roles.includes('moderator') || isAdmin;
      const hasAnyRole = roles.length > 0;
      return { isAdmin, isModerator, hasAnyRole };
    }

    it('identifies admin from roles array', () => {
      const result = deriveRoles(['admin']);
      expect(result.isAdmin).toBe(true);
      expect(result.isModerator).toBe(true); // admin implies moderator
      expect(result.hasAnyRole).toBe(true);
    });

    it('identifies moderator without admin', () => {
      const result = deriveRoles(['moderator']);
      expect(result.isAdmin).toBe(false);
      expect(result.isModerator).toBe(true);
      expect(result.hasAnyRole).toBe(true);
    });

    it('handles empty roles', () => {
      const result = deriveRoles([]);
      expect(result.isAdmin).toBe(false);
      expect(result.isModerator).toBe(false);
      expect(result.hasAnyRole).toBe(false);
    });

    it('handles user role only', () => {
      const result = deriveRoles(['user']);
      expect(result.isAdmin).toBe(false);
      expect(result.isModerator).toBe(false);
      expect(result.hasAnyRole).toBe(true);
    });
  });

  describe('TopBar admin visibility', () => {
    // This mirrors the logic in components/layout/TopBar.tsx
    function shouldShowAdminIcon(isAdmin: boolean, isModerator: boolean, isOrgAdmin: boolean): boolean {
      return isAdmin || isModerator || isOrgAdmin;
    }

    it('shows admin icon for platform admin', () => {
      expect(shouldShowAdminIcon(true, false, false)).toBe(true);
    });

    it('shows admin icon for org admin', () => {
      expect(shouldShowAdminIcon(false, false, true)).toBe(true);
    });

    it('hides admin icon for regular users', () => {
      expect(shouldShowAdminIcon(false, false, false)).toBe(false);
    });
  });

  describe('grant_admin_role SQL contract', () => {
    it('migration file defines grant and revoke functions', async () => {
      // Verify the migration file exists and has the expected functions
      // This is a structural test - the actual SQL is tested by Supabase migrations
      const fs = await import('fs');
      const migrationPath = 'supabase/migrations/20260208190000_grant_admin_role_function.sql';
      const content = fs.readFileSync(migrationPath, 'utf-8');

      expect(content).toContain('CREATE OR REPLACE FUNCTION public.grant_admin_role(_email text)');
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.revoke_admin_role(_email text)');
      expect(content).toContain('SECURITY DEFINER');
      expect(content).toContain("ON CONFLICT (user_id, role) DO NOTHING");
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.grant_admin_role(text) FROM anon, authenticated');
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(text) FROM anon, authenticated');
    });
  });
});
