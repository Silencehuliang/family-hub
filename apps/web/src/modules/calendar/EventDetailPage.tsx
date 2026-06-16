import { Button, Typography, message, Spin, Tag, Popconfirm, Space, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useEvent, useDeleteEvent } from './api';

const { Title, Text } = Typography;

const EVENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  birthday: { label: '生日', color: '#FF6B6B' },
  anniversary: { label: '纪念日', color: '#FF8C42' },
  medical: { label: '就医', color: '#4ECDC4' },
  bill: { label: '账单', color: '#45B7D1' },
  travel: { label: '旅行', color: '#96CEB4' },
  id_expiring: { label: '证件到期', color: '#F4D03F' },
  other: { label: '其他', color: '#DDA0DD' },
};

export function EventDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const deleteEvent = useDeleteEvent();

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(id!);
      message.success('已删除');
      navigate('/calendar');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  }

  if (!event) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text type="secondary">日程不存在</Text>
        <div style={{ marginTop: 16 }}><Button onClick={() => navigate('/calendar')}>返回日历</Button></div>
      </div>
    );
  }

  const typeInfo = EVENT_TYPE_MAP[event.type] ?? { label: event.type, color: '#DDA0DD' };
  const startStr = event.allDay
    ? dayjs.unix(event.startAt).format('YYYY年M月D日')
    : dayjs.unix(event.startAt).format('YYYY年M月D日 HH:mm');
  const endStr = event.endAt
    ? (event.allDay ? dayjs.unix(event.endAt).format('YYYY年M月D日') : dayjs.unix(event.endAt).format('YYYY年M月D日 HH:mm'))
    : null;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/calendar')} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
        {event.allDay && <Tag>全天</Tag>}
        {event.repeatRule === 'yearly' && <Tag color="purple">每年重复</Tag>}
      </div>

      <Title level={3} style={{ margin: '0 0 16px 0' }}>{event.title}</Title>

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>开始时间</Text>
          <div><Text>{startStr}</Text></div>
        </div>

        {endStr && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>结束时间</Text>
            <div><Text>{endStr}</Text></div>
          </div>
        )}

        {event.location && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>地点</Text>
            <div><Text>{event.location}</Text></div>
          </div>
        )}

        {event.note && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>备注</Text>
            <div><Text>{event.note}</Text></div>
          </div>
        )}

        {event.participants && event.participants.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>参与成员</Text>
            <div><Text>{event.participants.map(p => p.memberId).join(', ')}</Text></div>
          </div>
        )}
      </Space>

      <Divider />

      <Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/calendar/${event.id}/edit`)}>
          编辑
        </Button>
        <Popconfirm title="确定删除此日程？" onConfirm={handleDelete} okText="删除" cancelText="取消">
          <Button danger icon={<DeleteOutlined />} loading={deleteEvent.isPending}>
            删除
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
