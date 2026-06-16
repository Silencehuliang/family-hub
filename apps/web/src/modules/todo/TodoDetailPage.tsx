import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Space, Popconfirm, message, Input, Checkbox, Spin } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTodo, useDeleteTodo, useSetTodoStatus, useAddSubtask, useUpdateSubtask, useDeleteSubtask } from './api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PRIORITY_LABELS: Record<string, string> = { high: '高', mid: '中', low: '低' };
const PRIORITY_COLORS: Record<string, string> = { high: 'red', mid: 'orange', low: 'default' };
const STATUS_LABELS: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成' };

export function TodoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useTodo(id ?? '');
  const deleteTodo = useDeleteTodo();
  const setStatus = useSetTodoStatus();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  const [newSubtitle, setNewSubtitle] = useState('');

  if (isLoading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;
  if (!item) return <div style={{ padding: 24 }}>待办不存在</div>;

  const handleDelete = async () => {
    try {
      await deleteTodo.mutateAsync(item.id);
      message.success('已删除');
      navigate('/todo');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await setStatus.mutateAsync({ id: item.id, status });
      message.success('状态已更新');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtitle.trim()) return;
    try {
      await addSubtask.mutateAsync({ todoId: item.id, title: newSubtitle.trim() });
      setNewSubtitle('');
      message.success('已添加子任务');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleToggleSubtask = async (subId: string, done: boolean) => {
    try {
      await updateSubtask.mutateAsync({ todoId: item.id, subId, done: !done });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    try {
      await deleteSubtask.mutateAsync({ todoId: item.id, subId });
      message.success('已删除子任务');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4}>待办详情</Title>

      <Card>
        <Title level={3}>{item.title}</Title>

        <div style={{ marginBottom: 12 }}>
          <Space>
            <Tag color={PRIORITY_COLORS[item.priority]}>{PRIORITY_LABELS[item.priority]}优先级</Tag>
            <Tag>{STATUS_LABELS[item.status]}</Tag>
          </Space>
        </div>

        {item.note && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">备注: </Text>
            <Text>{item.note}</Text>
          </div>
        )}

        {item.dueAt && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">截止: </Text>
            <Text>{dayjs.unix(item.dueAt).format('YYYY-MM-DD HH:mm')}</Text>
          </div>
        )}

        {item.assignees && item.assignees.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">负责人: </Text>
            <Space>
              {item.assignees.map((m) => (
                <Tag key={m.id}>{m.nickname}</Tag>
              ))}
            </Space>
          </div>
        )}

        <Text type="secondary" style={{ fontSize: 12 }}>创建于 {dayjs.unix(item.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
        {item.completedAt && (
          <br />
        )}
        {item.completedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>完成于 {dayjs.unix(item.completedAt).format('YYYY-MM-DD HH:mm')}</Text>
        )}
      </Card>

      {/* 子任务 */}
      <Card title="子任务" size="small" style={{ marginTop: 12 }}>
        {item.subtasks && item.subtasks.length > 0 ? (
          item.subtasks.map((sub) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Checkbox checked={sub.done} onChange={() => handleToggleSubtask(sub.id, sub.done)} />
              <Text style={{ flex: 1, textDecoration: sub.done ? 'line-through' : undefined }}>{sub.title}</Text>
              <Button type="text" danger size="small" onClick={() => handleDeleteSubtask(sub.id)}>删除</Button>
            </div>
          ))
        ) : (
          <Text type="secondary">暂无子任务</Text>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Input
            size="small"
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            placeholder="添加子任务"
            onPressEnter={handleAddSubtask}
          />
          <Button size="small" type="primary" onClick={handleAddSubtask} loading={addSubtask.isPending}>添加</Button>
        </div>
      </Card>

      {/* 操作 */}
      <Space style={{ marginTop: 16, width: '100%' }}>
        <Button icon={<EditOutlined />} onClick={() => navigate(`/todo/${item.id}/edit`, { state: { item } })}>编辑</Button>
        {item.status !== 'done' ? (
          <Button onClick={() => handleStatusChange('done')}>标记完成</Button>
        ) : (
          <Button onClick={() => handleStatusChange('todo')}>重新打开</Button>
        )}
        <Popconfirm title="确认删除？" onConfirm={handleDelete} okText="删除" cancelText="取消">
          <Button danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
        <Button onClick={() => navigate('/todo')}>返回列表</Button>
      </Space>
    </div>
  );
}
