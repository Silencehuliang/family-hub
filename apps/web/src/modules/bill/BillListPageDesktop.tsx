import { useState } from 'react';
import { Card, List, Typography, Button, Tag, Empty, Popconfirm, message, Space } from 'antd';
import { PlusOutlined, LeftOutlined, RightOutlined, BarChartOutlined, ImportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBills, useDeleteBill } from './api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export function BillListPageDesktop() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const deleteBill = useDeleteBill();
  const from = `${month}-01`;
  const to = dayjs(month).endOf('month').format('YYYY-MM-DD');
  const { data, isLoading } = useBills({ from, to });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const monthTotal = items.reduce((sum, r) => sum + r.amount, 0);

  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.billDate;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const handleDelete = async (id: string) => {
    try { await deleteBill.mutateAsync(id); message.success('已删除'); }
    catch (err: unknown) { message.error(err instanceof Error ? err.message : '删除失败'); }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>📒 账单</Title>
        <Space>
          <Button icon={<BarChartOutlined />} size="small" onClick={() => navigate('/bill/stats')} />
          <Button icon={<ImportOutlined />} size="small" onClick={() => navigate('/bill/import')} />
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => navigate('/bill/new')}>记一笔</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<LeftOutlined />} size="small" onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))} />
          <div style={{ textAlign: 'center' }}>
            <Text strong>{month}</Text>
            <br />
            <Text type="secondary">共 {total} 笔 · ¥{monthTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
          </div>
          <Button icon={<RightOutlined />} size="small" onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))} />
        </div>
      </Card>

      {items.length === 0 && !isLoading && (
        <Empty description="本月暂无账单">
          <Button type="primary" onClick={() => navigate('/bill/new')}>记一笔</Button>
        </Empty>
      )}

      {[...grouped.entries()].map(([date, records]) => {
        const dayTotal = records.reduce((s, r) => s + r.amount, 0);
        return (
          <div key={date} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <Text type="secondary">{date} {dayjs(date).format('ddd')}</Text>
              <Text type="secondary">¥{dayTotal.toFixed(2)}</Text>
            </div>
            <List
              dataSource={records}
              renderItem={(record) => (
                <Card size="small" style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div onClick={() => navigate(`/bill/${record.id}`)} style={{ flex: 1, cursor: 'pointer' }}>
                      <Text>{record.note || `${record.cat1Name ?? record.categoryL1} / ${record.cat2Name ?? record.categoryL2}`}</Text>
                      <br />
                      <Space size={4}>
                        {record.tags?.map((tag) => (<Tag key={tag.id} color={tag.color} style={{ fontSize: 10 }}>{tag.name}</Tag>))}
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#FF4D4F' }}>-¥{record.amount.toFixed(2)}</Text>
                      <br />
                      <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消">
                        <Button type="text" danger size="small">删除</Button>
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
