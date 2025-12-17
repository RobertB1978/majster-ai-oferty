# Mobile Testing Playbook (iOS & Android)

**TIER 1.5 - Mobile App Testing via Capacitor**

**Manifest compliance:**
- ✅ Playbook = komenda + expected output
- ✅ Fail fast (clear error messages)
- ✅ Reproduce, don't guess (repeatable tests)

---

## Why Mobile Testing Matters

**Business Context:**
- 60%+ users in Poland use mobile devices
- Construction workers use phones on-site
- Mobile UX = competitive advantage

**Tech Stack:**
- React app wraps in Capacitor
- Native iOS/Android app
- Single codebase → 2 platforms

---

## Prerequisites

**Required Tools:**

**For iOS (macOS only):**
- Xcode 15+ (from App Store)
- iOS Simulator (included with Xcode)
- CocoaPods: `sudo gem install cocoapods`

**For Android (any OS):**
- Android Studio (https://developer.android.com/studio)
- Java JDK 17+: `brew install openjdk@17` or from Oracle
- Android SDK (installed via Android Studio)

**Capacitor CLI:**
```bash
npm install -g @capacitor/cli
```

Expected: `capacitor@7.4.4` or higher

---

## Setup: Initial Mobile Build

### Step 1: Build Web App

**Command:**
```bash
npm run build
```

**Expected Output:**
```
✓ built in 29s
dist/index.html                 1.83 kB
dist/assets/js/index-[hash].js  523 kB │ gzip: 160 kB
```

**Fail Fast:**
- If build fails → Fix TypeScript/ESLint errors first
- If bundle > 1MB → Performance issue, investigate

---

### Step 2: Sync with Capacitor

**Command:**
```bash
npx cap sync
```

**Expected Output:**
```
✔ Copying web assets from dist to ios/App/App/public in 1.23s
✔ Copying native bridge in 215.34ms
✔ Copying capacitor.config.json in 5.12ms
✔ copy ios in 1.46s
✔ Updating iOS plugins in 23.45ms
✔ Updating iOS native dependencies with "pod install" (may take several minutes)
✔ update ios in 45.67s
✔ Copying web assets from dist to android/app/src/main/assets/public in 1.05s
✔ Copying native bridge in 156.23ms
✔ Copying capacitor.config.json in 3.45ms
✔ copy android in 1.22s
✔ Updating Android plugins in 12.34ms
✔ update android in 1.56s
✔ Syncing complete!
```

**Fail Fast:**
- Error: "dist folder not found" → Run `npm run build` first
- Error: "pod install failed" → Run `cd ios/App && pod repo update && pod install`
- Error: "Android SDK not found" → Set `ANDROID_SDK_ROOT` in env

---

## iOS Testing

### Test 1: iOS Simulator (Quick Test)

**Command:**
```bash
npx cap open ios
```

**Expected:**
- Xcode opens
- See project "App" in sidebar
- Click "App" → "Majster.AI" scheme

**In Xcode:**
1. Select simulator: "iPhone 15 Pro" (top left)
2. Click ▶ (Run button) or Cmd+R
3. Wait for build (first time: 2-3 min)

**Expected Result:**
```
Build Succeeded
Simulator boots
App launches
Shows splash screen (blue, 2 seconds)
Shows login page
```

**Test Checklist:**
- [ ] App launches without crash
- [ ] Splash screen shows
- [ ] Login page renders correctly
- [ ] Can type in inputs
- [ ] Keyboard shows/hides properly
- [ ] Navigation works (bottom tabs)
- [ ] PWA install prompt does NOT show (native app)

**Common Issues:**

| Error | Solution |
|-------|----------|
| "Build Failed: Command PhaseScriptExecution failed" | Clean build: Product → Clean Build Folder (Cmd+Shift+K) |
| "The app is not signed" | Auto-signing: Signing & Capabilities → Team: "Your Apple ID" |
| "Simulator can't be started" | Restart simulator: Device → Erase All Content and Settings |

---

### Test 2: iOS Physical Device (Full Test)

**Prerequisites:**
- Apple Developer Account (free tier OK for testing)
- iPhone connected via USB
- Trust computer on iPhone

**Steps:**

1. **Connect iPhone:**
   ```bash
   # Verify device detected
   xcrun xctrace list devices
   ```
   Expected: Your iPhone in list

2. **Configure Signing in Xcode:**
   - Open iOS project: `npx cap open ios`
   - Select "App" target
   - Go to "Signing & Capabilities"
   - Team: Select your Apple ID
   - Bundle Identifier: Change to unique (e.g., `com.yourname.majster`)

3. **Build & Run:**
   - Select your iPhone (top left, next to scheme)
   - Click ▶ Run (Cmd+R)
   - On iPhone: Settings → General → VPN & Device Management → Trust "Your Developer Name"

**Expected Result:**
- App installs on phone
- App launches
- Works offline (test airplane mode)
- Push notifications permission prompt (if enabled)

**Device-Specific Tests:**
- [ ] Touch gestures work
- [ ] Pull-to-refresh works
- [ ] Camera access (for photo uploads)
- [ ] File picker works
- [ ] Biometric auth (if implemented)
- [ ] Works in portrait & landscape
- [ ] Status bar integrates correctly

---

## Android Testing

### Test 1: Android Emulator (Quick Test)

**Setup Emulator (First Time):**
1. Open Android Studio
2. Tools → Device Manager
3. Create Device → Pixel 7
4. System Image: Android 13 (API 33)
5. Finish

**Command:**
```bash
npx cap open android
```

**Expected:**
- Android Studio opens
- Gradle sync starts (first time: 2-5 min)

**Run App:**
1. Wait for Gradle sync to finish
2. Select emulator: "Pixel 7 API 33" (top toolbar)
3. Click ▶ Run or Shift+F10
4. Wait for emulator boot (first time: 2-3 min)

**Expected Result:**
```
BUILD SUCCESSFUL in 45s
Emulator starts
App installs
App launches
Shows splash screen
Shows login page
```

**Test Checklist:**
- [ ] App launches without crash
- [ ] Splash screen shows
- [ ] Login page renders
- [ ] Keyboard works
- [ ] Navigation works
- [ ] Back button works
- [ ] No PWA install prompt

**Common Issues:**

| Error | Solution |
|-------|----------|
| "Gradle sync failed" | File → Invalidate Caches → Restart |
| "SDK location not found" | Create `local.properties` with `sdk.dir=/path/to/sdk` |
| "Emulator: Process finished with exit code 1" | AVD Manager → Wipe Data → Cold Boot |

---

### Test 2: Android Physical Device (Full Test)

**Prerequisites:**
- Android phone with USB debugging enabled
- USB cable

**Enable USB Debugging:**
1. Settings → About Phone → Tap "Build Number" 7 times
2. Developer Mode enabled
3. Settings → System → Developer Options → USB Debugging ON

**Steps:**

1. **Connect Phone:**
   ```bash
   # Verify device detected
   adb devices
   ```
   Expected: Your device in list

   If "unauthorized":
   - Check phone for "Allow USB debugging?" prompt
   - Tap "Always allow" → OK

2. **Build & Run:**
   - Open: `npx cap open android`
   - Select your phone (top toolbar)
   - Click ▶ Run

**Expected Result:**
- App installs on phone
- App launches
- Works with mobile data (not just WiFi)

**Device-Specific Tests:**
- [ ] Touch works smoothly
- [ ] Notifications work
- [ ] Camera/file access works
- [ ] Back button behavior correct
- [ ] App survives phone rotation
- [ ] App survives background/foreground
- [ ] Works on different screen sizes

---

## Automated Mobile Testing

### Test 3: Playwright Mobile Testing (CI-Ready)

**Install:**
```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

**Create test: `e2e/mobile.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test.use({
  ...devices['iPhone 13'],
  // Or: ...devices['Pixel 5']
});

test('mobile: app loads on mobile viewport', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Check mobile viewport
  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThan(500);

  // Check touch-friendly UI
  await expect(page.locator('button')).toHaveCount(greaterThan(0));

  // Check no desktop-only elements
  await expect(page.locator('.desktop-only')).toHaveCount(0);
});

test('mobile: login flow works', async ({ page }) => {
  await page.goto('http://localhost:8080/login');

  // Mobile form should be visible
  await expect(page.getByLabel('Email')).toBeVisible();

  // Tap (not click)
  await page.getByLabel('Email').tap();
  await page.keyboard.type('test@example.com');

  // Keyboard should appear (can't test directly, but type should work)
  await expect(page.getByLabel('Email')).toHaveValue('test@example.com');
});
```

**Run:**
```bash
npx playwright test e2e/mobile.spec.ts
```

**Expected:**
```
Running 2 tests using 1 worker
✓ [Mobile Safari] › mobile.spec.ts:5:1 › mobile: app loads (1.2s)
✓ [Mobile Safari] › mobile.spec.ts:18:1 › mobile: login flow works (2.3s)

2 passed (3.5s)
```

---

## Performance Testing (Mobile)

### Test 4: Mobile Performance Metrics

**Using Lighthouse Mobile:**
```bash
npm install -g lighthouse

# Run mobile performance test
lighthouse https://your-app.vercel.app \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html \
  --output-path=./lighthouse-mobile.html
```

**Expected Metrics (Targets):**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint (FCP) | < 1.8s | ? | Test |
| Largest Contentful Paint (LCP) | < 2.5s | ? | Test |
| Total Blocking Time (TBT) | < 200ms | ? | Test |
| Cumulative Layout Shift (CLS) | < 0.1 | ? | Test |
| Speed Index | < 3.4s | ? | Test |
| Performance Score | > 90 | ? | Test |

**Fail Fast:**
- Score < 50: **CRITICAL** - Mobile UX is broken
- Score 50-70: **WARNING** - Needs optimization
- Score 70-90: **GOOD** - Minor improvements
- Score 90+: **EXCELLENT** - Production ready

---

## Pre-Production Mobile Checklist

Before releasing mobile app:

**Functional:**
- [ ] App launches successfully (iOS & Android)
- [ ] Login/signup works
- [ ] Core features work (create project, quote, PDF)
- [ ] Camera/file upload works
- [ ] Notifications work (if enabled)
- [ ] Offline mode works (if enabled)
- [ ] No console errors in native logs

**Performance:**
- [ ] Lighthouse mobile score > 70
- [ ] Bundle size < 3 MB
- [ ] App startup < 3 seconds
- [ ] Smooth scrolling (60 FPS)

**UI/UX:**
- [ ] All text is readable on mobile
- [ ] Touch targets are 44x44px minimum
- [ ] Forms work with mobile keyboard
- [ ] No horizontal scroll
- [ ] Safe area insets respected (iPhone notch)

**Security:**
- [ ] HTTPS enforced
- [ ] No secrets in app bundle
- [ ] Biometric auth works (if implemented)

**Compliance:**
- [ ] Privacy policy link in app
- [ ] GDPR consent collected
- [ ] App Store guidelines met

---

## Updating Mobile App

**After Code Changes:**
```bash
# 1. Build web
npm run build

# 2. Sync to native
npx cap sync

# 3. Test on simulator
npx cap run ios  # or: npx cap run android
```

**Automated (add to package.json):**
```json
{
  "scripts": {
    "mobile:sync": "npm run build && npx cap sync",
    "mobile:ios": "npm run mobile:sync && npx cap run ios",
    "mobile:android": "npm run mobile:sync && npx cap run android"
  }
}
```

---

## Common Mobile Issues & Fixes

### Issue: "Can't reach server"
**Cause:** Mobile app tries to connect to localhost
**Fix:** Update capacitor.config.ts:
```typescript
server: {
  url: 'https://your-production-url.com',  // NOT localhost!
  cleartext: true
}
```

### Issue: "White screen on launch"
**Cause:** Build not synced or wrong webDir
**Fix:**
```bash
rm -rf ios/App/App/public android/app/src/main/assets/public
npm run build
npx cap sync
```

### Issue: "Keyboard covers input"
**Cause:** No keyboard avoidance
**Fix:** Install plugin:
```bash
npm install @capacitor/keyboard
npx cap sync
```

### Issue: "StatusBar overlaps content"
**Fix:** Install plugin:
```bash
npm install @capacitor/status-bar
npx cap sync
```

---

## CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Mobile Build Test
on: [push]
jobs:
  test-mobile:
    runs-on: macos-latest  # Required for iOS
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build
      - run: npx cap sync

      # iOS build test
      - run: npx cap build ios --no-open

      # Android build test (use ubuntu-latest for Android-only)
      # - run: npx cap build android --no-open
```

---

## Success Criteria

**TIER 1.5 Complete When:**
- ✅ iOS simulator test passes
- ✅ Android emulator test passes
- ✅ App works on 1 physical iOS device
- ✅ App works on 1 physical Android device
- ✅ Lighthouse mobile score > 70
- ✅ No critical mobile UX issues
- ✅ Team can reproduce build

---

**Last Updated:** 2025-12-17
**Owned By:** Mobile QA / Platform
**Test Frequency:** Before each release
