import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Input, InputNumber, Select, Tag, Popconfirm, message, Space, Modal, Spin, Empty, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useShopItems, useAddShopItem, useDeleteShopItem, useBuyShopItem, useShopListToBill } from './api';
import { useAuthStore } from '@/core/auth/store';

const { Text, Title } = Typography;

const priorityColor: Record<string, string> = { high: '#FF4D4F', mid: '#FF8C42', low: '#999' };
const priorityLabel: Record<string, string> = { high: '高', mid: '中', low: '低' };

export function ShopListDetailPageDesktop() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { member } = useAuthStore();
  const { data: items, isLoading } = useShopItems(listId ?? '');
  const addItem = useAddShopItem();
  const deleteItem = useDeleteShopItem();
  const buyItem = useBuyShopItem();
  const listToBill = useShopListToBill();

  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unit, setUnit] = useState('个');
  const [estPrice, setEstPrice] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [note, setNote] = useState('');

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState<string>('');
  const [actualPrice, setActualPrice] = useState<number>(0);

  const handleAddItem = async () => {
    if (!name.trim()) { message.error('请输入商品名称'); return; }
    try {
      await addItem.mutateAsync({ listId: listId!, name: name.trim(), qty, unit: unit || '个', estPrice, priority, note: note || undefined });
      setName(''); setQty(1); setUnit('个'); setEstPrice(undefined); setPriority('mid'); setNote('');
      message.success('已添加');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ listId: listId!, itemId });
      message.success('已删除');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleBuy = async () => {
    try {
      await buyItem.mutateAsync({ listId: listId!, itemId: buyingItemId, actualPrice, buyerId: member?.id ?? '' });
      setBuyModalOpen(false);
      message.success('已购买');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleToBill = async () => {
    if (!member) { message.error('请先登录'); return; }
    try {
      await listToBill.mutateAsync({ listId: listId!, categoryL1: 'cat_daily', categoryL2: 'cat_daily_paper', payerId: member.id });
      message.success('已生成账单');
      navigate('/shop');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const unbought = items?.filter((i) => !i.bought) ?? [];
  const bought = items?.filter((i) => i.bought) ?? [];

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>购物清单</Title>
        <Space>
          <Button icon={<DollarOutlined />} size="small" onClick={handleToBill} loading={listToBill.isPending}>联动账单</Button>
          <Button size="small" onClick={() => navigate('/shop')}>返回</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="商品名称" />
          <Space>
            <InputNumber value={qty} onChange={(v) => setQty(v ?? 1)} min={1} style={{ width: 60 }} />
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 60 }} placeholder="单位" />
            <InputNumber value={estPrice} onChange={(v) => setEstPrice(v ?? undefined)} min={0} step={0.01} style={{ width: 100 }} placeholder="估价" prefix="¥" />
            <Select value={priority} onChange={setPriority} style={{ width: 80 }}>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="mid">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Space>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注" />
          <Button type="primary" icon={<PlusOutlined />} block loading={addItem.isPending} onClick={handleAddItem}>添加</Button>
        </Space>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center' }}><Spin /></div>
      ) : items && items.length === 0 ? (
        <Empty description="清单为空，添加商品吧" />
      ) : (
        <>
          {unbought.length > 0 && (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>待购买 ({unbought.length})</Text>
              {unbought.map((item) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.name}</Text>
                      <Tag color={priorityColor[item.priority]} style={{ marginLeft: 8, fontSize: 10 }}>{priorityLabel[item.priority]}</Tag>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.qty}{item.unit}</Text>
                      {item.estPrice !== undefined && item.estPrice !== null && (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>估 ¥{Number(item.estPrice).toFixed(2)}</Text>
                      )}
                      {item.note && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{item.note}</Text>}
                    </div>
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => { setBuyingItemId(item.id); setActualPrice(Number(item.estPrice) || 0); setBuyModalOpen(true); }}
                      >
                        购买
                      </Button>
                      <Popconfirm title="确认删除？" onConfirm={() => handleDelete(item.id)} okText="删除" cancelText="取消">
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))}
            </>
          )}

          {bought.length > 0 && (
            <>
              <Divider />
              <Text type="secondary" style={{ fontSize: 12 }}>已购买 ({bought.length})</Text>
              {bought.map((item) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8, opacity: 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text delete>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.qty}{item.unit}</Text>
                      {item.actualPrice !== undefined && item.actualPrice !== null && (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>实 ¥{Number(item.actualPrice).toFixed(2)}</Text>
                      )}
                      {item.buyerId && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>购买人: {item.buyerId}</Text>}
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <Modal
        title="确认购买"
        open={buyModalOpen}
        onOk={handleBuy}
        onCancel={() => setBuyModalOpen(false)}
        confirmLoading={buyItem.isPending}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ margin: '16px 0' }}>
          <Text>实际价格</Text>
          <InputNumber
            value={actualPrice}
            onChange={(v) => setActualPrice(v ?? 0)}
            min={0}
            step={0.01}
            prefix="¥"
            style={{ width: '100%', marginTop: 8 }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
