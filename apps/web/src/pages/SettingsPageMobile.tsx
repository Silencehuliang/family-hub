import { useState, useEffect } from 'react';
import { NavBar, List, Button, Toast, Dialog } from 'antd-mobile';
import { UserOutline, RightOutline } from 'antd-mobile-icons';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { Device } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';
import { EditProfileModal } from '@/components/EditProfileModal';

export function SettingsPageMobile() {
  const { member, family, logout } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  useEffect(() => { api.get<Device[]>('/api/device').then(setDevices).catch(() => {}); }, []);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const result = await api.post<{ code: string; expiresAt: number }>('/auth/invite/create', { ttlHours: 24, maxUses: 1 });
      setInviteCode(result.code);
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '生成失败'); }
    finally { setInviteLoading(false); }
  };

  const handleCopy = () => { if (inviteCode) { navigator.clipboard.writeText(inviteCode); Toast.show('已复制'); } };

  const handleRevoke = (deviceId: string) => {
    Dialog.confirm({
      content: '吊销后该设备需要重新邀请才能使用',
      onConfirm: async () => {
        try { await api.post('/api/device/revoke', { deviceId }); setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, trusted: 0 as const } : d))); Toast.show('已吊销'); }
        catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '操作失败'); }
      },
    });
  };

  const handleLogout = () => {
    Dialog.confirm({
      content: '确认退出登录？',
      onConfirm: async () => { await logout(); window.location.href = '/login'; },
    });
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}>我的</NavBar>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
          onClick={() => setProfileEditOpen(true)}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: BRAND_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserOutline style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{member?.nickname}</div>
            <div style={{ fontSize: 13, color: '#999' }}>{family?.name} · {member?.role === 'admin' ? '管理员' : '成员'}</div>
          </div>
          <RightOutline style={{ color: '#ccc' }} />
        </div>

        {member?.role === 'admin' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>邀请家人</div>
            {inviteCode ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>邀请码（24 小时有效，限 1 次）</div>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 6, color: BRAND_COLOR, margin: '8px 0' }}>{inviteCode}</div>
                <Button size="small" fill="none" onClick={handleCopy}>📋 复制</Button>
              </div>
            ) : (
              <Button block color="primary" loading={inviteLoading} onClick={handleInvite}>+ 生成邀请码</Button>
            )}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, marginBottom: 12 }}>
          <List>
            {devices.length === 0 ? (
              <List.Item>暂无设备</List.Item>
            ) : (
              devices.map((device) => (
                <List.Item
                  key={device.id}
                  prefix={<span style={{ fontSize: 20 }}>📱</span>}
                  extra={device.trusted ? <span style={{ color: '#FF4D4F', fontSize: 12 }} onClick={() => handleRevoke(device.id)}>吊销</span> : <span style={{ color: '#999' }}>已吊销</span>}
                >
                  {device.deviceName || '未知设备'}
                  <br />
                  <span style={{ fontSize: 12, color: '#999' }}>{new Date(device.lastActiveAt * 1000).toLocaleString('zh-CN')}</span>
                </List.Item>
              ))
            )}
          </List>
        </div>

        <Button block fill="none" style={{ color: '#FF4D4F' }} onClick={handleLogout}>
          🚪 退出登录
        </Button>
      </div>

      {member && <EditProfileModal open={profileEditOpen} member={member} onClose={() => setProfileEditOpen(false)} />}
    </div>
  );
}
