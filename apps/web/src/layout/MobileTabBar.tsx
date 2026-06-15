/**
 * 移动端底部 Tab 导航(动态从 registry 读取)
 */
import { TabBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppstoreOutlined, AccountBookOutlined, UserOutlined } from '@ant-design/icons';
import { getNavItems } from '@/registry';

// 首页 + 模块导航 + 我的
const fixedTabs = [
  { key: '/', title: '工作台', icon: <AppstoreOutlined /> },
];

export function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 registry 读取模块导航项
  const moduleNavs = getNavItems().filter((n) => n.to !== '/').map((n) => ({
    key: n.to,
    title: n.label,
    icon: n.icon === '📒' ? <AccountBookOutlined /> : <AppstoreOutlined />,
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
