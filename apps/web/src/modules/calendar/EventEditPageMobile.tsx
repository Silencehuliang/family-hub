import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Form, Input, Button, Selector, Switch, DatePicker, Toast } from 'antd-mobile';
import dayjs from 'dayjs';
import { useCreateEvent, useUpdateEvent, useEvent } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

const EVENT_TYPE_OPTIONS = [
  { label: '生日', value: 'birthday' }, { label: '纪念日', value: 'anniversary' },
  { label: '就医', value: 'medical' }, { label: '账单', value: 'bill' },
  { label: '旅行', value: 'travel' }, { label: '证件到期', value: 'id_expiring' },
  { label: '其他', value: 'other' },
];

export function EventEditPageMobile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existing } = useEvent(isEdit ? id : undefined);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [form] = Form.useForm();
  const [startDateVisible, setStartDateVisible] = useState(false);
  const [endDateVisible, setEndDateVisible] = useState(false);
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    if (existing) {
      form.setFieldsValue({
        title: existing.title,
        type: [existing.type],
        location: existing.location ?? '',
        note: existing.note ?? '',
        repeatRule: existing.repeatRule ?? '',
        startAt: dayjs.unix(existing.startAt).toDate(),
        endAt: existing.endAt ? dayjs.unix(existing.endAt).toDate() : undefined,
      });
      setAllDay(existing.allDay);
    }
  }, [existing, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!values.title?.trim()) { Toast.show('请输入标题'); return; }

    const type = Array.isArray(values.type) ? values.type[0] : 'other';
    const startAt = values.startAt ? values.startAt : (existing?.startAt ? dayjs.unix(existing.startAt).toDate() : new Date());

    const payload = {
      title: values.title.trim(),
      type,
      startAt: Math.floor(startAt.getTime() / 1000),
      endAt: values.endAt ? Math.floor(values.endAt.getTime() / 1000) : undefined,
      allDay,
      location: values.location?.trim() || undefined,
      note: values.note?.trim() || undefined,
      repeatRule: values.repeatRule || undefined,
    };

    try {
      if (isEdit) { await updateEvent.mutateAsync({ id: id!, ...payload }); Toast.show('已更新'); }
      else { await createEvent.mutateAsync(payload); Toast.show('已创建'); }
      navigate('/calendar');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        {isEdit ? '编辑日程' : '新建日程'}
      </NavBar>

      <div style={{ padding: 16 }}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSubmit}
          initialValues={{ type: ['other'], repeatRule: '' }}
          footer={
            <Button block color="primary" type="submit" loading={createEvent.isPending || updateEvent.isPending}>
              {isEdit ? '保存' : '创建'}
            </Button>
          }
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="日程标题" />
          </Form.Item>

          <Form.Item name="type" label="类型">
            <Selector options={EVENT_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item label="全天">
            <Switch checked={allDay} onChange={setAllDay} />
          </Form.Item>

          <Form.Item name="startAt" label="开始时间">
            <div
              style={{ padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e5e5', cursor: 'pointer' }}
              onClick={() => setStartDateVisible(true)}
            >
              {form.getFieldValue('startAt') ? dayjs(form.getFieldValue('startAt')).format('YYYY-MM-DD HH:mm') : '选择时间'}
            </div>
            <DatePicker visible={startDateVisible} onClose={() => setStartDateVisible(false)} onConfirm={(v) => { form.setFieldValue('startAt', v); setStartDateVisible(false); }} />
          </Form.Item>

          <Form.Item name="endAt" label="结束时间">
            <div
              style={{ padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e5e5', cursor: 'pointer' }}
              onClick={() => setEndDateVisible(true)}
            >
              {form.getFieldValue('endAt') ? dayjs(form.getFieldValue('endAt')).format('YYYY-MM-DD HH:mm') : '选择时间'}
            </div>
            <DatePicker visible={endDateVisible} onClose={() => setEndDateVisible(false)} onConfirm={(v) => { form.setFieldValue('endAt', v); setEndDateVisible(false); }} />
          </Form.Item>

          <Form.Item name="location" label="地点">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="note" label="备注">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="repeatRule" label="重复">
            <Selector
              options={[
                { label: '不重复', value: '' },
                { label: '每年重复', value: 'yearly' },
              ]}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
