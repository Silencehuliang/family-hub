/**
 * 移动端底部 Tab 导航
 * Phase 1:工作台 + 我的;Phase 2+:账单/待办/购物/日程
 */
import { TabBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';

// TODO: Phase 2 启用后把注释的 Tab 加回来
const tabs = [
  { key: '/', title: '工作台', icon: <AppstoreOutlined /> },
  // { key: '/bill', title: '账单', icon: <AccountBookOutlined /> },
  // { key: '/todo', title: '待办', icon: <CheckSquareOutlined /> },
  // { key: '/shopping', title: '购物', icon: <ShoppingCartOutlined /> },
  // { key: '/calendar', title: '日程', icon: <CalendarOutlined /> },
  { key: '/me', title: '我的', icon: <UserOutlined /> },
];

export function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        borderTop: '1px solid #f0f0f0',
        background: 'var(--color-bg-container, #fff)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <TabBar
        activeKey={location.pathname === '/' ? '/' : tabs.find((t) => t.key !== '/' && location.pathname.startsWith(t.key))?.key ?? '/'}
        onChange={(key) => navigate(key)}
      >
        {tabs.map((t) => (
          <TabBar.Item key={t.key} icon={t.icon} title={t.title} />
        ))}
      </TabBar>
    </div>
  );
}
