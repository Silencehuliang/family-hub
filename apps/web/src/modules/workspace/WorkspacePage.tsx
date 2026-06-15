/**
 * 工作台首页
 * Phase 1:欢迎语 + 占位卡片;Phase 2+:聚合各模块摘要
 */
import { Card, Typography } from 'antd';
import { useAuthStore } from '@/core/auth/store';

const { Title, Text } = Typography;

export function WorkspacePage() {
  const { member, family } = useAuthStore();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      {/* 问候 */}
      <Title level={4} style={{ marginBottom: 4 }}>
        👋 {greeting}，{member?.nickname}
      </Title>
      <Text type="secondary">{family?.name}</Text>

      {/* 本月支出占位 */}
      <Card style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>本月支出</Text>
        <Title level={2} style={{ margin: '4px 0' }}>¥ 0.00</Title>
        <Text type="secondary">预算暂未设置</Text>
      </Card>

      {/* 快捷入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
        {[
          { icon: '📒', label: '账单' },
          { icon: '✅', label: '待办' },
          { icon: '🛒', label: '购物清单' },
          { icon: '📅', label: '日程' },
        ].map((item) => (
          <Card key={item.label} hoverable style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{item.icon}</div>
            <Text style={{ marginTop: 4 }}>{item.label}</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Phase 2 启用</Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
