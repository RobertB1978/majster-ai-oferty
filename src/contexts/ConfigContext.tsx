import { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { appConfigSchema } from '@/data/appConfigSchema';
import type { AppConfig, ConfigVersion } from '@/data/appConfigSchema';
import { DEFAULT_CONFIG } from '@/data/defaultConfig';

// ── Storage keys ──
const STORAGE_KEY = 'majster_app_config';
const STORAGE_VERSIONS_KEY = 'majster_config_versions';
const MAX_VERSIONS = 10;

// ── State ──
interface ConfigState {
  config: AppConfig;
  lastKnownGood: AppConfig;
  versions: ConfigVersion[];
  isDirty: boolean;
}

type ConfigAction =
  | { type: 'SET_CONFIG'; config: AppConfig; summary: string }
  | { type: 'ROLLBACK'; index: number }
  | { type: 'RESET' };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case 'SET_CONFIG': {
      const entry: ConfigVersion = {
        config: action.config,
        timestamp: new Date().toISOString(),
        actor: 'owner',
        summary: action.summary,
      };
      const versions = [entry, ...state.versions].slice(0, MAX_VERSIONS);
      persist(action.config, versions);
      return { config: action.config, lastKnownGood: action.config, versions, isDirty: false };
    }
    case 'ROLLBACK': {
      const target = state.versions[action.index];
      if (!target) return state;
      const entry: ConfigVersion = {
        config: target.config,
        timestamp: new Date().toISOString(),
        actor: 'owner',
        summary: `Przywrócono wersję z ${new Date(target.timestamp).toLocaleString('pl-PL')}`,
      };
      const versions = [entry, ...state.versions].slice(0, MAX_VERSIONS);
      persist(target.config, versions);
      return { config: target.config, lastKnownGood: target.config, versions, isDirty: false };
    }
    case 'RESET': {
      const entry: ConfigVersion = {
        config: DEFAULT_CONFIG,
        timestamp: new Date().toISOString(),
        actor: 'owner',
        summary: 'Przywrócono ustawienia domyślne',
      };
      const versions = [entry, ...state.versions].slice(0, MAX_VERSIONS);
      persist(DEFAULT_CONFIG, versions);
      return { config: DEFAULT_CONFIG, lastKnownGood: DEFAULT_CONFIG, versions, isDirty: false };
    }
  }
}

// ── Persistence helpers ──
function persist(config: AppConfig, versions: ConfigVersion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(STORAGE_VERSIONS_KEY, JSON.stringify(versions));
  } catch {
    // Storage full or unavailable - non-critical
  }
}

function loadFromStorage(): { config: AppConfig; versions: ConfigVersion[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rawVersions = localStorage.getItem(STORAGE_VERSIONS_KEY);
    const versions: ConfigVersion[] = rawVersions ? JSON.parse(rawVersions) : [];

    if (!raw) return { config: DEFAULT_CONFIG, versions };

    const parsed = JSON.parse(raw);
    const result = appConfigSchema.safeParse(parsed);

    if (result.success) {
      return { config: result.data, versions };
    }
    // Invalid config - return default, toast will be shown
    return { config: DEFAULT_CONFIG, versions };
  } catch {
    return { config: DEFAULT_CONFIG, versions: [] };
  }
}

// ── Context ──
interface ConfigContextValue {
  config: AppConfig;
  versions: ConfigVersion[];
  isDirty: boolean;
  applyConfig: (partial: Partial<AppConfig>, summary: string) => boolean;
  rollback: (index: number) => void;
  resetToDefaults: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();

  const [state, dispatch] = useReducer(configReducer, {
    config: initial.config,
    lastKnownGood: initial.config,
    versions: initial.versions,
    isDirty: false,
  });

  // Validate on mount - if loaded config was invalid, toast once
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const result = appConfigSchema.safeParse(JSON.parse(raw));
        if (!result.success) {
          toast.error('Nieprawidłowa konfiguracja — przywrócono domyślną');
        }
      } catch {
        toast.error('Uszkodzona konfiguracja — przywrócono domyślną');
      }
    }
  }, []);

  // Apply theme tokens as CSS variables
  useEffect(() => {
    const { theme } = state.config;
    const root = document.documentElement;
    root.style.setProperty('--primary', `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`);
    root.style.setProperty('--radius', `${theme.radiusPx / 16}rem`);
  }, [state.config.theme]);

  const applyConfig = useCallback(
    (partial: Partial<AppConfig>, summary: string): boolean => {
      const merged = {
        ...state.config,
        ...partial,
        version: partial.version ?? state.config.version,
        updatedAt: new Date().toISOString(),
      };
      const result = appConfigSchema.safeParse(merged);
      if (!result.success) {
        toast.error('Nieprawidłowa konfiguracja: ' + result.error.issues[0]?.message);
        return false;
      }
      dispatch({ type: 'SET_CONFIG', config: result.data, summary });
      toast.success('Konfiguracja zapisana');
      return true;
    },
    [state.config]
  );

  const rollback = useCallback((index: number) => {
    dispatch({ type: 'ROLLBACK', index });
    toast.success('Konfiguracja przywrócona');
  }, []);

  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET' });
    toast.success('Przywrócono ustawienia domyślne');
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        config: state.config,
        versions: state.versions,
        isDirty: state.isDirty,
        applyConfig,
        rollback,
        resetToDefaults,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
