import { NavBar, Card, SpinLoading } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { WorkspaceSummary } from '@family-hub/shared';
import { getWorkspaceModules } from '@/registry';

export function WorkspacePageMobile() {
  const { member, family } = useAuthStore();
  const navigate = useNavigate();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => api.get<WorkspaceSummary>('/api/workspace/summary'),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  const workspaceModules = getWorkspaceModules();

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0' }}>
      <NavBar back={null}>工作台</NavBar>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
            👋 {greeting}，{member?.nickname}
          </div>
          <div style={{ fontSize: 14, color: '#999' }}>{family?.name}</div>
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {workspaceModules.map((m) => {
                const CardComponent = m.workspaceCard!;
                return <CardComponent key={m.key} />;
              })}
            </div>

            <Card style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div
                  style={{ textAlign: 'center', padding: '12px 0', cursor: 'pointer' }}
                  onClick={() => navigate('/bill/new')}
                >
                  <div style={{ fontSize: 28 }}>📒</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>记一笔</div>
                </div>
                <div
                  style={{ textAlign: 'center', padding: '12px 0', cursor: 'pointer' }}
                  onClick={() => navigate('/bill')}
                >
                  <div style={{ fontSize: 28 }}>📊</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>账单明细</div>
                </div>
              </div>
            </Card>

            {summary?.todayReminders && summary.todayReminders.length > 0 && (
              <Card title="今日提醒" style={{ marginTop: 12 }}>
                {summary.todayReminders.map((r, i) => (
                  <div key={i} style={{ padding: '8px 0', fontSize: 14, borderTop: i > 0 ? '1px solid #f0f0f0' : undefined }}>
                    🔔 {r.title}
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
