# PR-15: Photo Report, Checklist & Signature — Technical Notes

**Branch:** `claude/pr-15-photo-report-f9udo`
**Date:** 2026-03-01

---

## 1. Camera Permissions (Enterprise Requirement)

### Web (Browser)
- `CameraPermissionGate` component handles permission state.
- Uses `navigator.permissions.query({ name: 'camera' })` to detect state.
- If `denied`: renders `EmptyState` with CTA "Open system settings".
- If `prompt`: calls `getUserMedia` to trigger OS prompt, then immediately releases stream.
- Graceful fallback: if Permissions API is unsupported (Firefox, some mobile browsers), falls through to file input without crashing.

### iOS (Capacitor Native)
**iOS requires `NSCameraUsageDescription` in `ios/App/App/Info.plist`.**

When building the native iOS app via Capacitor, add to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Majster.AI używa kamery do dodawania zdjęć do fotoprotokołu projektu oraz dokumentacji odbioru robót.</string>
```

English equivalent (if needed for App Store):
```
Majster.AI uses the camera to add photos to the project photo report and client acceptance documentation.
```

The description must be **specific** to satisfy Apple App Store review guidelines (generic strings are rejected).

**Note:** The Capacitor config (`capacitor.config.ts`) does not hold the `NSCameraUsageDescription` — it must be set in Xcode or the iOS native project directly.

---

## 2. Image Compression

- Handled client-side in `src/lib/imageCompression.ts` (existing utility, PR-15 uses it with custom options).
- PR-15 settings: **max 1600×1600px**, **quality 0.75**, output WebP (JPEG fallback if unsupported).
- Original hook (`useProjectPhotos`) used 1920px/0.85 — PR-15 is more aggressive to handle weak LTE.
- Compression stats logged in dev console: `[PhotoReport] Compression: 6.2MB → 1.4MB (77.4% reduction)`.
- No re-compression on retry: compressed `Blob` is reused from optimistic state (`_pendingFile`).

---

## 3. Optimistic Upload UI

Sequence:
1. User selects file → `localPreview` created with `URL.createObjectURL()`.
2. Tile appears immediately with "Uploading..." overlay.
3. On success: tile replaced by server response (signed URL).
4. On failure: tile shows "Upload failed" + "Retry" button.
5. Retry reuses the original `File` object (no re-compression needed since `compressImage` produces a new File).

---

## 4. Storage Architecture (Private Bucket)

- Bucket: `project-photos` (must be set to **private** in Supabase Dashboard).
- Upload paths:
  - Photos: `{user_id}/{project_id}/{uuid}.{ext}`
  - Signature: `{user_id}/{project_id}/signature.png`
- Access: **signed URLs only** (1h expiry, generated server-side via `createSignedUrl`).
- **No public URLs** — prevents IDOR cross-tenant access.

### Bucket Storage Policy (apply in Supabase Dashboard → Storage → Policies)
```sql
-- Allow authenticated users to upload to their own folder only
CREATE POLICY "project_photos_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to view their own files only
CREATE POLICY "project_photos_view_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow authenticated users to delete their own files only
CREATE POLICY "project_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
```

---

## 5. RLS / IDOR Protection

All new tables have RLS enabled with `user_id = auth.uid()` policies:
- `project_photos` (existing + extended with `phase` column)
- `project_checklists` (new)
- `project_acceptance` (new)

**IDOR verification steps:**
1. Create User A account, create a project, upload photos.
2. Note the project ID and photo IDs.
3. Login as User B.
4. Attempt: `SELECT * FROM project_photos WHERE id = '<user_A_photo_id>'` → returns empty (RLS blocks).
5. Attempt: GET signed URL for User A's storage path while authenticated as User B → returns 403 (storage policy blocks).

---

## 6. Checklist Templates

4 minimal MVP templates defined in `src/hooks/useProjectChecklist.ts`:
- `general_basic` — 6 items (site clean, materials removed, surfaces, walkthrough, defects, photos)
- `plumbing_basic` — 7 items (leaks, pressure, drains, seals, labels, shutoffs, clean)
- `electrical_basic` — 7 items (breakers, outlets, GFCI, lights, wires, panels, clean)
- `painting_basic` — 7 items (coverage, drips, trim, color, tape, furniture, clean)

Items stored as JSONB `{id, label_key, is_done}[]`. `label_key` is resolved via i18n (`checklist.templates.<template>.<key>`).

**No template editor in PR-15** — template customization is deferred to PR-17.

---

## 7. FF_NEW_SHELL Compatibility

`ProjectHub.tsx` is used in both shell modes:
- `FF_NEW_SHELL=true`: reached via `/app/projects/:id` in new bottom nav shell.
- `FF_NEW_SHELL=false`: reached via legacy routing.
- New sections `photoReport` and `checklist` are part of the accordion — they render identically in both modes.

---

## 8. i18n Keys Added

New namespaces: `photoReport`, `checklist`, `signature`
New keys in `projectsV2.hub`: `sectionPhotoReport`, `sectionChecklist`
Languages: PL ✅ | EN ✅ | UK ✅
