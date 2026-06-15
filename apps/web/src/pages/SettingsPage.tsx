/**
 * 设置 / 我的
 * Phase 1:成员信息、设备管理、登出;Phase 2+:通知偏好、飞书配置等
 */
import { useState, useEffect } from 'react';
import { Button, Typography, Card, List, Avatar, message, Space, Modal } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MobileOutlined,
  PlusOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/core/auth/store';
import { api } from '@/core/api/client';
import type { Device } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';

const { Title, Text } = Typography;

export function SettingsPage() {
  const { member, family, logout } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // 加载设备列表
  useEffect(() => {
    api.get<Device[]>('/api/device').then(setDevices).catch(() => {});
  }, []);

  // 生成邀请码
  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const result = await api.post<{ code: string; expiresAt: number }>('/auth/invite/create', {
        ttlHours: 24,
        maxUses: 1,
      });
      setInviteCode(result.code);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '生成失败');
    } finally {
      setInviteLoading(false);
    }
  };

  // 复制邀请码
  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      message.success('已复制');
    }
  };

  // 吊销设备
  const handleRevoke = async (deviceId: string) => {
    Modal.confirm({
      title: '确认吊销该设备？',
      content: '吊销后该设备需要重新邀请才能使用',
      onOk: async () => {
        try {
          await api.post('/api/device/revoke', { deviceId });
          setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, trusted: 0 as const } : d)));
          message.success('已吊销');
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : '操作失败');
        }
      },
    });
  };

  // 登出
  const handleLogout = async () => {
    Modal.confirm({
      title: '确认退出登录？',
      onOk: async () => {
        await logout();
        window.location.href = '/login';
      },
    });
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4}>我的</Title>

      {/* 成员信息 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={48} icon={<UserOutlined />} style={{ background: BRAND_COLOR }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>{member?.nickname}</Text>
            <br />
            <Text type="secondary">{family?.name} · {member?.role === 'admin' ? '管理员' : '成员'}</Text>
          </div>
        </div>
      </Card>

      {/* 邀请家人(管理员) */}
      {member?.role === 'admin' && (
        <Card title="邀请家人" style={{ marginBottom: 16 }}>
          {inviteCode ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">邀请码（24 小时有效，限 1 次）</Text>
                <Title level={2} style={{ margin: '8px 0', letterSpacing: 6, color: BRAND_COLOR }}>
                  {inviteCode}
                </Title>
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  复制邀请码
                </Button>
              </div>
            </Space>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={inviteLoading}
              onClick={handleInvite}
              block
            >
              生成邀请码
            </Button>
          )}
        </Card>
      )}

      {/* 我的设备 */}
      <Card title="我的设备" style={{ marginBottom: 16 }}>
        <List
          dataSource={devices}
          locale={{ emptyText: '暂无设备' }}
          renderItem={(device) => (
            <List.Item
              actions={
                device.trusted
                  ? [<Button key="revoke" danger size="small" onClick={() => handleRevoke(device.id)}>吊销</Button>]
                  : [<Text key="revoked" type="danger">已吊销</Text>]
              }
            >
              <List.Item.Meta
                avatar={<MobileOutlined style={{ fontSize: 20 }} />}
                title={device.deviceName || '未知设备'}
                description={
                  <>
                    <Text type="secondary">
                      最后活跃: {new Date(device.lastActiveAt * 1000).toLocaleString('zh-CN')}
                    </Text>
                    {!device.trusted && <Text type="danger" style={{ marginLeft: 8 }}>已吊销</Text>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 退出登录 */}
      <Button
        danger
        icon={<LogoutOutlined />}
        block
        size="large"
        onClick={handleLogout}
      >
        退出登录
      </Button>
    </div>
  );
}
