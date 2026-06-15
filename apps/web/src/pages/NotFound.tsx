/**
 * 404 页面
 */
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 64 }}>🤷</div>
      <Title level={3}>页面不存在</Title>
      <Text type="secondary">你访问的页面走丢了</Text>
      <br />
      <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
        回到首页
      </Button>
    </div>
  );
}
