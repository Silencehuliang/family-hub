# Profile Editing — Design Spec

## Problem

Users cannot modify their nickname or avatar after account creation. The `sys_member` table has `nickname` (TEXT NOT NULL) and `avatar_url` (TEXT, nullable) columns, but no API or UI exists for updating them.

## API

### `PATCH /auth/me`

New endpoint, requires auth middleware.

**Request body** (at least one field required):

```jsonc
{
  "nickname": "新昵称",       // optional, z.string().min(1).max(30)
  "avatarBase64": "data:image/..."  // optional, max 500KB base64 string
}
```

**Validation** (new Zod schema `updateMemberSchema` in `packages/shared/src/schemas.ts`):
- `nickname`: min 1, max 30 chars
- `avatarBase64`: optional, must match `data:image/(png|jpeg|webp);base64,` pattern, max 500KB

**Response** `200`:

```jsonc
{
  "data": {
    "nickname": string,
    "avatarUrl": string | null
  }
}
```

**Errors**:
- `422` — validation failure
- `500` — DB error

### AuthService

Add method `updateProfile(memberId, data)`:

```
UPDATE sys_member SET nickname = ?, avatar_url = ? WHERE id = ?
```

Return the updated `{ nickname, avatarUrl }`.

### Route

In `workers/api/src/routes/auth.ts`, register:

```ts
authRoutes.use('/me', authMiddleware);
authRoutes.patch('/me', async (c) => { ... });
```

Move existing `GET /auth/me` behind the same middleware group.

## Frontend

### EditProfileModal

New component at `apps/web/src/components/EditProfileModal.tsx`.

**Props**: `open: boolean`, `member: Member`, `onClose: () => void`

**Avatar**:
- Display current avatar (or default placeholder circle)
- Click → hidden `<input type="file" accept="image/*" capture="environment" />`
- On file select → read with `FileReader`, draw to canvas (200x200, JPEG 80%), `toDataURL()`
- Show preview of new avatar
- Button to remove avatar (set to null)

**Nickname**:
- `Input` component pre-filled with current nickname
- Max 30 chars, live counter

**Actions**:
- "保存" → `PATCH /auth/me` → on success: update auth store, close modal
- "取消" → close modal without saving

### SettingsPage Changes

- In the member info card, add "编辑资料" button
- On click → open EditProfileModal
- Import and render the modal

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Add `updateMemberSchema` |
| `packages/shared/src/types.ts` | (no change needed) |
| `workers/api/src/modules/auth/AuthService.ts` | Add `updateProfile()` |
| `workers/api/src/routes/auth.ts` | Add `PATCH /auth/me` |
| `apps/web/src/pages/SettingsPage.tsx` | Add edit button + modal |
| `apps/web/src/components/EditProfileModal.tsx` | New component |

## Security

- Auth middleware already applied to `/me` prefix
- No special role check — any member can edit their own profile
- Avatar base64 is sanitized by Zod pattern validation
