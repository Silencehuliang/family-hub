# Profile Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to update nickname and avatar from SettingsPage

**Architecture:** Add `PATCH /auth/me` endpoint (Zod schema → AuthService.updateProfile() → DB), add `api.patch()` client method, create `EditProfileModal` component with image upload (canvas compress → base64)

**Tech Stack:** Zod (shared), Hono (API), Ant Design Modal + Upload (frontend)

---

### Task 1: Add `updateMemberSchema` to shared schemas

**Files:**
- Modify: `packages/shared/src/schemas.ts`

- [ ] **Step 1: Add schema + type**

After `changePinSchema` block (before the bill section comment), add:

```ts
/** 更新个人资料 */
export const updateMemberSchema = z.object({
  nickname: z.string().min(1).max(30).optional(),
  avatarBase64: z.string().max(500_000).optional(),
}).refine((data) => data.nickname !== undefined || data.avatarBase64 !== undefined, {
  message: '至少需要更新一个字段',
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/schemas.ts
git commit -m "feat(shared): add updateMemberSchema"
```

---

### Task 2: Add `updateProfile()` to AuthService

**Files:**
- Modify: `workers/api/src/modules/auth/AuthService.ts`

- [ ] **Step 1: Add method**

After `getMe()` method (line 254), add:

```ts
  // ──────────────────────────────────────────────────────────
  // 更新个人资料（昵称/头像）
  // ──────────────────────────────────────────────────────────
  async updateProfile(memberId: string, data: {
    nickname?: string;
    avatarBase64?: string;
  }): Promise<{ nickname: string; avatarUrl: string | null }> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.nickname !== undefined) {
      sets.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatarBase64 !== undefined) {
      // 空字符串 = 清除头像; 非空 = 更新头像
      sets.push('avatar_url = ?');
      values.push(data.avatarBase64 || null);
    }

    if (sets.length === 0) {
      throw new BizError(ErrorCode.VALIDATION, '没有需要更新的字段');
    }

    await execute(
      this.db,
      `UPDATE sys_member SET ${sets.join(', ')} WHERE id = ?`,
      ...values,
      memberId,
    );

    const updated = await findOne<{ nickname: string; avatar_url: string | null }>(
      this.db,
      'SELECT nickname, avatar_url FROM sys_member WHERE id = ?',
      memberId,
    );

    if (!updated) throw new BizError(ErrorCode.NOT_FOUND, '成员不存在');
    return { nickname: updated.nickname, avatarUrl: updated.avatar_url };
  }
```

- [ ] **Step 2: Commit**

```bash
git add workers/api/src/modules/auth/AuthService.ts
git commit -m "feat(api): add AuthService.updateProfile()"
```

---

### Task 3: Add `PATCH /auth/me` route

**Files:**
- Modify: `workers/api/src/routes/auth.ts`

- [ ] **Step 1: Import `updateMemberSchema`**

Update the import from `@family-hub/shared` to include `updateMemberSchema`:

```ts
import { createFamilySchema, redeemInviteSchema, loginSchema, createInviteSchema, changePinSchema, updateMemberSchema } from '@family-hub/shared';
```

- [ ] **Step 2: Add PATCH handler**

After `GET /auth/me` (line 67), add:

```ts
// ── 更新个人资料 ────────────────────────────────────────────
authRoutes.patch('/me', async (c) => {
  const body = await c.req.json();
  const input = updateMemberSchema.parse(body);
  const { memberId } = c.var.auth;
  const svc = createAuthService(c.env.DB, c.env.KV);
  const result = await svc.updateProfile(memberId, input);
  return ok(c, result);
});
```

- [ ] **Step 3: Commit**

```bash
git add workers/api/src/routes/auth.ts
git commit -m "feat(api): add PATCH /auth/me endpoint"
```

---

### Task 4: Add `api.patch()` method

**Files:**
- Modify: `apps/web/src/core/api/client.ts`

- [ ] **Step 1: Add `patch` export**

After the `delete` line in the `api` object (line 74), add:

```ts
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/core/api/client.ts
git commit -m "feat(web): add api.patch() method"
```

---

### Task 5: Create `EditProfileModal` component

**Files:**
- Create: `apps/web/src/components/EditProfileModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useState, useRef } from 'react';
import { Modal, Input, Avatar, Button, Upload, message } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { Member } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';

interface Props {
  open: boolean;
  member: Member;
  onClose: () => void;
}

export function EditProfileModal({ open, member, onClose }: Props) {
  const [nickname, setNickname] = useState(member.nickname);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(member.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 200);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        setAvatarBase64(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      message.error('昵称不能为空');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (nickname !== member.nickname) body.nickname = nickname.trim();
      if (avatarBase64 !== member.avatarUrl) body.avatarBase64 = avatarBase64 ?? '';

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      await api.patch<{ nickname: string; avatarUrl: string | null }>('/auth/me', body);
      message.success('已保存');
      onClose();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="编辑资料"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Badge
          count={<CameraOutlined style={{ color: '#fff', fontSize: 14 }} />}
          offset={[-4, 80]}
        >
          <Avatar
            size={80}
            src={avatarBase64}
            icon={!avatarBase64 ? <UserOutlined /> : undefined}
            style={{ background: BRAND_COLOR, cursor: 'pointer' }}
            onClick={() => inputRef.current?.click()}
          />
        </Badge>
        <div style={{ marginTop: 8 }}>
          <Button type="link" size="small" onClick={() => inputRef.current?.click()}>
            更换头像
          </Button>
          {avatarBase64 && (
            <Button type="link" size="small" danger onClick={() => setAvatarBase64(null)}>
              清除头像
            </Button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span>昵称</span>
        <span style={{ float: 'right', color: '#999' }}>{nickname.length}/30</span>
      </div>
      <Input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={30}
        placeholder="输入昵称"
      />
    </Modal>
  );
}
```

Wait, `Badge` needs to be imported from antd. Let me fix — use a simple wrapper instead:

```tsx
import { useState, useRef } from 'react';
import { Modal, Input, Avatar, Button, message, Space } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { Member } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';

interface Props {
  open: boolean;
  member: Member;
  onClose: () => void;
}

export function EditProfileModal({ open, member, onClose }: Props) {
  const [nickname, setNickname] = useState(member.nickname);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(member.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 200);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        setAvatarBase64(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      message.error('昵称不能为空');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (nickname !== member.nickname) body.nickname = nickname.trim();
      if (avatarBase64 !== member.avatarUrl) {
        body.avatarBase64 = avatarBase64 ?? '';
      }

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      await api.patch<{ nickname: string; avatarUrl: string | null }>('/auth/me', body);
      message.success('已保存');
      await useAuthStore.getState().refreshProfile();
      onClose();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="编辑资料"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            size={80}
            src={avatarBase64}
            icon={!avatarBase64 ? <UserOutlined /> : undefined}
            style={{ background: BRAND_COLOR, cursor: 'pointer' }}
            onClick={() => inputRef.current?.click()}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: BRAND_COLOR,
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => inputRef.current?.click()}
          >
            <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={{ marginTop: 8 }}>
          <Button type="link" size="small" onClick={() => inputRef.current?.click()}>
            更换头像
          </Button>
          {avatarBase64 && (
            <Button type="link" size="small" danger onClick={() => { setAvatarBase64(null); }}>
              清除头像
            </Button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span>昵称</span>
        <span style={{ float: 'right', color: '#999' }}>{nickname.length}/30</span>
      </div>
      <Input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={30}
        placeholder="输入昵称"
      />
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/EditProfileModal.tsx
git commit -m "feat(web): add EditProfileModal component"
```

---

### Task 6: Update SettingsPage with edit button + modal

**Files:**
- Modify: `apps/web/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add import and state**

Add import:
```tsx
import { EditProfileModal } from '@/components/EditProfileModal';
```

Add state variable after line 24:
```tsx
const [profileEditOpen, setProfileEditOpen] = useState(false);
```

- [ ] **Step 2: Add "编辑资料" button and modal**

After the Avatar block (line 97, the closing `</Card>` on the member info card), add:

```tsx
      <Button
        type="default"
        block
        style={{ marginTop: -8, marginBottom: 16 }}
        onClick={() => setProfileEditOpen(true)}
      >
        编辑资料
      </Button>
```

At the bottom of the return (before the final closing `</div>`), add:

```tsx
      {member && (
        <EditProfileModal
          open={profileEditOpen}
          member={member}
          onClose={() => setProfileEditOpen(false)}
        />
      )}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/SettingsPage.tsx
git commit -m "feat(web): add edit profile button to SettingsPage"
```

---

### Task 7: Refresh auth store after profile update

**Files:**
- Modify: `apps/web/src/core/auth/store.ts`

- [ ] **Step 1: Add `refreshProfile` method**

After `logout` method (before closing `}))`), add:

```tsx
  refreshProfile: async () => {
    try {
      const info = await api.get<SessionInfo>('/auth/me');
      set({ member: info.member, family: info.family });
    } catch {
      // 忽略，下次打开页面会重新获取
    }
  },
```

Update the `AuthState` interface to include it:

```tsx
  /** 登出 */
  logout: () => Promise<void>;
  /** 刷新用户信息（编辑资料后调用） */
  refreshProfile: () => Promise<void>;
}
```

- [ ] **Step 2: Call `refreshProfile` in `EditProfileModal` after save**

Update the `handleSave` in `EditProfileModal.tsx`:

Replace `onClose()` line after `message.success` with:
```tsx
      message.success('已保存');
      await useAuthStore.getState().refreshProfile();
      onClose();
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/core/auth/store.ts apps/web/src/components/EditProfileModal.tsx
git commit -m "feat(web): refresh auth store after profile update"
```

---

### Verification

- [ ] **Build check:** `pnpm --filter @family-hub/web build`
- [ ] **Functions compile:** `cd apps/web && npx wrangler pages functions build --build-output-directory dist`
- [ ] **Deploy:** `cd apps/web && pnpm run deploy`
- [ ] **Smoke test:** `curl https://famhub-598.pages.dev/auth/me -X PATCH -H "Content-Type: application/json" -d '{"nickname":"test"}'` (expect 401 without cookie)
