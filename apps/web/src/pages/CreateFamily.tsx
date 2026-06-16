/**
 * 创建家庭页(首成员 = 管理员)
 */
import { useState } from 'react';
import { Button, Input, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';

const { Title, Text } = Typography;

export function CreateFamily() {
  const navigate = useNavigate();
  const { createFamily } = useAuthStore();
  const [familyName, setFamilyName] = useState('');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = familyName.trim() && nickname.trim() && pin.length >= 4 && pin === confirmPin;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (pin !== confirmPin) {
      message.error('两次 PIN 不一致');
      return;
    }
    setLoading(true);
    try {
      await createFamily({ familyName: familyName.trim(), nickname: nickname.trim(), pin });
      message.success('家庭创建成功！');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '创建失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>创建家庭</Title>
        <Button type="link" size="small" onClick={() => navigate('/redeem')}>
          加入已有家庭
        </Button>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        你将成为管理员，可邀请家人加入
      </Text>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text>家庭名称</Text>
          <Input
            placeholder="如：我们的家"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            maxLength={50}
            size="large"
          />
        </div>
        <div>
          <Text>你的昵称</Text>
          <Input
            placeholder="如：爸爸"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            size="large"
          />
        </div>
        <div>
          <Text>设置 PIN（4~6 位数字）</Text>
          <Input.Password
            placeholder="用于登录验证"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            size="large"
          />
        </div>
        <div>
          <Text>确认 PIN</Text>
          <Input.Password
            placeholder="再次输入"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            size="large"
          />
        </div>
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          创建并进入
        </Button>
      </Space>
    </div>
  );
}
