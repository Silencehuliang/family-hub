import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Input, Checkbox, Toast, SpinLoading, Dialog } from 'antd-mobile';
import { useTodo, useDeleteTodo, useSetTodoStatus, useAddSubtask, useUpdateSubtask, useDeleteSubtask } from './api';
import dayjs from 'dayjs';
import { BRAND_COLOR } from '@family-hub/shared';

const PRIORITY_LABELS: Record<string, string> = { high: '高', mid: '中', low: '低' };
const PRIORITY_COLORS: Record<string, string> = { high: 'red', mid: 'orange', low: 'default' };
const STATUS_LABELS: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成' };

export function TodoDetailPageMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useTodo(id ?? '');
  const deleteTodo = useDeleteTodo();
  const setStatus = useSetTodoStatus();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  const [subtaskInput, setSubtaskInput] = useState('');

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;
  if (!item) return <div style={{ padding: 24 }}>待办不存在</div>;

  const handleDelete = () => {
    Dialog.confirm({
      content: '确认删除这条待办？',
      onConfirm: async () => {
        try {
          await deleteTodo.mutateAsync(item.id);
          Toast.show('已删除');
          navigate('/todo');
        } catch (err: unknown) {
          Toast.show(err instanceof Error ? err.message : '删除失败');
        }
      },
    });
  };

  const handleStatusChange = async (status: string) => {
    try {
      await setStatus.mutateAsync({ id: item.id, status });
      Toast.show('状态已更新');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleAddSubtask = async () => {
    if (!subtaskInput.trim()) return;
    try {
      await addSubtask.mutateAsync({ todoId: item.id, title: subtaskInput.trim() });
      setSubtaskInput('');
      Toast.show('已添加子任务');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleToggleSubtask = async (subId: string, done: boolean) => {
    try {
      await updateSubtask.mutateAsync({ todoId: item.id, subId, done: !done });
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    try {
      await deleteSubtask.mutateAsync({ todoId: item.id, subId });
      Toast.show('已删除子任务');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        onBack={() => navigate(-1)}
        right={
          <span style={{ color: '#fff' }} onClick={handleDelete}>删除</span>
        }
      >
        待办详情
      </NavBar>

      <div style={{ padding: 16 }}>
        <Card style={{ borderRadius: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>{item.title}</h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Tag color={PRIORITY_COLORS[item.priority]}>{PRIORITY_LABELS[item.priority]}优先级</Tag>
            <Tag color="primary">{STATUS_LABELS[item.status]}</Tag>
          </div>

          {item.note && (
            <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
              {item.note}
            </div>
          )}

          <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
            📅 {item.dueAt ? dayjs.unix(item.dueAt).format('YYYY-MM-DD HH:mm') : '无截止时间'}
          </div>

          {item.assignees && item.assignees.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#999' }}>负责人: </span>
              {item.assignees.map((m) => (
                <Tag key={m.id} color="primary" style={{ fontSize: 11 }}>{m.nickname}</Tag>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, color: '#ccc' }}>
            创建于 {dayjs.unix(item.createdAt).format('YYYY-MM-DD HH:mm')}
            {item.completedAt && <> · 完成于 {dayjs.unix(item.completedAt).format('YYYY-MM-DD HH:mm')}</>}
          </div>
        </Card>

        <Card style={{ borderRadius: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>子任务</div>
          {item.subtasks && item.subtasks.length > 0 ? (
            item.subtasks.map((sub) => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Checkbox checked={sub.done} onChange={() => handleToggleSubtask(sub.id, sub.done)} />
                <span style={{ flex: 1, fontSize: 14, textDecoration: sub.done ? 'line-through' : undefined, color: sub.done ? '#999' : '#333' }}>
                  {sub.title}
                </span>
                <span style={{ color: '#FF4D4F', fontSize: 12 }} onClick={() => handleDeleteSubtask(sub.id)}>删除</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: '#999' }}>暂无子任务</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              placeholder="添加子任务"
              value={subtaskInput}
              onChange={(v) => setSubtaskInput(v)}
              style={{ flex: 1, '--font-size': '14px' }}
            />
            <Button size="small" color="primary" onClick={handleAddSubtask} loading={addSubtask.isPending}>添加</Button>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button block color="primary" fill="outline" onClick={() => navigate(`/todo/${item.id}/edit`, { state: { item } })}>
            编辑
          </Button>
          {item.status !== 'done' ? (
            <Button block color="success" onClick={() => handleStatusChange('done')}>标记完成</Button>
          ) : (
            <Button block color="default" onClick={() => handleStatusChange('todo')}>重新打开</Button>
          )}
        </div>
      </div>
    </div>
  );
}
