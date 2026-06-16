/**
 * 欢迎页(首次使用入口)
 */
import { Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BRAND_COLOR } from '@family-hub/shared';

const { Title, Text } = Typography;

export function Welcome() {
  const navigate = useNavigate();

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
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
      <Title level={2} style={{ color: BRAND_COLOR, marginBottom: 4 }}>家庭管家</Title>
      <Text type="secondary" style={{ marginBottom: 48 }}>让家庭事务井井有条</Text>

      <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 320 }}>
        <Button type="primary" size="large" block onClick={() => navigate('/create-family')}>
          创建家庭
        </Button>
        <Button size="large" block onClick={() => navigate('/redeem')}>
          加入已有家庭
        </Button>
      </Space>

      <Text type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
        已有邀请码？点击「加入已有家庭」
      </Text>
    </div>
  );
}
