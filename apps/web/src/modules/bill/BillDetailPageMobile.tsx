import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Toast, Dialog, SpinLoading } from 'antd-mobile';
import { useBill, useDeleteBill, type BillWithCategory } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

export function BillDetailPageMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bill, isLoading } = useBill(id ?? '');
  const deleteBill = useDeleteBill();

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>;
  if (!bill) return <div style={{ padding: 24, textAlign: 'center' }}>账单不存在</div>;

  const handleDelete = () => {
    Dialog.confirm({
      content: '确认删除此账单？',
      onConfirm: async () => {
        try { await deleteBill.mutateAsync(bill.id); Toast.show('已删除'); navigate('/bill'); }
        catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '删除失败'); }
      },
    });
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        onBack={() => navigate(-1)}
        right={<span style={{ color: '#fff' }} onClick={handleDelete}>删除</span>}
      >账单详情</NavBar>

      <div style={{ padding: 16 }}>
        <Card style={{ borderRadius: 16 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 12, color: '#999' }}>支出金额</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FF4D4F', margin: '4px 0' }}>¥ {bill.amount.toFixed(2)}</div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, fontSize: 14, lineHeight: 2.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#999' }}>日期</span><span>{bill.billDate}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#999' }}>分类</span><span>{(bill as BillWithCategory).cat1Name ?? bill.categoryL1} / {(bill as BillWithCategory).cat2Name ?? bill.categoryL2}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#999' }}>付款人</span><span>{(bill as any).payerName || bill.payerId}</span></div>
            {bill.tags && bill.tags.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#999' }}>标签</span><div>{bill.tags.map((tag) => (<Tag key={tag.id} color={tag.color} style={{ fontSize: 11, borderRadius: 4 }}>{tag.name}</Tag>))}</div></div>
            )}
            {bill.note && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#999' }}>备注</span><span>{bill.note}</span></div>}
          </div>
        </Card>

        <Button block color="primary" fill="outline" style={{ marginTop: 16 }} onClick={() => navigate(`/bill/${bill.id}/edit`)}>
          编辑
        </Button>
      </div>
    </div>
  );
}
