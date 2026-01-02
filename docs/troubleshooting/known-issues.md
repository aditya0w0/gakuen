# Gakuen Setup Issues - Quick Fixes

## Issue: "scheduleSync is not a function"

**Fix in `/lib/storage/sync-manager.ts` line 17:**

Change:
```typescript
scheduleSyn(operation: SyncOperation): void {
```

To:
```typescript
scheduleSync(operation: SyncOperation): void {
```

(Typo: `scheduleSyn` → `scheduleSync`)
