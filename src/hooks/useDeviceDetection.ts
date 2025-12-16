import { useState, useEffect } from 'react';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  deviceName: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasTouchScreen: boolean;
  biometricType: 'fingerprint' | 'face' | 'both' | 'unknown';
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  return deviceInfo;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const platform = navigator.platform || '';
  
  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  let isIOS = false;
  let isAndroid = false;

  if (/iPhone|iPad|iPod/.test(ua)) {
    os = 'iOS';
    isIOS = true;
    const match = ua.match(/OS (\d+[._]\d+)/);
    if (match) {
      osVersion = match[1].replace('_', '.');
    }
  } else if (/Android/.test(ua)) {
    os = 'Android';
    isAndroid = true;
    const match = ua.match(/Android (\d+\.?\d*)/);
    if (match) {
      osVersion = match[1];
    }
  } else if (/Windows NT/.test(ua)) {
    os = 'Windows';
    const match = ua.match(/Windows NT (\d+\.?\d*)/);
    if (match) {
      const ntVersion = match[1];
      const versionMap: Record<string, string> = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
      };
      osVersion = versionMap[ntVersion] || ntVersion;
    }
  } else if (/Mac OS X/.test(ua)) {
    os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      osVersion = match[1].replace('_', '.');
    }
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  } else if (/CrOS/.test(ua)) {
    os = 'Chrome OS';
  }

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';

  if (/Edg\//.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'Opera';
    const match = ua.match(/OPR\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (/MSIE|Trident/.test(ua)) {
    browser = 'Internet Explorer';
  }

  // Detect device type
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  const isMobile = /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || 
    (isAndroid && !/Mobi/i.test(ua));

  if (isTablet) {
    type = 'tablet';
  } else if (isMobile) {
    type = 'mobile';
  }

  // Detect touch screen
  const hasTouchScreen = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific and not in standard types
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

  // Detect biometric type
  let biometricType: 'fingerprint' | 'face' | 'both' | 'unknown' = 'unknown';
  
  if (isIOS) {
    // iPhone X and later have Face ID, older have Touch ID
    const iosVersionNum = parseFloat(osVersion);
    if (/iPhone/.test(ua)) {
      // iPhone X+ detection based on screen dimensions and iOS version
      if (iosVersionNum >= 11) {
        // Face ID introduced in iOS 11 with iPhone X
        // Most modern iPhones use Face ID
        biometricType = 'face';
      } else {
        biometricType = 'fingerprint';
      }
    } else if (/iPad/.test(ua)) {
      // Newer iPads have Face ID, older have Touch ID
      biometricType = iosVersionNum >= 12 ? 'both' : 'fingerprint';
    }
  } else if (isAndroid) {
    // Android typically uses fingerprint, some newer devices have face unlock
    biometricType = 'fingerprint';
  } else if (os === 'Windows') {
    // Windows Hello supports both
    biometricType = 'both';
  } else if (os === 'macOS') {
    // Touch ID on Mac
    biometricType = 'fingerprint';
  }

  // Generate friendly device name
  let deviceName = '';
  
  if (isIOS) {
    if (/iPhone/.test(ua)) {
      deviceName = `iPhone (${os} ${osVersion})`;
    } else if (/iPad/.test(ua)) {
      deviceName = `iPad (${os} ${osVersion})`;
    }
  } else if (isAndroid) {
    // Try to extract device model from user agent
    const modelMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (modelMatch) {
      deviceName = `${modelMatch[1].trim()} (Android ${osVersion})`;
    } else {
      deviceName = `Android ${type === 'tablet' ? 'Tablet' : 'Phone'} (${osVersion})`;
    }
  } else if (os === 'Windows') {
    deviceName = `Windows ${osVersion} (${browser})`;
  } else if (os === 'macOS') {
    deviceName = `Mac (macOS ${osVersion})`;
  } else if (os === 'Linux') {
    deviceName = `Linux (${browser})`;
  } else if (os === 'Chrome OS') {
    deviceName = `Chromebook (${browser})`;
  } else {
    deviceName = `${os} ${osVersion} (${browser})`;
  }

  return {
    type,
    os,
    osVersion,
    browser,
    browserVersion,
    deviceName: deviceName.trim(),
    isMobile: isMobile || isTablet,
    isIOS,
    isAndroid,
    hasTouchScreen,
    biometricType,
  };
}

export function getBiometricIcon(biometricType: 'fingerprint' | 'face' | 'both' | 'unknown'): string {
  switch (biometricType) {
    case 'face':
      return 'Face ID';
    case 'fingerprint':
      return 'Touch ID / Odcisk palca';
    case 'both':
      return 'Face ID / Touch ID';
    default:
      return 'Biometria';
  }
}
