import { Card, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { WorkspaceSummary } from '@family-hub/shared';
import { getWorkspaceModules } from '@/registry';

const { Title, Text } = Typography;

export function WorkspacePageDesktop() {
  const { member, family } = useAuthStore();
  const navigate = useNavigate();

  const { data: summary } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => api.get<WorkspaceSummary>('/api/workspace/summary'),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  const workspaceModules = getWorkspaceModules();

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        👋 {greeting}，{member?.nickname}
      </Title>
      <Text type="secondary">{family?.name}</Text>

      <div style={{ marginTop: 16 }}>
        {workspaceModules.map((m) => {
          const CardComponent = m.workspaceCard!;
          return <CardComponent key={m.key} />;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
        <Card hoverable onClick={() => navigate('/bill/new')} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>📒</div>
          <Text>记一笔</Text>
        </Card>
        <Card hoverable onClick={() => navigate('/bill')} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>📊</div>
          <Text>账单明细</Text>
        </Card>
      </div>

      {summary?.todayReminders && summary.todayReminders.length > 0 && (
        <Card title="今日提醒" size="small" style={{ marginTop: 16 }}>
          {summary.todayReminders.map((r, i) => (
            <div key={i} style={{ padding: '4px 0' }}>🔔 {r.title}</div>
          ))}
        </Card>
      )}
    </div>
  );
}
