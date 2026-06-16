import { useState } from 'react';
import { NavBar, Card, ProgressBar, Button, Dialog, Input, Toast, SpinLoading } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import { useBudgets, useSetBudget, useBillStats } from './api';
import { useAuthStore } from '@/core/auth/store';

export function BudgetPageMobile() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editOpen, setEditOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { data: budgets, isLoading } = useBudgets(month);
  const { data: stats } = useBillStats(month);
  const setBudget = useSetBudget();
  const { member } = useAuthStore();
  const isAdmin = member?.role === 'admin';

  const overall = budgets?.find((b) => !b.category_l1);
  const budgetAmount = overall?.amount;
  const spending = stats?.total ?? 0;
  const percent = budgetAmount ? Math.min(Math.round((spending / budgetAmount) * 100), 100) : 0;
  const overspent = budgetAmount ? spending > budgetAmount : false;

  const handlePrev = () => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() - 1); setMonth(d.toISOString().slice(0, 7)); };
  const handleNext = () => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() + 1); setMonth(d.toISOString().slice(0, 7)); };

  const openEdit = () => { setInputValue(budgetAmount ? String(budgetAmount) : ''); setEditOpen(true); };

  const handleSave = async () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount <= 0) { Toast.show('请输入有效金额'); return; }
    try {
      await setBudget.mutateAsync({ month, amount });
      Toast.show('已保存');
      setEditOpen(false);
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0' }}>
      <NavBar onBack={() => window.history.back()}>预算管理</NavBar>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <LeftOutline onClick={handlePrev} style={{ fontSize: 18, color: '#666' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{month}</span>
          <RightOutline onClick={handleNext} style={{ fontSize: 18, color: '#666' }} />
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><SpinLoading /></div>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>每月预算</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: overspent ? '#FF4D4F' : '#FF8C42' }}>
                {budgetAmount ? `¥${budgetAmount.toLocaleString()}` : '未设置'}
              </div>
              {budgetAmount && (
                <div style={{ marginTop: 12, padding: '0 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 4 }}>
                    <span>已支出 ¥{spending.toLocaleString()}</span>
                    <span>{percent}%</span>
                  </div>
                  <ProgressBar percent={percent} style={{ '--fill-color': overspent ? '#FF4D4F' : '#FF8C42' } as Record<string, string>} />
                  {overspent && <div style={{ fontSize: 12, color: '#FF4D4F', marginTop: 4 }}>已超支 ¥{(spending - budgetAmount).toLocaleString()}</div>}
                </div>
              )}
              {isAdmin && (
                <Button size="small" color="primary" fill="none" style={{ marginTop: 12 }} onClick={openEdit}>
                  {budgetAmount ? '修改预算' : '设置预算'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <Dialog
        visible={editOpen}
        title={budgetAmount ? '修改预算' : '设置预算'}
        content={
          <div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>每月预算金额</div>
            <Input
              type="number"
              value={inputValue}
              onChange={(v) => setInputValue(v)}
              placeholder="输入预算金额"
              style={{ '--font-size': '16px' } as Record<string, string>}
            />
          </div>
        }
        actions={[
          { key: 'cancel', text: '取消', onClick: () => setEditOpen(false) },
          { key: 'save', text: '保存', bold: true, onClick: handleSave },
        ]}
      />
    </div>
  );
}
