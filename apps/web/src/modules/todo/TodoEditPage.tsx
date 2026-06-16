import { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, Space, message, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateTodo, useUpdateTodo, useTodo } from './api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export function TodoEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing } = useTodo(id ?? '');
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [dueAt, setDueAt] = useState<number | undefined>();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setNote(existing.note ?? '');
      setPriority(existing.priority as 'high' | 'mid' | 'low');
      setDueAt(existing.dueAt);
      setAssigneeIds(existing.assignees?.map((a) => a.id) ?? []);
    }
  }, [existing]);

  const handleSubmit = async () => {
    if (!title.trim()) { message.error('请输入标题'); return; }

    try {
      if (isEdit && id) {
        await updateTodo.mutateAsync({
          id,
          title: title.trim(),
          note: note || undefined,
          priority,
          dueAt,
          assigneeIds,
        });
        message.success('已更新');
        navigate(`/todo/${id}`);
      } else {
        const result = await createTodo.mutateAsync({
          title: title.trim(),
          note: note || undefined,
          priority,
          dueAt,
          assigneeIds,
        });
        message.success('已创建');
        navigate(`/todo/${result.id}`);
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4}>{isEdit ? '编辑待办' : '新建待办'}</Title>

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">标题</Text>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="待办内容" autoFocus />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">备注</Text>
        <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="可选备注" maxLength={500} rows={3} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">优先级</Text>
        <Select value={priority} onChange={(v) => setPriority(v)} style={{ width: '100%' }}>
          <Select.Option value="high">高</Select.Option>
          <Select.Option value="mid">中</Select.Option>
          <Select.Option value="low">低</Select.Option>
        </Select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">截止时间</Text>
        <DatePicker
          showTime
          value={dueAt ? dayjs.unix(dueAt) : undefined}
          onChange={(d) => setDueAt(d ? d.unix() : undefined)}
          style={{ width: '100%' }}
        />
      </div>

      <Space style={{ marginTop: 16, width: '100%' }} direction="vertical">
        <Button type="primary" size="large" block loading={createTodo.isPending || updateTodo.isPending} onClick={handleSubmit}>
          {isEdit ? '保存修改' : '创建'}
        </Button>
        <Button block onClick={() => navigate(-1)}>取消</Button>
      </Space>
    </div>
  );
}
