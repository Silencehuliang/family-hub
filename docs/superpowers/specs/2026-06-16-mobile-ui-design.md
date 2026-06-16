# Mobile UI Adaptation — Design Spec

## 1. Design Direction

**「居家暖橙」** — Extend the existing brand color `#FF8C42` into a complete warm, approachable mobile experience for Chinese families.

**Key differentiation:**
- Orange is not just an accent — it's the UI skeleton (NavBars, FABs, progress fills)
- Large rounded corners (16px) on cards, warm off-white background `#FFF8F0`
- Bottom Sheet (Popup) for all create/edit flows — feels native
- Large touch targets (44px+) for multi-generational family users
- CJK-optimized spacing: line-height 1.8 for body text

**Design tokens:**

| Token | Mobile (<768px) | Desktop (>=768px) |
|-------|-----------------|-------------------|
| Page BG | `#FFF8F0` | `#FFF8F0` |
| Card BG | `#FFFFFF` | `#FFFFFF` |
| Card radius | `16px` | `8px` |
| Card shadow | `0 2px 12px rgba(0,0,0,0.06)` | none |
| Text primary | `#2D1B00` | `#2D1B00` |
| Text secondary | `#8B7355` | `#8B7355` |
| Brand | `#FF8C42` | `#FF8C42` |
| Font | system (CJK) | system |
| Content padding | `0 16px` | `0 24px` |
| Max content width | 100% | 800px centered |

## 2. Navigation & Shell

**AppShell layout (<768px):**

```
┌──────────────────────────┐
│  NavBar (orange bg)       │ 二级页面显示：← 标题  [操作]
├──────────────────────────┤
│                          │
│   Page content            │
│   (white bg, scroll)      │
│   padding: 0 16px         │
│                          │
├──────────────────────────┤
│  TabBar (5 tabs)          │ 一级页面显示
│  🏠 首页  💰 账单  ✅ 待办  │ antd-mobile TabBar
│  🛒 购物  📅 日程          │ paddingBottom: env(safe-area-inset-bottom)
└──────────────────────────┘
```

**Rules:**
- Top-level pages show TabBar, no NavBar (or minimal title)
- Detail/edit pages show NavBar (antd-mobile `NavBar`), hide TabBar
- Create/edit always uses bottom `Popup`, never a new page
- Page transitions via React Router stack (existing, no extra animations)

**Component mapping:**

| Scenario | Mobile (<768px) | Desktop (>=768px) |
|----------|-----------------|-------------------|
| Page container | `<Page>` white bg + pad 16 | maxWidth 800 + mx auto |
| Top bar | antd-mobile `NavBar` | antd `Typography.Title` |
| Bottom nav | antd-mobile `TabBar` | antd `Menu` (sidebar) |
| List items | antd-mobile `List.Item` | antd `List.Item` |
| Cards | antd-mobile `Card` | antd `Card` |
| Popups | antd-mobile `Popup` | antd `Modal` |
| Forms | antd-mobile `Input`/`Picker` | antd `Input`/`Select` |
| Buttons | antd-mobile `Button` (large) | antd `Button` |
| Toast | antd-mobile `Toast` | antd `message` |
| Empty state | antd-mobile `ErrorBlock` | antd `Empty` |
| Loading | antd-mobile `SpinLoading` | antd `Spin` |
| Pull refresh | antd-mobile `PullToRefresh` | n/a |

**Responsive pattern:**

```tsx
export function ShopListPage() {
  const isMobile = useMobile();
  if (isMobile) return <ShopListMobile />;
  return <ShopListDesktop />;
}
```

Or inline conditional for small differences:

```tsx
<Card style={{ borderRadius: isMobile ? 16 : 8 }}>
```

**Shared responsive components** (in `apps/web/src/components/responsive/`):

| Component | Mobile | Desktop |
|-----------|--------|---------|
| `Page` | `padding: 16`, white bg | `maxWidth: 800, margin: '0 auto'` |
| `PageHeader` | antd-mobile `NavBar` | antd `Typography.Title` |
| `PageCard` | antd-mobile `Card` | antd `Card` |
| `PageList` | antd-mobile `List` | antd `List` |
| `PageModal` | antd-mobile `Popup` | antd `Modal` |
| `PageButton` | antd-mobile `Button` (large) | antd `Button` |

## 3. Shopping Module (3 pages)

### ShopListPage

- Card list of shopping lists (antd-mobile `Card` + `List`)
- Each card shows: name, date, item count, first 3 items as preview
- FAB button (bottom-right) to create new list
- Empty state: antd-mobile `ErrorBlock`
- Pull to refresh

### ShopListDetailPage

- NavBar: list name + [edit] button
- Grouped by category (produce, meat, etc.)
- Each item: checkbox (antd-mobile `CheckList`), name, qty, price if bought
- Left swipe item = mark bought (antd-mobile `SwipeAction`)
- Right swipe item = delete with confirm Toast
- Bottom: [Add item] [Link to bill] buttons

### ShopEditPage (Create/Edit)

- Bottom `Popup`, not separate page
- Name input, optional category
- Create or save

## 4. Todo Module (4 pages)

### TodoListPage

- Filter tabs: "My tasks / All / Completed" using antd-mobile `Tabs`
- Each item: Checkbox (circle), title, priority color bar (left 4px), assignee, due date
- Priority colors: high `#FF4D4F`, mid `#FAAD14`, low `#52C41A`
- Completed items show subtask progress (e.g., "2/3")
- FAB to create new todo
- Pull to refresh

### TodoDetailPage

- Status toggle at top
- Full info: title, priority, due date, assignee, note, subtask list
- Each subtask left-swipeable to toggle done
- Bottom: [Edit] [Delete]
- Delete with confirmation Toast

### TodoEditPage

- Bottom `Popup`
- Title input, priority segment (antd-mobile `Segmented`), date picker, assignee picker, note input
- Subtasks: dynamic list with add/remove
- Save/Cancel

## 5. Calendar Module (4 pages)

### CalendarPage

- Three tabs via antd-mobile `Tabs`:
  - **📅 Monthly** — antd-mobile `Calendar` component, tap date shows events
  - **🎂 Anniversary** — filtered list of `birthday` + `anniversary` events, sorted by date, "upcoming" section at top
  - **📋 All** — flat list of all events in month, grouped by date
- FAB to create new event

### EventDetailPage

- Full info: title, type icon+color, date/time, location, repeat rule, participants, reminder
- Bottom: [Edit] [Delete]

### EventEditPage

- Bottom `Popup`
- Title, type picker (antd-mobile `Picker`), date/time picker, all-day toggle
- Location, repeat rule, multi-select participants, reminder offset
- Note input

### Color/Icon mapping for event types:

| Type | Icon | Color |
|------|------|-------|
| birthday | 🎂 | `#FF6B8A` |
| anniversary | 💕 | `#FF8C42` |
| medical | 🏥 | `#FF4D4F` |
| bill | 📄 | `#52C41A` |
| travel | 🌍 | `#1890FF` |
| id_expiring | 🪪 | `#FAAD14` |
| other | 📌 | `#8C8C8C` |

## 6. Bill Module (6 pages)

### BillListPage

- Month summary: total expense (large orange text), budget, remaining percentage
- Budget progress bar
- Horizontal scroll category filter tabs (antd-mobile `Tabs`)
- List grouped by date (Today / Yesterday / This Week...)
- Each item: category icon, name, -amount (red), payer
- FAB for quick entry

### BillEditPage

- Bottom `Popup`
- Amount input with decimal keyboard (`inputMode="decimal"`)
- Category picker (two-level: L1 → L2) using cascading `Picker`
- Payer picker, date picker
- Optional note, tags

### BillStatsPage

- Month selector (antd-mobile `Segmented`)
- Summary: current month total, previous month total, MoM change
- Category pie chart (canvas/ECharts, tappable to drill down)
- Category ranking list
- Desktop: wider layout with more charts

### BillDetailPage

- Full info: category icon+name, amount, payer, date, note, tags
- Bottom: [Edit] [Delete] [Copy] buttons

### BillImportPage

- File upload area (antd-mobile `Upload`)
- Preview table (simplified, mobile-friendly)
- Import options toggle (skip failed)
- [Cancel] [Confirm import]

## 7. Settings Page

- Already has responsive layout, convert to antd-mobile `List` for mobile
- Member card → antd-mobile `List.Item` with right arrow → opens EditProfileModal
- Invite section → antd-mobile `List.Item`
- Device list → antd-mobile `List.Item` with swipe actions
- Logout → red danger button at bottom
- EditProfileModal already uses antd Modal → also works on mobile (or use antd-mobile `Popup`)

## 8. Public / Onboarding Pages

### WelcomePage
- Full-screen mobile layout: centered logo, tagline, two buttons (primary + outline)
- Bottom link: "Already have an account? Log in →"

### LoginPage
- PIN input with numeric keyboard (`inputMode="numeric"`)
- Large digit input fields (antd-mobile `Input` with password type)
- "Forgot PIN" link at bottom
- Loading spinner on submit

### CreateFamilyPage / RedeemInvitePage
- Single-column form, one field per row
- antd-mobile `Form` + `Input` + `Button`
- Submit button sticky at bottom
- Walkthrough-style progress indicator

### NotFoundPage
- Keep existing, just add responsive padding

## 9. Implementation Order

Module-by-module, start with simplest to establish patterns:

| Order | Module | Pages | Complexity |
|-------|--------|-------|------------|
| 1 | Shared responsive components | responsive/ directory | Medium |
| 2 | Shopping | 3 pages | Low |
| 3 | Todo | 4 pages | Low-Medium |
| 4 | Calendar | 4 pages | Medium |
| 5 | Bill | 6 pages | High |
| 6 | Settings | 1 page | Low |
| 7 | Public pages | 6 pages | Low |

Each module implementation includes:
- Create `<Module>Mobile.tsx` (mobile version)
- Keep `<Module>Desktop.tsx` or refactor existing page (if current is already desktop-OK)
- `ModulePage.tsx` wrapper that detects `isMobile` and dispatches
- Update routing if needed

## 10. Error & Loading States

| State | Mobile | Desktop |
|-------|--------|---------|
| Loading | antd-mobile `SpinLoading` centered | antd `Spin` |
| Empty | antd-mobile `ErrorBlock` with image + text | antd `Empty` |
| Error | antd-mobile `Toast` + retry button | antd `message` + retry |
| Network off-line | PWA service worker fallback | same |
