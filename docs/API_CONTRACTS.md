# API Contracts Documentation

**Security Pack Δ1 - PROMPT 9/10**

This document explains how to work with API contracts.

---

## OpenAPI Specification

**Location:** `docs/api/openapi.yaml`

The OpenAPI spec documents:
- All public Edge Functions
- Request/response schemas
- Authentication requirements
- Error responses
- Rate limits

---

## Viewing Documentation

### Option 1: Swagger UI (Online)

1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Upload `docs/api/openapi.yaml`
3. View interactive documentation

### Option 2: Redoc (Better UI)

```bash
npx @redocly/cli preview-docs docs/api/openapi.yaml
```

### Option 3: VS Code Extension

Install: **OpenAPI (Swagger) Editor**
- View: Right-click `openapi.yaml` → "Preview Swagger"

---

## Generating Types

To generate TypeScript types from OpenAPI spec:

```bash
npx openapi-typescript docs/api/openapi.yaml --output src/types/api.ts
```

---

## Contract Testing

Contract tests verify that API matches the spec.

**TODO:** Implement contract tests using:
- `jest-openapi` (Node.js)
- Or `openapi-validator` (Deno)

Example:
```typescript
import { expect } from '@jest/globals';
import { satisfiesApiSpec } from 'jest-openapi';

test('DELETE /delete-user-account matches spec', async () => {
  const response = await fetch('/delete-user-account', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer token' },
    body: JSON.stringify({ confirmationPhrase: 'DELETE MY ACCOUNT' })
  });

  expect(response).toSatisfyApiSpec();
});
```

---

## Adding New Endpoints

When adding a new Edge Function:

1. **Implement the function**
2. **Add to openapi.yaml**:
   ```yaml
   /my-new-endpoint:
     post:
       summary: My new endpoint
       requestBody:
         # ... schema
       responses:
         '200':
           # ... schema
   ```
3. **Generate types**: `npx openapi-typescript ...`
4. **Write contract tests**
5. **Update this documentation**

---

## API Versioning

Currently using **v1** (implicit in URL).

When breaking changes needed:
1. Create new version: `/functions/v2/...`
2. Maintain v1 for 6 months
3. Deprecate v1 with warnings
4. Remove v1 after migration

---

## Maintenance

- [ ] Review and update specs quarterly
- [ ] Add contract tests for all endpoints
- [ ] Generate client SDK from spec
- [ ] Publish API docs to public site (optional)

---

**Last updated:** 2025-12-16
