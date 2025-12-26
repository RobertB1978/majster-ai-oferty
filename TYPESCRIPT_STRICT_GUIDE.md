# TypeScript Progressive Strictness Guide

## Overview

This project uses **progressive TypeScript strictness** to gradually improve type safety without breaking existing builds.

## Configurations

### `tsconfig.app.json` (Standard Build)
- **Used by:** `npm run build`, `npm run type-check`  
- **Status:** ✅ PASSING (0 errors)
- **Level:** `strict: true` with production-ready settings

### `tsconfig.strict.json` (Ultra-Strict)
- **Used by:** `npm run type-check:strict`
- **Status:** ⚠️ ~360 errors (work in progress)
- **Level:** Maximum strictness for gradual cleanup

## Additional Strict Checks

The `tsconfig.strict.json` enables **extra-strict** type checking:

```typescript
"noImplicitReturns": true,           // All code paths must return
"noFallthroughCasesInSwitch": true,  // No switch fallthrough
"noUncheckedIndexedAccess": true,    // arr[i] returns T | undefined
"noImplicitOverride": true,          // Require 'override' keyword
"allowUnusedLabels": false,          // Ban unused labels
"allowUnreachableCode": false,       // Ban unreachable code
```

## How to Use

### Regular Development (Current Workflow)
```bash
npm run type-check    # Standard strictness - must pass
npm run build         # Must pass for deploy
```

### Strict Mode Cleanup (Gradual)
```bash
npm run type-check:strict   # Show all strict violations
```

Work through errors file-by-file, fixing:
1. Missing return statements
2. Potentially undefined array access
3. Missing override modifiers
4. Type narrowing issues

## Progress Tracking

Current status:
- **Standard build:** 0 errors ✅
- **Strict mode:** ~360 errors ⚠️

Goal: Gradually reduce strict errors to 0 over time.

## Why Progressive?

- ✅ **No disruption:** Existing builds keep working
- ✅ **Gradual improvement:** Fix errors incrementally
- ✅ **Better types:** Catch more bugs at compile-time
- ✅ **Team-friendly:** No massive breaking changes

## Contributing

When fixing strict errors:
1. Run `npm run type-check:strict`
2. Pick a file with errors
3. Fix errors without breaking functionality
4. Verify: `npm test && npm run type-check`
5. Commit with message: `refactor: fix strict TypeScript errors in [file]`

## Common Fixes

### Array Access (noUncheckedIndexedAccess)
```typescript
// Before
const item = arr[0];
item.doSomething();  // Error: possibly undefined

// After
const item = arr[0];
if (item) {
  item.doSomething();
}
// Or
const item = arr[0]!;  // If you're 100% sure it exists
```

### Missing Returns (noImplicitReturns)
```typescript
// Before
function getStatus(active: boolean) {
  if (active) {
    return "active";
  }
  // Error: not all paths return
}

// After
function getStatus(active: boolean) {
  if (active) {
    return "active";
  }
  return "inactive";
}
```

### Override Modifiers (noImplicitOverride)
```typescript
// Before
class Child extends Parent {
  componentDidMount() { }  // Error: missing override
}

// After
class Child extends Parent {
  override componentDidMount() { }
}
```

## CI/CD Integration

**Current:** Only standard `type-check` runs in CI (must pass)

**Future:** Add strict mode as optional check:
```yaml
- name: Strict TypeScript Check (informational)
  run: npm run type-check:strict
  continue-on-error: true
```

---

**Created:** 2025-12-26  
**Status:** Progressive adoption in progress  
**Target:** Zero strict errors (gradual milestone)
