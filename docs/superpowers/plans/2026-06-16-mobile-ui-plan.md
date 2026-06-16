# Mobile UI Adaptation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Convert all 22 pages from desktop-only antd to responsive (antd-mobile <768px / antd >=768px)

**Architecture:** Each page dispatches to Mobile or Desktop variant via `useMobile()` hook. Desktop variant keeps existing antd code. Mobile variant uses antd-mobile components (Card, List, NavBar, TabBar, Popup, etc.)

**Tech Stack:** antd-mobile v5, antd v5, React, inline styles (no CSS files)

**File structure pattern:**
```
modules/<module>/
├── XxxPage.tsx          ← dispatcher (useMobile)
├── XxxPageMobile.tsx    ← antd-mobile components (NEW)
└── XxxPageDesktop.tsx   ← antd components (EXISTING + refactor)
```

---

### Task 1: Create `useMobile` hook

**Files:**
- Create: `apps/web/src/hooks/useMobile.ts`

```ts
import { useMediaQuery } from 'react-responsive';

export function useMobile(): boolean {
  return useMediaQuery({ maxWidth: 767 });
}
```

Note: Check if `react-responsive` is already in `package.json`. If not, install it:
```bash
pnpm --filter @family-hub/web add react-responsive
```

- [ ] **Step 1: Install react-responsive**

Run: `pnpm --filter @family-hub/web add react-responsive`

- [ ] **Step 2: Create useMobile.ts**

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useMobile.ts apps/web/package.json
git commit -m "feat(web): add useMobile hook"
```

---

### Task 2: Create responsive wrapper components

**Files:**
- Create: `apps/web/src/components/responsive/Page.tsx`
- Create: `apps/web/src/components/responsive/PageHeader.tsx`

**Page.tsx:**
```tsx
import type { ReactNode } from 'react';
import { useMobile } from '@/hooks/useMobile';

interface Props { children: ReactNode; style?: React.CSSProperties }

export function Page({ children, style }: Props) {
  const isMobile = useMobile();
  return (
    <div
      style={{
        padding: isMobile ? '0 16px 24px' : '0 24px',
        maxWidth: isMobile ? '100%' : 800,
        margin: '0 auto',
        minHeight: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

**PageHeader.tsx:**
```tsx
import type { ReactNode } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { NavBar } from 'antd-mobile';
import { Typography } from 'antd';

const { Title } = Typography;

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function PageHeader({ title, onBack, right }: Props) {
  const isMobile = useMobile();
  if (isMobile) {
    return (
      <NavBar
        style={{ '--border-bottom': 'none', background: '#FF8C42', color: '#fff' }}
        onBack={onBack}
        right={right}
      >
        {title}
      </NavBar>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
      {right}
    </div>
  );
}
```

- [ ] **Step 1: Create components/responsive/ directory** with both files

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/responsive/
git commit -m "feat(web): add responsive wrapper components"
```

---

### Task 3: Refactor ShopListPage to responsive

**Files:**
- Create: `apps/web/src/modules/shop/ShopListPageMobile.tsx`
- Modify: `apps/web/src/modules/shop/ShopListPage.tsx` → dispatcher

**Dispatcher (`apps/web/src/modules/shop/ShopListPage.tsx`):**

Replace entire content with:

```tsx
import { useMobile } from '@/hooks/useMobile';
import { ShopListPageMobile } from './ShopListPageMobile';
import { ShopListPageDesktop } from './ShopListPageDesktop';

export function ShopListPage() {
  const isMobile = useMobile();
  if (isMobile) return <ShopListPageMobile />;
  return <ShopListPageDesktop />;
}
```

**Mobile variant (`ShopListPageMobile.tsx`):**

```tsx
import { Card, List, Button, Empty, SpinLoading, PullToRefresh, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useShopLists, useDeleteShopList } from './api';

export function ShopListPageMobile() {
  const navigate = useNavigate();
  const { data: lists, isLoading } = useShopLists();
  const deleteList = useDeleteShopList();

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;

  const handleDelete = async (id: string) => {
    try {
      await deleteList.mutateAsync(id);
      Toast.show('已删除');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <PullToRefresh onRefresh={async () => {}}>
      <div style={{ padding: 16, minHeight: '100vh', background: '#FFF8F0' }}>
        {(!lists || lists.length === 0) ? (
          <Empty>
            <Button color="primary" onClick={() => navigate('/shop/new')}>新建清单</Button>
          </Empty>
        ) : (
          lists.map((list) => {
            const percent = list.itemCount > 0 ? Math.round((list.boughtCount / list.itemCount) * 100) : 0;
            return (
              <Card
                key={list.id}
                onClick={() => navigate(`/shop/${list.id}`)}
                style={{ marginBottom: 12, borderRadius: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{list.name}</span>
                    <br />
                    <span style={{ fontSize: 12, color: percent === 100 ? '#52C41A' : '#999' }}>
                      {percent === 100 ? '已完成' : '采购中'} · {list.boughtCount}/{list.itemCount}
                    </span>
                  </div>
                  <Button color="danger" fill="none" size="small" onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}>
                    删除
                  </Button>
                </div>
                <div style={{ marginTop: 8, height: 4, background: '#F0F0F0', borderRadius: 2 }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#52C41A' : '#FF8C42', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </Card>
            );
          })
        )}

        <Button
          color="primary"
          style={{ position: 'fixed', right: 16, bottom: 80, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)' }}
          onClick={() => navigate('/shop/new')}
        >
          <AddOutline style={{ fontSize: 24 }} />
        </Button>
      </div>
    </PullToRefresh>
  );
}
```

**Desktop variant (`ShopListPageDesktop.tsx`):**

Move existing `ShopListPage.tsx` content here verbatim. Rename the export function to `ShopListPageDesktop`.

- [ ] **Step 1: Create `ShopListPageDesktop.tsx`** — copy existing content, rename export

- [ ] **Step 2: Create `ShopListPageMobile.tsx`** — as shown above

- [ ] **Step 3: Update `ShopListPage.tsx`** — dispatcher

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/shop/ShopListPage.tsx apps/web/src/modules/shop/ShopListPageMobile.tsx apps/web/src/modules/shop/ShopListPageDesktop.tsx
git commit -m "feat(web): responsive ShopListPage"
```

---

### Task 4: Refactor ShopListDetailPage to responsive

**Files:**
- Create: `apps/web/src/modules/shop/ShopListDetailPageMobile.tsx`
- Create: `apps/web/src/modules/shop/ShopListDetailPageDesktop.tsx` (move existing code)
- Modify: `apps/web/src/modules/shop/ShopListDetailPage.tsx` → dispatcher

**Mobile pattern:**

```tsx
import { NavBar, Card, CheckList, SwipeAction, Button, Popup, Toast } from 'antd-mobile';
import { useNavigate, useParams } from 'react-router-dom';
import { useShopList, useToggleShopItem, useDeleteShopItem } from './api';
import { useState } from 'react';

export function ShopListDetailPageMobile() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { data: list } = useShopList(listId!);
  const toggleItem = useToggleShopItem();
  const deleteItem = useDeleteShopItem();

  if (!list) return null;

  const handleToggle = async (itemId: string, checked: boolean) => {
    await toggleItem.mutateAsync({ listId: listId!, itemId, bought: checked });
  };

  return (
    <div>
      <NavBar style={{ '--border-bottom': 'none', background: '#FF8C42', color: '#fff' }} onBack={() => navigate(-1)}>
        {list.name}
      </NavBar>

      <div style={{ padding: 16, background: '#FFF8F0', minHeight: 'calc(100vh - 46px)' }}>
        <Card style={{ borderRadius: 16 }}>
          {list.items?.map((item) => (
            <SwipeAction
              key={item.id}
              rightActions={[
                { key: 'delete', text: '删除', color: 'danger', onClick: () => deleteItem.mutate({ listId: listId!, itemId: item.id }) },
              ]}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  opacity: item.bought ? 0.5 : 1,
                }}
                onClick={() => handleToggle(item.id, !item.bought)}
              >
                <div
                  style={{
                    width: 22, height: 22, borderRadius: '50%', border: '2px solid #FF8C42', marginRight: 12,
                    background: item.bought ? '#FF8C42' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {item.bought && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.estPrice && <span style={{ color: '#999' }}>¥{item.estPrice}</span>}
              </div>
            </SwipeAction>
          ))}
        </Card>

        <Button block color="primary" fill="outline" style={{ marginTop: 16 }} onClick={() => {}}>
          + 添加商品
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create desktop variant, mobile variant, update dispatcher**

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/modules/shop/ShopListDetailPage*
git commit -m "feat(web): responsive ShopListDetailPage"
```

---

### Task 5: Refactor ShopEditPage to responsive

**Files:**
- Create: `apps/web/src/modules/shop/ShopEditPageMobile.tsx`
- Modify: `apps/web/src/modules/shop/ShopEditPage.tsx` → dispatcher

**Mobile uses Popup** (not a separate page):

```tsx
import { Popup, Form, Input, Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useCreateShopList } from './api';

export function ShopEditPageMobile() {
  const navigate = useNavigate();
  const create = useCreateShopList();

  const handleSubmit = async (values: { name: string }) => {
    try {
      await create.mutateAsync(values);
      Toast.show('已创建');
      navigate(-1);
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <div style={{ padding: 16, background: '#FFF8F0', minHeight: '100vh' }}>
      <Form
        onFinish={handleSubmit}
        footer={
          <Button block color="primary" type="submit">
            创建
          </Button>
        }
      >
        <Form.Item name="name" label="清单名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="例如：超市采购" />
        </Form.Item>
      </Form>
    </div>
  );
}
```

Actually, ShopEditPage should NOT be a separate page on mobile — it should be a Popup triggered from ShopListPage. But for simplicity in the first pass, keep it as a route that renders a full-page form with NavBar instead of a modal.

- [ ] **Step 1: Create mobile variant, update dispatcher**

- [ ] **Step 2: Commit**

---

### Task 6: Check antd-mobile-icons availability

**Files:**
- Modify: `apps/web/package.json` (if needed)

antd-mobile v5 requires `antd-mobile-icons`. Check if it's installed:

```bash
pnpm --filter @family-hub/web add antd-mobile-icons
```

Add this to the package (skip if already present).

---

### Task 7–18: Remaining modules (same pattern)

For each remaining page, follow the identical pattern:
1. Rename existing file to `XxxPageDesktop.tsx`, rename export to `XxxPageDesktop`
2. Create `XxxPageMobile.tsx` with antd-mobile equivalents
3. Create/update dispatcher `XxxPage.tsx`

| Task | Module | Page | Desktop File | Mobile Key Components |
|------|--------|------|-------------|----------------------|
| 7 | Shop | ShopEditPage | existing→ Desktop | antd-mobile `Form` + `Input` |
| 8 | Todo | TodoListPage | existing→ Desktop | `Tabs`, `CheckList`, `PullToRefresh` |
| 9 | Todo | TodoDetailPage | existing→ Desktop | `NavBar`, `List`, popup edit |
| 10 | Todo | TodoEditPage | existing→ Desktop | `Popup`, `Form`, `Picker`, `DatePicker` |
| 11 | Calendar | CalendarPage | existing→ Desktop | `Calendar`, `Tabs` (月历/纪念日/全部) |
| 12 | Calendar | EventDetailPage | existing→ Desktop | `NavBar`, `Card`, icon per type |
| 13 | Calendar | EventEditPage | existing→ Desktop | `Popup`, `Form`, `Picker` |
| 14 | Bill | BillListPage | existing→ Desktop | `Tabs`, `List`, FAB |
| 15 | Bill | BillEditPage | existing→ Desktop | `Popup`, `Form`, `Picker` |
| 16 | Bill | BillDetailPage | existing→ Desktop | `NavBar`, `Card` |
| 17 | Bill | BillStatsPage | existing→ Desktop | ECharts (keep), `Segmented` |
| 18 | Bill | BillImportPage | existing→ Desktop | `Upload`, preview list |

**TodoListPageMobile.tsx pattern** (representative example):

```tsx
import { Tabs, CheckList, Button, Empty, SpinLoading, PullToRefresh, Toast, Tag } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useTodos, useSetTodoStatus } from './api';
import { useState } from 'react';

export function TodoListPageMobile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('todo');
  const { data: items = [], isLoading } = useTodos({});
  const setStatus = useSetTodoStatus();

  const filtered = items.filter((i) => tab === 'all' || i.status === tab);

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;

  return (
    <PullToRefresh onRefresh={async () => {}}>
      <div style={{ padding: 16, background: '#FFF8F0', minHeight: '100vh' }}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k)}>
          <Tabs.Tab title="待完成" key="todo" />
          <Tabs.Tab title="已完成" key="done" />
          <Tabs.Tab title="全部" key="all" />
        </Tabs>

        {filtered.length === 0 ? (
          <Empty />
        ) : (
          <CheckList
            multiple
            value={filtered.filter((i) => i.status === 'done').map((i) => i.id)}
            onChange={(vals) => {
              const prevDone = new Set(filtered.filter((i) => i.status === 'done').map((i) => i.id));
              for (const item of filtered) {
                const nowDone = vals.includes(item.id);
                if (prevDone.has(item.id) !== nowDone) {
                  setStatus.mutate({ id: item.id, status: nowDone ? 'done' : 'todo' });
                }
              }
            }}
          >
            {filtered.map((item) => (
              <CheckList.Item key={item.id} value={item.id} onClick={() => navigate(`/todo/${item.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={item.priority === 'high' ? 'red' : item.priority === 'mid' ? 'orange' : 'default'}>
                    {item.priority === 'high' ? '高' : item.priority === 'mid' ? '中' : '低'}
                  </Tag>
                  <span>{item.title}</span>
                </div>
              </CheckList.Item>
            ))}
          </CheckList>
        )}

        <Button
          color="primary"
          style={{ position: 'fixed', right: 16, bottom: 80, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)' }}
          onClick={() => navigate('/todo/new')}
        >
          <AddOutline style={{ fontSize: 24 }} />
        </Button>
      </div>
    </PullToRefresh>
  );
}
```

---

### Task 19: Refactor SettingsPage

**Files:**
- Modify: `apps/web/src/pages/SettingsPage.tsx` → add mobile variant

Since SettingsPage already has the edit modal (antd Modal), on mobile use antd-mobile `List` for the section items and replace the member info card.

---

### Task 20: Refactor Public Pages (Welcome, Login, CreateFamily, RedeemInvite)

**Files:**
- `apps/web/src/pages/Welcome.tsx`
- `apps/web/src/pages/Login.tsx`
- `apps/web/src/pages/CreateFamily.tsx`
- `apps/web/src/pages/RedeemInvite.tsx`

Each → add `useMobile()` detection, render full-screen mobile layout or existing centered card layout.

---

### Verification

- [ ] **Build & typecheck:** `pnpm --filter @family-hub/web build`
- [ ] **Functions compile:** `cd apps/web && npx wrangler pages functions build --build-output-directory dist`
- [ ] **Deploy:** `cd apps/web && pnpm run deploy`
- [ ] **Smoke test:** Open on phone and desktop, verify responsive switching at 768px
