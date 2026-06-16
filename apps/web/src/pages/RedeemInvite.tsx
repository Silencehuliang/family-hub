/**
 * 兑换邀请码页(新成员加入)
 */
import { useState } from 'react';
import { Button, Input, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';

const { Title, Text } = Typography;

export function RedeemInvite() {
  const navigate = useNavigate();
  const { redeemInvite } = useAuthStore();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = code.length === 6 && nickname.trim() && pin.length >= 4 && pin === confirmPin;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (pin !== confirmPin) {
      message.error('两次 PIN 不一致');
      return;
    }
    setLoading(true);
    try {
      await redeemInvite({ code: code.toUpperCase(), nickname: nickname.trim(), pin });
      message.success('加入成功！');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '兑换失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>加入家庭</Title>
        <Button type="link" size="small" onClick={() => navigate('/create-family')}>
          创建新家庭
        </Button>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        请输入管理员提供的 6 位邀请码
      </Text>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text>邀请码</Text>
          <Input
            placeholder="6 位字母数字"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            maxLength={6}
            size="large"
            style={{ textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center' }}
          />
        </div>
        <div>
          <Text>你的昵称</Text>
          <Input
            placeholder="如：妈妈"
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
          加入
        </Button>
      </Space>
    </div>
  );
}
