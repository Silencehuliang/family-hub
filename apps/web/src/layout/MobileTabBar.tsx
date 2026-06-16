import { TabBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppstoreOutlined, UserOutlined, ShoppingCartOutlined,
  CheckSquareOutlined, AccountBookOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { getNavItems } from '@/registry';

const iconMap: Record<string, React.ReactNode> = {
  '🛒': <ShoppingCartOutlined />,
  '✅': <CheckSquareOutlined />,
  '📒': <AccountBookOutlined />,
  '📅': <CalendarOutlined />,
};

const fixedTabs = [
  { key: '/', title: '工作台', icon: <AppstoreOutlined /> },
];

export function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const moduleNavs = getNavItems().filter((n) => n.to !== '/').map((n) => ({
    key: n.to,
    title: n.label,
    icon: iconMap[n.icon] ?? <AppstoreOutlined />,
  }));

  const tabs = [
    ...fixedTabs,
    ...moduleNavs,
    { key: '/me', title: '我的', icon: <UserOutlined /> },
  ];

  // 匹配当前路径
  const activeKey = tabs.find((t) => t.key !== '/' && location.pathname.startsWith(t.key))?.key
    ?? (location.pathname === '/' ? '/' : '/me');

  return (
    <div
      style={{
        borderTop: '1px solid #f0f0f0',
        background: 'var(--color-bg-container, #fff)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <TabBar activeKey={activeKey} onChange={(key) => navigate(key)}>
        {tabs.map((t) => (
          <TabBar.Item key={t.key} icon={t.icon} title={t.title} />
        ))}
      </TabBar>
    </div>
  );
}
