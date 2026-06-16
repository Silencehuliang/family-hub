import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Tag, Button, Card, Toast, SpinLoading, Dialog } from 'antd-mobile';
import dayjs from 'dayjs';
import { useEvent, useDeleteEvent } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

const EVENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  birthday: { label: '生日', color: '#FF6B6B' }, anniversary: { label: '纪念日', color: '#FF8C42' },
  medical: { label: '就医', color: '#4ECDC4' }, bill: { label: '账单', color: '#45B7D1' },
  travel: { label: '旅行', color: '#96CEB4' }, id_expiring: { label: '证件到期', color: '#F4D03F' },
  other: { label: '其他', color: '#DDA0DD' },
};

export function EventDetailPageMobile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const deleteEvent = useDeleteEvent();

  const handleDelete = () => {
    Dialog.confirm({
      content: '确定删除此日程？',
      onConfirm: async () => {
        try {
          await deleteEvent.mutateAsync(id!);
          Toast.show('已删除');
          navigate('/calendar');
        } catch (err: unknown) {
          Toast.show(err instanceof Error ? err.message : '删除失败');
        }
      },
    });
  };

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;
  if (!event) return <div style={{ padding: 24, textAlign: 'center' }}>日程不存在</div>;

  const typeInfo = EVENT_TYPE_MAP[event.type] ?? { label: event.type, color: '#DDA0DD' };
  const startStr = event.allDay ? dayjs.unix(event.startAt).format('YYYY年M月D日') : dayjs.unix(event.startAt).format('YYYY年M月D日 HH:mm');
  const endStr = event.endAt ? (event.allDay ? dayjs.unix(event.endAt).format('YYYY年M月D日') : dayjs.unix(event.endAt).format('YYYY年M月D日 HH:mm')) : null;

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        onBack={() => navigate(-1)}
        right={<span style={{ color: '#fff' }} onClick={handleDelete}>删除</span>}
      >日程详情</NavBar>

      <div style={{ padding: 16 }}>
        <Card style={{ borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Tag color={typeInfo.color} style={{ borderRadius: 4 }}>{typeInfo.label}</Tag>
            {event.allDay && <Tag style={{ borderRadius: 4 }}>全天</Tag>}
            {event.repeatRule === 'yearly' && <Tag color="purple" style={{ borderRadius: 4 }}>每年重复</Tag>}
          </div>

          <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>{event.title}</h3>

          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
            <div><span style={{ color: '#999' }}>开始 </span>{startStr}</div>
            {endStr && <div><span style={{ color: '#999' }}>结束 </span>{endStr}</div>}
            {event.location && <div><span style={{ color: '#999' }}>地点 </span>{event.location}</div>}
            {event.note && <div><span style={{ color: '#999' }}>备注 </span>{event.note}</div>}
            {event.participants && event.participants.length > 0 && (
              <div><span style={{ color: '#999' }}>参与 </span>{event.participants.map(p => p.nickname).join(', ')}</div>
            )}
          </div>
        </Card>

        <Button block color="primary" fill="outline" style={{ marginTop: 16 }} onClick={() => navigate(`/calendar/${event.id}/edit`)}>
          编辑
        </Button>
      </div>
    </div>
  );
}
