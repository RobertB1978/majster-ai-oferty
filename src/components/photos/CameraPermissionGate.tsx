/**
 * CameraPermissionGate — PR-15
 *
 * Handles camera/media permission state for web browsers.
 * If permission denied: shows EmptyState with "Open system settings" CTA.
 * No crashes or dead buttons.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

type PermissionStatus = 'idle' | 'granted' | 'denied';

interface CameraPermissionGateProps {
  /** Called when file input is triggered (wraps the actual input trigger) */
  onRequestFile: () => void;
  /** Render prop: receives a function to trigger file pick */
  children: (onPickFile: () => void) => React.ReactNode;
}

/**
 * Tries to obtain camera/media permission then calls onRequestFile.
 * If denied, renders EmptyState with settings CTA.
 * Works in browsers — for iOS native (Capacitor) NSCameraUsageDescription
 * must be set in ios/App/App/Info.plist (see capacitor.config.ts notes).
 */
export function CameraPermissionGate({ onRequestFile, children }: CameraPermissionGateProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PermissionStatus>('idle');

  const handlePickFile = useCallback(async () => {
    // If Permissions API is not supported, fall through to file input
    if (!navigator.permissions || !('query' in navigator.permissions)) {
      setStatus('granted');
      onRequestFile();
      return;
    }

    try {
      // TypeScript 5.9+ accepts 'camera' as a valid PermissionName
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });

      if (result.state === 'denied') {
        setStatus('denied');
        return;
      }

      // granted or prompt — try getUserMedia to trigger prompt if needed
      if (result.state === 'prompt') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop tracks immediately — we only needed permission, not video
          stream.getTracks().forEach((track) => track.stop());
          setStatus('granted');
        } catch {
          setStatus('denied');
          return;
        }
      } else {
        setStatus('granted');
      }

      onRequestFile();
    } catch {
      // Permissions API threw (e.g., Firefox doesn't support 'camera' name)
      // Fall through gracefully to file input
      setStatus('granted');
      onRequestFile();
    }
  }, [onRequestFile]);

  const handleOpenSettings = useCallback(() => {
    // On browsers, we can only redirect to about:preferences or show guidance.
    // On iOS/Android via Capacitor, the native settings app can be opened.
    try {
      if (window.__CAPACITOR__) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Capacitor?.Plugins?.App?.openUrl?.({ url: 'app-settings:' });
      } else {
        // Web: can only guide user
        window.open('about:preferences#privacy', '_blank');
      }
    } catch {
      // Ignore — EmptyState CTA already shows instructions
    }
  }, []);

  if (status === 'denied') {
    return (
      <EmptyState
        icon={CameraOff}
        title={t('photoReport.permissionDenied.title')}
        description={t('photoReport.permissionDenied.description')}
        ctaLabel={t('photoReport.permissionDenied.openSettings')}
        onCta={handleOpenSettings}
      />
    );
  }

  return <>{children(handlePickFile)}</>;
}

// Extend Window type for Capacitor bridge check
declare global {
  interface Window {
    __CAPACITOR__?: boolean;
  }
}
