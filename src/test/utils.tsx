/* eslint-disable react-refresh/only-export-components -- Test utilities intentionally re-export testing helpers. */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { TestProviders } from './TestProviders';
import { createTestQueryClient } from './queryClient';

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders queryClient={queryClient}>{children}</TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
