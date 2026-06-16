import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import type { WorkspaceSummary } from '@family-hub/shared';

const { Text, Title } = Typography;

export function WorkspaceCard() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => api.get<WorkspaceSummary>('/api/workspace/summary'),
  });

  const count = data?.upcomingEvents?.length ?? 0;

  return (
    <Card hoverable onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>近期日程</Text>
      <Title level={3} style={{ margin: '4px 0', color: count > 0 ? '#1677ff' : '#52C41A' }}>
        {count}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>{count > 0 ? '个日程待关注' : '暂无日程'}</Text>
    </Card>
  );
}
