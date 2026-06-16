import { useState } from 'react';
import { Button, Input, Typography, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCreateShopList } from './api';

const { Title } = Typography;

export function ShopEditPageDesktop() {
  const navigate = useNavigate();
  const createList = useCreateShopList();
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { message.error('请输入清单名称'); return; }
    try {
      const list = await createList.mutateAsync({ name: name.trim() });
      message.success('已创建');
      navigate(`/shop/${list.id}`);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>新建购物清单</Title>

      <div style={{ marginBottom: 16 }}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="清单名称"
          size="large"
          autoFocus
          onPressEnter={handleSubmit}
        />
      </div>

      <Space style={{ width: '100%' }} direction="vertical">
        <Button type="primary" size="large" block loading={createList.isPending} onClick={handleSubmit}>
          创建
        </Button>
        <Button block onClick={() => navigate(-1)}>取消</Button>
      </Space>
    </div>
  );
}
