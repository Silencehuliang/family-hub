import { useState, useEffect } from 'react';
import { Typography, Card, List, Avatar, Tag } from 'antd';
import { UserOutlined, CrownOutlined } from '@ant-design/icons';
import { BRAND_COLOR } from '@family-hub/shared';
import { api } from '@/core/api/client';
import { useAuthStore } from '@/core/auth/store';

const { Title, Text } = Typography;

interface RawMember {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  created_at: number;
}

export function MembersPageDesktop() {
  const { member } = useAuthStore();
  const [members, setMembers] = useState<RawMember[]>([]);

  useEffect(() => {
    api.get<RawMember[]>('/api/workspace/members').then(setMembers).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4}>家庭成员</Title>
      <Card>
        <List dataSource={members} locale={{ emptyText: '暂无成员' }}
          renderItem={(m) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size={40} icon={!m.avatar_url ? <UserOutlined /> : undefined} src={m.avatar_url} style={{ background: BRAND_COLOR }} />}
                title={<>{m.nickname}{m.id === member?.id && <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>（我）</Text>}</>}
                description={<Text type="secondary">{new Date(m.created_at * 1000).toLocaleDateString('zh-CN')} 加入</Text>}
              />
              <Tag color={m.role === 'admin' ? 'orange' : 'default'} icon={m.role === 'admin' ? <CrownOutlined /> : undefined}>
                {m.role === 'admin' ? '管理员' : '成员'}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
