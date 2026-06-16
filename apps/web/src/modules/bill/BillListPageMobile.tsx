import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Empty, Toast, SwipeAction } from 'antd-mobile';
import { AddOutline, LeftOutline, RightOutline, UnorderedListOutline, DownlandOutline } from 'antd-mobile-icons';
import { useBills, useDeleteBill } from './api';
import dayjs from 'dayjs';

export function BillListPageMobile() {
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
    try { await deleteBill.mutateAsync(id); Toast.show('已删除'); }
    catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '删除失败'); }
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>📒 账单</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <UnorderedListOutline style={{ fontSize: 20 }} onClick={() => navigate('/bill/stats')} />
          <DownlandOutline style={{ fontSize: 20 }} onClick={() => navigate('/bill/import')} />
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
          <LeftOutline style={{ fontSize: 18, color: '#666' }} onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>{month}</div>
            <div style={{ fontSize: 12, color: '#999' }}>共 {total} 笔 · ¥{monthTotal.toFixed(2)}</div>
          </div>
          <RightOutline style={{ fontSize: 18, color: '#666' }} onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))} />
        </div>

        {items.length === 0 && !isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Empty />
          </div>
        ) : (
          [...grouped.entries()].map(([date, records]) => {
            const dayTotal = records.reduce((s, r) => s + r.amount, 0);
            return (
              <div key={date} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#999' }}>
                  <span>{date} {dayjs(date).format('ddd')}</span>
                  <span>¥{dayTotal.toFixed(2)}</span>
                </div>
                {records.map((record) => (
                  <SwipeAction key={record.id} rightActions={[{ key: 'delete', text: '删除', color: 'danger', onClick: () => handleDelete(record.id) }]}>
                    <div
                      style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => navigate(`/bill/${record.id}`)}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14 }}>{record.note || `${record.cat1Name ?? record.categoryL1} / ${record.cat2Name ?? record.categoryL2}`}</span>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          {record.tags?.map((tag) => (
                            <Tag key={tag.id} color={tag.color} style={{ fontSize: 10, borderRadius: 4 }}>{tag.name}</Tag>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#FF4D4F' }}>-¥{record.amount.toFixed(2)}</span>
                    </div>
                  </SwipeAction>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div style={{ position: 'fixed', right: 16, bottom: 80, zIndex: 100 }}>
        <div
          style={{ width: 56, height: 56, borderRadius: '50%', background: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)' }}
          onClick={() => navigate('/bill/new')}
        >
          <AddOutline style={{ fontSize: 24, color: '#fff' }} />
        </div>
      </div>
    </div>
  );
}
