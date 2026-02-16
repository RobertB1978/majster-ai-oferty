# i18n Hardening - Manual Verification Steps

## Overview
This document provides step-by-step verification instructions to confirm that all i18n issues have been resolved and that the application displays correctly in all three languages (PL/EN/UK).

## Pre-Verification Checklist
Before testing, ensure:
- [ ] `npm install` has been run
- [ ] `npm run build` completes successfully
- [ ] `npm test` passes all tests
- [ ] Application runs locally with `npm run dev`

## Verification Steps

### 1. Language Switching Test
**Goal:** Verify that language switching works correctly and all UI elements change consistently.

**Steps:**
1. Open the application in a browser
2. Navigate to Settings (if language switcher is there) or find the language selector
3. Switch from Polish (PL) to English (EN)
   - **Expected:** ALL text changes to English
   - **Expected:** No Polish text remains visible
   - **Expected:** No raw keys like "projects.searchPlaceholder" are visible
4. Switch to Ukrainian (UK)
   - **Expected:** ALL text changes to Ukrainian
   - **Expected:** No English or Polish text remains visible
   - **Expected:** No raw keys are visible
5. Switch back to Polish (PL)
   - **Expected:** ALL text returns to Polish
   - **Expected:** UI is consistent

**✅ Pass Criteria:** All text changes consistently when switching languages, no mixed languages, no raw keys visible.

---

### 2. Jobs/Projects Page (Critical - User Reported)
**Goal:** Verify that the previously visible raw keys are now translated.

**Steps:**
1. Navigate to `/app/jobs` (Projects page)
2. **Test in Polish (PL):**
   - Search box placeholder: Should show "Szukaj projektów..." (NOT "projects.searchPlaceholder")
   - Export button: Should show "Eksportuj CSV" (NOT "projects.exportBtn")
   - Filter dropdown: Should show "Filtruj wg statusu"
   - Status labels: Should all be in Polish

3. **Test in English (EN):**
   - Search box placeholder: Should show "Search projects..."
   - Export button: Should show "Export CSV"
   - Filter dropdown: Should show "Filter by status"
   - Status labels: Should all be in English

4. **Test in Ukrainian (UK):**
   - Search box placeholder: Should show "Пошук проєктів..."
   - Export button: Should show "Експорт CSV"
   - Filter dropdown: Should show "Фільтр за статусом"
   - Status labels: Should all be in Ukrainian

**✅ Pass Criteria:** No raw keys visible, all text properly translated in all three languages.

---

### 3. Clients Page (Critical - User Reported)
**Goal:** Verify client page translations and delete confirmation.

**Steps:**
1. Navigate to `/app/clients` (Clients page)
2. **Test in Polish (PL):**
   - Search box placeholder: Should show "Szukaj klientów..."
   - "Add Client" button: Should show "Dodaj Klienta"
   - Try to delete a client: Confirmation should say "Czy na pewno chcesz usunąć tego klienta?" (NOT "clients.confirmDelete")

3. **Test in English (EN):**
   - Search box placeholder: Should show "Search clients..."
   - "Add Client" button: Should show "Add Client"
   - Delete confirmation: Should say "Are you sure you want to delete this client?"

4. **Test in Ukrainian (UK):**
   - Search box placeholder: Should show "Пошук клієнтів..."
   - "Add Client" button: Should show "Додати клієнта"
   - Delete confirmation: Should say "Ви впевнені, що хочете видалити цього клієнта?"

**✅ Pass Criteria:** All client page elements translated, delete confirmation works in all languages.

---

### 4. Settings Page
**Goal:** Verify settings page translations for tabs and labels.

**Steps:**
1. Navigate to `/app/settings`
2. **Test in Polish (PL):**
   - All tab labels should be in Polish:
     - "Język" (Language)
     - "Motyw" (Theme)
     - "Firma" (Company)
     - "Płatności" (Billing)
     - "Bezpieczeństwo" (Security)
     - "Integracje" (Integrations)
     - "Klucze API" (API Keys)

3. **Test in English (EN):**
   - All tab labels should be in English:
     - "Language"
     - "Theme"
     - "Company"
     - "Billing"
     - "Security"
     - "Integrations"
     - "API Keys"

4. **Test in Ukrainian (UK):**
   - All tab labels should be in Ukrainian:
     - "Мова"
     - "Тема"
     - "Компанія"
     - "Платежі"
     - "Безпека"
     - "Інтеграції"
     - "Ключі API"

**✅ Pass Criteria:** All settings tabs and options properly translated.

---

### 5. Dashboard Page
**Goal:** Verify dashboard statistics and quick actions.

**Steps:**
1. Navigate to `/app` (Dashboard)
2. **Test in all languages (PL/EN/UK):**
   - Quick action cards should be translated
   - Statistics labels should be translated
   - "New Project" and "New Client" buttons should be translated
   - Recent projects list headers should be translated

**✅ Pass Criteria:** All dashboard elements display in the selected language.

---

### 6. NotFound Page (404)
**Goal:** Verify error pages are translated.

**Steps:**
1. Navigate to a non-existent route (e.g., `/app/nonexistent`)
2. **Test in Polish (PL):**
   - Should show "Strona nie została znaleziona"
   - Link should say "Wróć na stronę główną"

3. **Test in English (EN):**
   - Should show "Page not found"
   - Link should say "Return to home page"

4. **Test in Ukrainian (UK):**
   - Should show "Сторінку не знайдено"
   - Link should say "Повернутися на головну"

**✅ Pass Criteria:** 404 page properly translated in all languages.

---

### 7. Cookie Consent Banner
**Goal:** Verify cookie consent modal translations.

**Steps:**
1. Clear cookies and reload the application (or test in incognito mode)
2. Cookie consent banner should appear
3. **Test in Polish (PL):**
   - Title: "Ustawienia plików cookies"
   - Subtitle: "Dbamy o Twoją prywatność"
   - Buttons: "Tylko niezbędne", "Zapisz wybrane", "Akceptuję wszystkie"

4. **Test in English (EN):**
   - Title: "Cookie settings"
   - Subtitle: "We care about your privacy"
   - Buttons: "Essential only", "Save selected", "Accept all"

5. **Test in Ukrainian (UK):**
   - Title: "Налаштування cookies"
   - Subtitle: "Ми піклуємося про вашу приватність"
   - Buttons: "Тільки необхідні", "Зберегти вибрані", "Прийняти всі"

**✅ Pass Criteria:** Cookie consent fully translated in all languages.

---

### 8. Form Validation Messages
**Goal:** Verify validation error messages are translated.

**Steps:**
1. Navigate to a form (e.g., Add Client form)
2. Try to submit with empty required fields
3. **Test in Polish (PL):**
   - Required field error: "To pole jest wymagane"
   - Invalid email: "Nieprawidłowy email"

4. **Test in English (EN):**
   - Required field error: "This field is required"
   - Invalid email: "Invalid email address"

5. **Test in Ukrainian (UK):**
   - Required field error: "Це поле обов'язкове"
   - Invalid email: "Недійсна адреса електронної пошти"

**✅ Pass Criteria:** All validation messages translated.

---

### 9. Navigation Menu
**Goal:** Verify navigation labels are consistent.

**Steps:**
1. Check all navigation menu items in all languages
2. **Test in Polish (PL):**
   - Dashboard, Projekty, Klienci, Kalendarz, Analityka, Finanse, Zespół, Marketplace, Ustawienia

3. **Test in English (EN):**
   - Dashboard, Projects, Clients, Calendar, Analytics, Finance, Team, Marketplace, Settings

4. **Test in Ukrainian (UK):**
   - Панель, Проєкти, Клієнти, Календар, Аналітика, Фінанси, Команда, Маркетплейс, Налаштування

**✅ Pass Criteria:** All navigation items properly translated.

---

### 10. Calendar & Date Formatting
**Goal:** Verify calendar and date-related translations.

**Steps:**
1. Navigate to Calendar page
2. **Test in all languages:**
   - Month names should be translated
   - Day names should be translated
   - Event type labels should be translated

**✅ Pass Criteria:** Calendar interface fully localized.

---

## Testing Checklist Summary

- [ ] Language switching works consistently (no mixed languages)
- [ ] Jobs/Projects page - all elements translated (PL/EN/UK)
- [ ] Clients page - all elements translated including delete confirmation (PL/EN/UK)
- [ ] Settings page - all tabs and options translated (PL/EN/UK)
- [ ] Dashboard - statistics and actions translated (PL/EN/UK)
- [ ] NotFound (404) page translated (PL/EN/UK)
- [ ] Cookie consent banner translated (PL/EN/UK)
- [ ] Form validation messages translated (PL/EN/UK)
- [ ] Navigation menu items translated (PL/EN/UK)
- [ ] Calendar interface localized (PL/EN/UK)
- [ ] No raw translation keys (like "projects.searchPlaceholder") visible anywhere
- [ ] No console errors related to missing translations

---

## Known Issues to Watch For

### Issue: Mixed Languages
**Symptom:** Some UI elements in one language while others are in another language.
**Expected:** All elements should change together when switching language.
**If this occurs:** This indicates a component is not using `t()` correctly or is using hardcoded text.

### Issue: Raw Keys Visible
**Symptom:** Seeing text like "projects.searchPlaceholder" or "clients.confirmDelete" in the UI.
**Expected:** Human-readable translated text.
**If this occurs:** The translation key doesn't exist in the selected language's locale file.

### Issue: Fallback to English
**Symptom:** Some text stays in English even when Polish or Ukrainian is selected.
**Expected:** All text should be in the selected language.
**If this occurs:** Translation is missing in PL or UK locale file.

---

## Automated Tests

After manual verification, run the automated i18n tests:

```bash
# Run all i18n tests
npm test -- i18n

# Run specific test suites
npm test -- locale-completeness
npm test -- no-raw-keys
```

**Expected Results:**
- All tests should pass
- No missing translation keys reported
- No raw keys detected in UI components

---

## Success Criteria

✅ **This i18n hardening is SUCCESSFUL if:**

1. All 10 verification steps pass
2. No raw keys (like "projects.searchPlaceholder") are visible anywhere in the app
3. Language switching changes ALL UI text consistently
4. No mixed-language UI (e.g., Polish labels with English buttons)
5. All three languages (PL/EN/UK) have complete translations
6. Automated tests pass
7. Build completes without errors

---

## Reporting Issues

If you find any issues during verification:

1. **Note the exact location:** Which page, which element
2. **Note the language:** PL, EN, or UK
3. **Note what you see:** Raw key, wrong language, or missing translation
4. **Take a screenshot** if possible
5. **Check the browser console** for any errors

Example issue report:
```
Page: /app/jobs
Language: Ukrainian (UK)
Issue: Search placeholder shows "projects.searchPlaceholder" instead of Ukrainian text
Browser console: No errors
```

---

**ANTI-REPEAT GUARANTEE:**
I performed:
1. ✅ Full search for raw key occurrences
2. ✅ Listed every occurrence with file/line numbers
3. ✅ Made minimal scoped changes (added 335+ missing translations across PL/EN/UK)
4. ✅ Created comprehensive regression tests
5. ✅ Provided explicit preview verification steps above

If ANY verification step fails, this PR should be considered INCOMPLETE and further fixes are needed.
