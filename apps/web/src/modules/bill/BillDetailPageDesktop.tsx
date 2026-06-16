import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useBill, useDeleteBill, type BillWithCategory } from './api';

const { Title, Text } = Typography;

export function BillDetailPageDesktop() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bill, isLoading } = useBill(id ?? '');
  const deleteBill = useDeleteBill();

  if (isLoading) return <div style={{ padding: 24 }}>加载中...</div>;
  if (!bill) return <div style={{ padding: 24 }}>账单不存在</div>;

  const handleDelete = async () => {
    try { await deleteBill.mutateAsync(bill.id); message.success('已删除'); navigate('/bill'); }
    catch (err: unknown) { message.error(err instanceof Error ? err.message : '删除失败'); }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Title level={4}>账单详情</Title>
      <Card>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text type="secondary">支出金额</Text>
          <Title level={2} style={{ margin: '4px 0', color: '#FF4D4F' }}>¥ {bill.amount.toFixed(2)}</Title>
        </div>
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">日期</Text><Text>{bill.billDate}</Text></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">分类</Text><Text>{(bill as BillWithCategory).cat1Name ?? bill.categoryL1} / {(bill as BillWithCategory).cat2Name ?? bill.categoryL2}</Text></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">付款人</Text><Text>{(bill as any).payerName || bill.payerId}</Text></div>
            {bill.tags && bill.tags.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">标签</Text><Space size={4}>{bill.tags.map((tag) => (<Tag key={tag.id} color={tag.color}>{tag.name}</Tag>))}</Space></div>
            )}
            {bill.note && <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">备注</Text><Text>{bill.note}</Text></div>}
          </Space>
        </div>
      </Card>
      <Space style={{ marginTop: 16, width: '100%' }}>
        <Button icon={<EditOutlined />} onClick={() => navigate(`/bill/${bill.id}/edit`)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={handleDelete} okText="删除" cancelText="取消"><Button danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
        <Button onClick={() => navigate('/bill')}>返回列表</Button>
      </Space>
    </div>
  );
}
