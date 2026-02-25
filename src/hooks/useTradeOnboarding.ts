import { useState } from 'react';

const LS_KEY = 'majster_trade_onboarding_v1';

export interface TradeOnboardingState {
  packId: string | null;
  mode: 'simple' | 'advanced' | null;
  completed: boolean;
  skippedAt: string | null;
}

const DEFAULTS: TradeOnboardingState = {
  packId: null,
  mode: null,
  completed: false,
  skippedAt: null,
};

function loadState(): TradeOnboardingState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<TradeOnboardingState>) };
  } catch {
    return { ...DEFAULTS };
  }
}

function persistState(state: TradeOnboardingState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — non-critical
  }
}

/** Returns true if the trade onboarding has been completed or deliberately skipped. */
export function isTradeOnboardingDone(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as Partial<TradeOnboardingState>;
    return !!(s.completed || s.skippedAt);
  } catch {
    return false;
  }
}

export function useTradeOnboarding() {
  const [state, setInternalState] = useState<TradeOnboardingState>(loadState);

  const update = (updates: Partial<TradeOnboardingState>) => {
    setInternalState((prev) => {
      const next = { ...prev, ...updates };
      persistState(next);
      return next;
    });
  };

  const complete = (packId: string, mode: 'simple' | 'advanced') =>
    update({ packId, mode, completed: true });

  const skip = () => update({ skippedAt: new Date().toISOString() });

  const isDone = state.completed || !!state.skippedAt;

  return { state, update, complete, skip, isDone };
}
