/**
 * PC 端左侧导航
 * Phase 1:工作台 + 我的;Phase 2+:账单/待办/购物/日程
 */
import { Menu, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { BRAND_COLOR } from '@family-hub/shared';

// TODO: Phase 2 启用后把注释的菜单项加回来
const items = [
  { key: '/', icon: <AppstoreOutlined />, label: '工作台' },
  // { key: '/bill', icon: <AccountBookOutlined />, label: '账单' },
  // { key: '/todo', icon: <CheckSquareOutlined />, label: '待办' },
  // { key: '/shopping', icon: <ShoppingCartOutlined />, label: '购物清单' },
  // { key: '/calendar', icon: <CalendarOutlined />, label: '日程' },
  { key: '/me', icon: <UserOutlined />, label: '我的' },
];

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // 匹配当前路径到菜单 key
  const activeKey =
    location.pathname === '/'
      ? '/'
      : items.find((i) => i.key !== '/' && location.pathname.startsWith(i.key))?.key ?? '/';

  return (
    <aside
      style={{
        width: 200,
        borderRight: '1px solid #f0f0f0',
        background: 'var(--color-bg-container, #fff)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Typography.Title level={5} style={{ margin: 0, color: BRAND_COLOR }}>
          🏠 家庭管家
        </Typography.Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, borderRight: 'none' }}
      />
    </aside>
  );
}
