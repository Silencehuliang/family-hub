import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, Button, Popup, Form, Input, Selector, SwipeAction, Toast, Empty, SpinLoading } from 'antd-mobile';
import { AddOutline, ShopbagOutline } from 'antd-mobile-icons';
import { useShopItems, useAddShopItem, useDeleteShopItem, useBuyShopItem } from './api';
import { useAuthStore } from '@/core/auth/store';
import { BRAND_COLOR } from '@family-hub/shared';

const priorityLabel: Record<string, string> = { high: '高', mid: '中', low: '低' };
const priorityColor: Record<string, string> = { high: '#FF4D4F', mid: BRAND_COLOR, low: '#999' };

export function ShopListDetailPageMobile() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { member } = useAuthStore();
  const { data: items, isLoading } = useShopItems(listId ?? '');
  const addItem = useAddShopItem();
  const deleteItem = useDeleteShopItem();
  const buyItem = useBuyShopItem();

  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [buyPopupOpen, setBuyPopupOpen] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState('');
  const [actualPrice, setActualPrice] = useState(0);

  const [form] = Form.useForm();

  const handleAddItem = async () => {
    const values = await form.validateFields();
    const priority = Array.isArray(values.priority) ? values.priority[0] : (values.priority ?? 'mid');
    try {
      await addItem.mutateAsync({
        listId: listId!,
        name: values.name,
        qty: Number(values.qty) || 1,
        unit: values.unit || '个',
        estPrice: values.estPrice ? Number(values.estPrice) : undefined,
        priority,
        note: values.note,
      });
      Toast.show('已添加');
      setAddPopupOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err instanceof Error) Toast.show(err.message);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ listId: listId!, itemId });
      Toast.show('已删除');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleBuy = async () => {
    try {
      await buyItem.mutateAsync({ listId: listId!, itemId: buyingItemId, actualPrice, buyerId: member?.id ?? '' });
      setBuyPopupOpen(false);
      Toast.show('已购买');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '操作失败');
    }
  };

  const unbought = items?.filter((i) => !i.bought) ?? [];
  const bought = items?.filter((i) => i.bought) ?? [];

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        购物清单
      </NavBar>

      <div style={{ padding: 16 }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>
        ) : items && items.length === 0 ? (
          <Empty />
        ) : (
          <>
            {unbought.length > 0 && (
              <Card style={{ borderRadius: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>待购买 ({unbought.length})</div>
                {unbought.map((item) => (
                  <SwipeAction
                    key={item.id}
                    rightActions={[
                      { key: 'delete', text: '删除', color: 'danger', onClick: () => handleDelete(item.id) },
                    ]}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}
                      onClick={() => { setBuyingItemId(item.id); setActualPrice(Number(item.estPrice) || 0); setBuyPopupOpen(true); }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${BRAND_COLOR}`, marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShopbagOutline style={{ fontSize: 12, color: BRAND_COLOR }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: 10, color: priorityColor[item.priority], marginLeft: 6 }}>{priorityLabel[item.priority]}</span>
                        <br />
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {item.qty}{item.unit}
                          {item.estPrice != null && ` · 估 ¥${Number(item.estPrice).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </SwipeAction>
                ))}
              </Card>
            )}

            {bought.length > 0 && (
              <Card style={{ borderRadius: 16 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>已购买 ({bought.length})</div>
                {bought.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5', opacity: 0.6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#52C41A', marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 12 }}>✓</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ textDecoration: 'line-through' }}>{item.name}</span>
                      <br />
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {item.qty}{item.unit}
                        {item.actualPrice != null && ` · 实 ¥${Number(item.actualPrice).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        <Button block color="primary" fill="outline" style={{ marginTop: 16 }} onClick={() => setAddPopupOpen(true)}>
          <AddOutline /> 添加商品
        </Button>
      </div>

      <Popup visible={addPopupOpen} onMaskClick={() => setAddPopupOpen(false)} bodyStyle={{ borderRadius: '16px 16px 0 0' }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>添加商品</h3>
          <Form form={form} layout="horizontal" onFinish={handleAddItem} footer={
            <Button block color="primary" type="submit" loading={addItem.isPending}>添加</Button>
          }>
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="商品名称" />
            </Form.Item>
            <Form.Item name="qty" label="数量" initialValue={1}>
              <Input type="number" placeholder="1" />
            </Form.Item>
            <Form.Item name="unit" label="单位" initialValue={'个'}>
              <Input placeholder="个" />
            </Form.Item>
            <Form.Item name="estPrice" label="估价">
              <Input type="number" placeholder="0.00" />
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue={'mid'}>
              <Selector
                options={[
                  { label: '高', value: 'high' },
                  { label: '中', value: 'mid' },
                  { label: '低', value: 'low' },
                ]}
              />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input placeholder="备注" />
            </Form.Item>
          </Form>
        </div>
      </Popup>

      <Popup visible={buyPopupOpen} onMaskClick={() => setBuyPopupOpen(false)} bodyStyle={{ borderRadius: '16px 16px 0 0' }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>确认购买</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#666' }}>实际价格 (¥)</label>
            <Input
              type="number"
              value={String(actualPrice)}
              onChange={(val) => setActualPrice(Number(val) || 0)}
              style={{ '--font-size': '16px', marginTop: 8 }}
            />
          </div>
          <Button block color="primary" loading={buyItem.isPending} onClick={handleBuy}>
            确认购买
          </Button>
        </div>
      </Popup>
    </div>
  );
}
