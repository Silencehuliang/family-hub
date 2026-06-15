/**
 * 登录页(已信任设备输入 PIN)
 */
import { useState, useEffect } from 'react';
import { Button, Input, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';
import { BRAND_COLOR } from '@family-hub/shared';

const { Title, Text } = Typography;

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // 已登录则跳转
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    try {
      await login(pin);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      setAttempts((a) => a + 1);
      message.error(msg);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100dvh',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
      <Title level={4} style={{ color: BRAND_COLOR }}>家庭管家</Title>
      <Text type="secondary" style={{ marginBottom: 32 }}>输入 PIN 登录</Text>

      <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 280 }}>
        <Input.Password
          placeholder="输入 PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onPressEnter={handleLogin}
          maxLength={6}
          size="large"
          style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
          autoFocus
        />
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          disabled={pin.length < 4}
          onClick={handleLogin}
        >
          登录
        </Button>
        {attempts >= 3 && (
          <Text type="danger" style={{ fontSize: 12 }}>
            PIN 错误次数过多？请联系管理员
          </Text>
        )}
      </Space>
    </div>
  );
}
