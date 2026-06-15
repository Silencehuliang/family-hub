/**
 * PC 端左侧导航(动态从 registry 读取)
 */
import { Menu, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppstoreOutlined, AccountBookOutlined, UserOutlined } from '@ant-design/icons';
import { BRAND_COLOR } from '@family-hub/shared';
import { getNavItems } from '@/registry';

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // 首页 + 模块导航 + 我的
  const moduleNavs = getNavItems().filter((n) => n.to !== '/').map((n) => ({
    key: n.to,
    icon: n.icon === '📒' ? <AccountBookOutlined /> : <AppstoreOutlined />,
    label: n.label,
  }));

  const items = [
    { key: '/', icon: <AppstoreOutlined />, label: '工作台' },
    ...moduleNavs,
    { key: '/me', icon: <UserOutlined />, label: '我的' },
  ];

  const activeKey =
    location.pathname === '/'
      ? '/'
      : items.find((i) => i.key !== '/' && location.pathname.startsWith(i.key))?.key ?? '/me';

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
