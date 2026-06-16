import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTodos } from './api';

const { Text, Title } = Typography;

export function WorkspaceCard() {
  const navigate = useNavigate();
  const { data: items = [] } = useTodos({ status: 'todo' });

  return (
    <Card hoverable onClick={() => navigate('/todo')} style={{ cursor: 'pointer' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>待办事项</Text>
      <Title level={3} style={{ margin: '4px 0' }}>
        {items.length}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>查看更多 →</Text>
    </Card>
  );
}
