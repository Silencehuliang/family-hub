import { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, Switch, Typography, message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCreateEvent, useUpdateEvent, useEvent } from './api';
import type { EventType } from '@family-hub/shared';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'birthday', label: '生日' }, { value: 'anniversary', label: '纪念日' },
  { value: 'medical', label: '就医' }, { value: 'bill', label: '账单' },
  { value: 'travel', label: '旅行' }, { value: 'id_expiring', label: '证件到期' },
  { value: 'other', label: '其他' },
];

export function EventEditPageDesktop() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existing } = useEvent(isEdit ? id : undefined);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('other');
  const [startAt, setStartAt] = useState<dayjs.Dayjs | null>(dayjs());
  const [allDay, setAllDay] = useState(false);
  const [endAt, setEndAt] = useState<dayjs.Dayjs | null>(null);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [repeatRule, setRepeatRule] = useState<string>('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title); setType(existing.type as EventType);
      setStartAt(dayjs.unix(existing.startAt)); setAllDay(existing.allDay);
      setEndAt(existing.endAt ? dayjs.unix(existing.endAt) : null);
      setLocation(existing.location ?? ''); setNote(existing.note ?? '');
      setRepeatRule(existing.repeatRule ?? '');
    }
  }, [existing]);

  const handleSubmit = async () => {
    if (!title.trim()) { message.error('请输入标题'); return; }
    if (!startAt) { message.error('请选择开始时间'); return; }
    const payload = { title: title.trim(), type, startAt: startAt.unix(), endAt: endAt ? endAt.unix() : undefined, allDay, location: location.trim() || undefined, note: note.trim() || undefined, repeatRule: repeatRule || undefined };
    try {
      if (isEdit) { await updateEvent.mutateAsync({ id: id!, ...payload }); message.success('已更新'); }
      else { await createEvent.mutateAsync(payload); message.success('已创建'); }
      navigate('/calendar');
    } catch (err: unknown) { message.error(err instanceof Error ? err.message : '操作失败'); }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>{isEdit ? '编辑日程' : '新建日程'}</Title>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>标题</Text><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="日程标题" size="large" autoFocus /></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>类型</Text><Select value={type} onChange={v => setType(v)} options={EVENT_TYPE_OPTIONS} style={{ width: '100%' }} size="large" /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Switch checked={allDay} onChange={setAllDay} /><Text>全天</Text></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>开始时间</Text><DatePicker showTime={!allDay} value={startAt} onChange={setStartAt} style={{ width: '100%' }} size="large" /></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>结束时间（可选）</Text><DatePicker showTime={!allDay} value={endAt} onChange={setEndAt} style={{ width: '100%' }} size="large" /></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>地点（可选）</Text><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="地点" size="large" /></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>备注（可选）</Text><TextArea value={note} onChange={e => setNote(e.target.value)} placeholder="备注" rows={3} /></div>
        <div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>重复</Text><Select value={repeatRule} onChange={v => setRepeatRule(v)} options={[{ value: '', label: '不重复' }, { value: 'yearly', label: '每年重复' }]} style={{ width: '100%' }} size="large" /></div>
        <Button type="primary" size="large" block loading={createEvent.isPending || updateEvent.isPending} onClick={handleSubmit}>{isEdit ? '保存' : '创建'}</Button>
        <Button block onClick={() => navigate(-1)}>取消</Button>
      </Space>
    </div>
  );
}
