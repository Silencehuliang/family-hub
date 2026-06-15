/**
 * 工作台卡片:本月支出 + 预算进度
 */
import { Card, Typography, Progress } from 'antd';
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

  const spending = data?.monthSpending ?? 0;
  const budget = data?.monthBudget;
  const percent = budget ? Math.min(Math.round((spending / budget) * 100), 100) : 0;
  const overspent = budget ? spending > budget : false;

  return (
    <Card hoverable onClick={() => navigate('/bill')} style={{ cursor: 'pointer' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>本月支出</Text>
      <Title level={3} style={{ margin: '4px 0', color: overspent ? '#FF4D4F' : undefined }}>
        ¥ {spending.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
      </Title>
      {budget && (
        <div style={{ marginTop: 8 }}>
          <Progress
            percent={percent}
            strokeColor={overspent ? '#FF4D4F' : '#FF8C42'}
            format={() => `预算 ¥${budget.toLocaleString()}`}
          />
        </div>
      )}
      {!budget && <Text type="secondary" style={{ fontSize: 12 }}>暂未设置预算</Text>}
    </Card>
  );
}
