import { useEffect, useState } from 'react';
import { NavBar, List, Toast, SpinLoading } from 'antd-mobile';
import { UserOutline } from 'antd-mobile-icons';
import { api } from '@/core/api/client';
import { useAuthStore } from '@/core/auth/store';
import { BRAND_COLOR } from '@family-hub/shared';

interface RawMember {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  created_at: number;
}

export function MembersPageMobile() {
  const { member } = useAuthStore();
  const [members, setMembers] = useState<RawMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<RawMember[]>('/api/workspace/members')
      .then(setMembers)
      .catch(() => Toast.show('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0' }}>
      <NavBar onBack={() => window.history.back()}>家庭成员</NavBar>
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16 }}>
            <List>
              {members.map((m) => (
                <List.Item
                  key={m.id}
                  prefix={
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: BRAND_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.avatar_url ? <img src={m.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : <UserOutline style={{ fontSize: 20, color: '#fff' }} />}
                    </div>
                  }
                  extra={
                    <span style={{ fontSize: 12, color: m.role === 'admin' ? BRAND_COLOR : '#999', fontWeight: m.role === 'admin' ? 600 : 400 }}>
                      {m.role === 'admin' ? '管理员' : '成员'}
                    </span>
                  }
                >
                  <div style={{ fontWeight: 500 }}>{m.nickname}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {m.id === member?.id && '（我） · '}
                    {new Date(m.created_at * 1000).toLocaleDateString('zh-CN')} 加入
                  </div>
                </List.Item>
              ))}
            </List>
          </div>
        )}
      </div>
    </div>
  );
}
