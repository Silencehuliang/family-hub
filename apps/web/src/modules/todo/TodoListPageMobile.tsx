import { useState } from 'react';
import { Tabs, Tag, Button, Empty, SpinLoading, PullToRefresh, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useTodos, useSetTodoStatus } from './api';
import dayjs from 'dayjs';
import { BRAND_COLOR } from '@family-hub/shared';

const PRIORITY_COLORS: Record<string, string> = { high: 'red', mid: 'orange', low: 'default' };
const STATUS_TABS = [
  { key: 'todo', label: '待完成' },
  { key: 'doing', label: '进行中' },
  { key: 'done', label: '已完成' },
];

export function TodoListPageMobile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('todo');
  const { data: items = [], isLoading } = useTodos({});
  const setStatus = useSetTodoStatus();

  const filtered = items.filter((i) => tab === 'all' || i.status === tab);

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;

  return (
    <PullToRefresh onRefresh={async () => {}}>
      <div style={{ padding: 16, background: '#FFF8F0', minHeight: '100vh' }}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k)}>
          {STATUS_TABS.map((t) => (
            <Tabs.Tab title={`${t.label} (${items.filter((i) => i.status === t.key).length})`} key={t.key} />
          ))}
        </Tabs>

        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Empty /></div>
        ) : (
          filtered.map((item) => {
            const priorityText = item.priority === 'high' ? '高' : item.priority === 'mid' ? '中' : '低';
            return (
              <div
                key={item.id}
                style={{
                  background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
                onClick={() => navigate(`/todo/${item.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color={PRIORITY_COLORS[item.priority]} style={{ fontSize: 10, borderRadius: 4 }}>{priorityText}</Tag>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                  </div>
                </div>
                {item.dueAt && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    📅 {dayjs.unix(item.dueAt).format('MM-DD HH:mm')}
                  </div>
                )}
                {tab !== 'done' && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    {STATUS_TABS.filter((s) => s.key !== item.status).map((s) => (
                      <span
                        key={s.key}
                        style={{ fontSize: 12, color: BRAND_COLOR }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatus.mutate({ id: item.id, status: s.key });
                          Toast.show(`已移至${s.label}`);
                        }}
                      >
                        移到 {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        <Button
          color="primary"
          style={{ position: 'fixed', right: 16, bottom: 80, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)' }}
          onClick={() => navigate('/todo/new')}
        >
          <AddOutline style={{ fontSize: 24 }} />
        </Button>
      </div>
    </PullToRefresh>
  );
}
