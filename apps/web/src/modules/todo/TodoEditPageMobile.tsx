import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Form, Input, Button, Selector, DatePicker, Toast } from 'antd-mobile';
import { AddOutline, MinusCircleOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { useCreateTodo, useUpdateTodo, useTodo } from './api';
import type { Member } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';
import dayjs from 'dayjs';

export function TodoEditPageMobile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing } = useTodo(id ?? '');
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/api/workspace/members'),
  });

  const [form] = Form.useForm();
  const [subtasks, setSubtasks] = useState<Array<{ title: string }>>([]);
  const [dateVisible, setDateVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    if (existing) {
      form.setFieldsValue({
        title: existing.title,
        note: existing.note ?? '',
        priority: [existing.priority],
        assigneeIds: existing.assignees?.map((a) => a.id) ?? [],
      });
      setSubtasks(existing.subtasks?.map((s) => ({ title: s.title })) ?? []);
      if (existing.dueAt) {
        const d = dayjs.unix(existing.dueAt).toDate();
        setSelectedDate(d);
      }
    }
  }, [existing, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!values.title?.trim()) { Toast.show('请输入标题'); return; }

    const priority = Array.isArray(values.priority) ? values.priority[0] : 'mid';
    const assigneeIds = values.assigneeIds ?? [];
    const validSubtasks = subtasks.filter((s) => s.title.trim().length > 0);
    const dueAt = selectedDate ? Math.floor(selectedDate.getTime() / 1000) : undefined;

    try {
      if (isEdit && id) {
        await updateTodo.mutateAsync({
          id,
          title: values.title.trim(),
          note: values.note || undefined,
          priority,
          dueAt,
          assigneeIds,
          subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
        });
        Toast.show('已更新');
        navigate(`/todo/${id}`);
      } else {
        const result = await createTodo.mutateAsync({
          title: values.title.trim(),
          note: values.note || undefined,
          priority,
          dueAt,
          assigneeIds,
          subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
        });
        Toast.show('已创建');
        navigate(`/todo/${result.id}`);
      }
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: '' }]);
  };

  const handleSubtaskChange = (index: number, value: string) => {
    const next = [...subtasks];
    next[index] = { title: value };
    setSubtasks(next);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        {isEdit ? '编辑待办' : '新建待办'}
      </NavBar>

      <div style={{ padding: 16 }}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSubmit}
          initialValues={{ priority: ['mid'] }}
          footer={
            <Button block color="primary" type="submit" loading={createTodo.isPending || updateTodo.isPending}>
              {isEdit ? '保存修改' : '创建'}
            </Button>
          }
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="待办内容" />
          </Form.Item>

          <Form.Item name="note" label="备注">
            <Input placeholder="可选备注" />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <Selector
              options={[
                { label: '高', value: 'high' },
                { label: '中', value: 'mid' },
                { label: '低', value: 'low' },
              ]}
            />
          </Form.Item>

          <Form.Item name="assigneeIds" label="负责人">
            <Selector
              multiple
              options={members.map((m) => ({ label: m.nickname, value: m.id }))}
            />
          </Form.Item>

          <Form.Item label="截止时间">
            <div
              style={{ padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e5e5', cursor: 'pointer' }}
              onClick={() => setDateVisible(true)}
            >
              {selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD HH:mm') : '选择时间'}
            </div>
            <DatePicker
              visible={dateVisible}
              onClose={() => setDateVisible(false)}
              min={new Date()}
              value={selectedDate}
              onConfirm={(val) => { setSelectedDate(val); setDateVisible(false); }}
            />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#666' }}>子任务</span>
            <span style={{ color: BRAND_COLOR, fontSize: 14 }} onClick={handleAddSubtask}>
              <AddOutline /> 添加
            </span>
          </div>
          {subtasks.map((sub, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <Input
                placeholder="子任务内容"
                value={sub.title}
                onChange={(v) => handleSubtaskChange(i, v)}
                style={{ flex: 1, '--font-size': '14px' }}
              />
              <MinusCircleOutline style={{ fontSize: 20, color: '#FF4D4F' }} onClick={() => handleRemoveSubtask(i)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
