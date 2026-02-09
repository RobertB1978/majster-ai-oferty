import { z } from 'zod';

// URL allowlist pattern - only https URLs or relative paths
const safeUrlSchema = z
  .string()
  .refine((v) => v === '' || v.startsWith('/') || v.startsWith('https://'), {
    message: 'URL must be empty, relative (/), or HTTPS',
  });

// --- Theme tokens schema ---
export const themeTokensSchema = z.object({
  primaryHue: z.number().min(0).max(360).default(30),
  primarySaturation: z.number().min(0).max(100).default(90),
  primaryLightness: z.number().min(15).max(60).default(32),
  radiusPx: z.number().min(0).max(24).default(8),
  density: z.enum(['compact', 'default', 'comfortable']).default('default'),
  logoUrl: safeUrlSchema.default(''),
});

// --- Navigation item schema ---
export const navItemSchema = z.object({
  id: z.string(),
  label: z.string().max(40),
  path: z.string(),
  icon: z.string(),
  visible: z.boolean().default(true),
  comingSoon: z.boolean().default(false),
  requiredPlan: z.enum(['free', 'pro', 'starter', 'business', 'enterprise']).default('free'),
  order: z.number().int().min(0),
});

export const navigationSchema = z.object({
  mainItems: z.array(navItemSchema),
});

// --- Plan tier schema ---
export const planTierSchema = z.object({
  id: z.enum(['free', 'pro', 'starter', 'business', 'enterprise']),
  name: z.string(),
  pricePLN: z.number().min(0),
  maxProjects: z.number().int().min(0),
  maxClients: z.number().int().min(0),
  maxTeamMembers: z.number().int().min(0),
  maxStorageMB: z.number().int().min(0),
  features: z.array(z.string()),
  highlighted: z.boolean().default(false),
});

export const plansSchema = z.object({
  tiers: z.array(planTierSchema).min(1),
});

// --- Content schema ---
export const contentSchema = z.object({
  landingHeadline: z.string().max(120).default('Cyfrowe narzędzie dla fachowców'),
  landingSubheadline: z.string().max(200).default(
    'Wyceny, oferty, zlecenia i faktury — wszystko w jednym miejscu.'
  ),
  onboardingEnabled: z.boolean().default(true),
});

// --- Root config schema ---
export const appConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver (e.g. 1.0.0)').default('1.0.0'),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  theme: themeTokensSchema.default({}),
  navigation: navigationSchema,
  plans: plansSchema,
  content: contentSchema.default({}),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type PlanTier = z.infer<typeof planTierSchema>;

// --- Config version entry ---
export interface ConfigVersion {
  config: AppConfig;
  timestamp: string;
  actor: string;
  summary: string;
}
