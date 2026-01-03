# Known Issues and Workarounds

## Overview

This document tracks known issues in the Gakuen platform and provides workarounds until permanent fixes are implemented.

---

## Active Issues

### Issue: "scheduleSync is not a function"

**Location:** `/lib/storage/sync-manager.ts` line 17

**Cause:** Typographical error in function name

**Current Code:**

```typescript
scheduleSyn(operation: SyncOperation): void {
```

**Corrected Code:**

```typescript
scheduleSync(operation: SyncOperation): void {
```

**Resolution:** Rename `scheduleSyn` to `scheduleSync`

---

## Issue Tracking

| Issue | Severity | Status | Workaround Available |
|-------|----------|--------|---------------------|
| scheduleSync typo | High | Documented | Yes |

---

## Reporting New Issues

When reporting issues, please include:

1. **Steps to reproduce** - Detailed steps to trigger the issue
2. **Expected behavior** - What should happen
3. **Actual behavior** - What actually happens
4. **Environment** - Browser, OS, Node.js version
5. **Console errors** - Any relevant error messages
