import { Card, Typography, Button, Tag, Spin, Empty, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTodos, useSetTodoStatus } from './api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const PRIORITY_COLORS: Record<string, string> = { high: 'red', mid: 'orange', low: 'default' };
const COLUMNS = [
  { key: 'todo', label: '待办' },
  { key: 'doing', label: '进行中' },
  { key: 'done', label: '已完成' },
];

export function TodoListPageDesktop() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useTodos({});
  const setStatus = useSetTodoStatus();

  const grouped: Record<string, typeof items> = { todo: [], doing: [], done: [] };
  for (const item of items) {
    if (!grouped[item.status]) grouped[item.status] = [];
    grouped[item.status].push(item);
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await setStatus.mutateAsync({ id, status });
      message.success('状态已更新');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>✅ 待办</Title>
        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => navigate('/todo/new')}>新建</Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {COLUMNS.map((col) => {
            const colItems = grouped[col.key] ?? [];
            return (
              <Card
                key={col.key}
                title={<Text strong>{col.label} ({colItems.length})</Text>}
                size="small"
                style={{ minHeight: 200 }}
              >
                {colItems.length === 0 ? (
                  <Empty description="暂无" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  colItems.map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      style={{ marginBottom: 8, cursor: 'pointer' }}
                      onClick={() => navigate(`/todo/${item.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <Tag color={PRIORITY_COLORS[item.priority] ?? 'default'} style={{ fontSize: 10 }}>
                            {item.priority === 'high' ? '高' : item.priority === 'mid' ? '中' : '低'}
                          </Tag>
                          <Text style={{ marginLeft: 4 }}>{item.title}</Text>
                        </div>
                      </div>
                      {item.dueAt && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          截止: {dayjs.unix(item.dueAt).format('MM-DD HH:mm')}
                        </Text>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Space size={4}>
                          {['todo', 'doing', 'done'].filter((s) => s !== item.status).map((s) => (
                            <Button
                              key={s}
                              type="link"
                              size="small"
                              style={{ fontSize: 11, padding: 0 }}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, s); }}
                            >
                              {s === 'todo' ? '待办' : s === 'doing' ? '进行中' : '已完成'}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    </Card>
                  ))
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
