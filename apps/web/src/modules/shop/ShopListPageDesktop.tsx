import { Card, Typography, Button, Empty, Spin, Popconfirm, message, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useShopLists, useDeleteShopList } from './api';

const { Text, Title } = Typography;

const statusLabel: Record<string, string> = { pending: '待采购', active: '采购中', done: '已完成' };
const statusColor: Record<string, string> = { pending: '#999', active: '#FF8C42', done: '#52C41A' };

export function ShopListPageDesktop() {
  const navigate = useNavigate();
  const { data: lists, isLoading } = useShopLists();
  const deleteList = useDeleteShopList();

  if (isLoading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>🛒 购物清单</Title>
        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => navigate('/shop/new')}>新建清单</Button>
      </div>

      {(!lists || lists.length === 0) ? (
        <Empty description="暂无购物清单">
          <Button type="primary" onClick={() => navigate('/shop/new')}>新建清单</Button>
        </Empty>
      ) : (
        lists.map((list) => {
          const percent = list.itemCount > 0 ? Math.round((list.boughtCount / list.itemCount) * 100) : 0;
          return (
            <Card
              key={list.id}
              hoverable
              style={{ marginBottom: 12, cursor: 'pointer' }}
              onClick={() => navigate(`/shop/${list.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{list.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12, color: statusColor[list.status] }}>
                    {statusLabel[list.status] ?? list.status}
                  </Text>
                </div>
                <Popconfirm
                  title="确认删除该清单？"
                  onConfirm={async (e) => {
                    e?.stopPropagation();
                    try {
                      await deleteList.mutateAsync(list.id);
                      message.success('已删除');
                    } catch (err: unknown) {
                      message.error(err instanceof Error ? err.message : '删除失败');
                    }
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{list.boughtCount}/{list.itemCount} 已买</Text>
                <Progress percent={percent} size="small" showInfo={false} strokeColor={percent === 100 ? '#52C41A' : '#FF8C42'} />
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
