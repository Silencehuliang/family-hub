import { useState } from 'react';
import { Typography, Card, Progress, Button, Modal, InputNumber, message, Spin } from 'antd';
import { LeftOutlined, RightOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { useBudgets, useSetBudget, useBillStats } from './api';
import { useAuthStore } from '@/core/auth/store';
import { BRAND_COLOR } from '@family-hub/shared';

const { Title, Text } = Typography;

export function BudgetPageDesktop() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modalOpen, setModalOpen] = useState(false);
  const [inputAmount, setInputAmount] = useState<number | null>(null);
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

  const openModal = () => { setInputAmount(budgetAmount ?? null); setModalOpen(true); };

  const handleSave = async () => {
    if (!inputAmount || inputAmount <= 0) { message.error('请输入有效金额'); return; }
    try {
      await setBudget.mutateAsync({ month, amount: inputAmount });
      message.success('已保存');
      setModalOpen(false);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>预算管理</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LeftOutlined onClick={handlePrev} style={{ cursor: 'pointer' }} />
          <Text strong>{month}</Text>
          <RightOutlined onClick={handleNext} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Text type="secondary">每月预算</Text>
            <Title level={2} style={{ margin: '8px 0', color: overspent ? '#FF4D4F' : BRAND_COLOR }}>
              {budgetAmount ? `¥${budgetAmount.toLocaleString()}` : '未设置'}
            </Title>
            {budgetAmount && (
              <div style={{ maxWidth: 320, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary">已支出 ¥{spending.toLocaleString()}</Text>
                  <Text type="secondary">{percent}%</Text>
                </div>
                <Progress percent={percent} strokeColor={overspent ? '#FF4D4F' : BRAND_COLOR} showInfo={false} />
                {overspent && <Text type="danger" style={{ display: 'block', marginTop: 4 }}>已超支 ¥{(spending - budgetAmount).toLocaleString()}</Text>}
              </div>
            )}
            {isAdmin && (
              <Button type="primary" icon={budgetAmount ? <EditOutlined /> : <SettingOutlined />} style={{ marginTop: 16 }} onClick={openModal}>
                {budgetAmount ? '修改预算' : '设置预算'}
              </Button>
            )}
          </div>
        </Card>
      )}

      <Modal title="设置预算" open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" confirmLoading={setBudget.isPending}>
        <div style={{ marginBottom: 8 }}>每月预算金额</div>
        <InputNumber
          value={inputAmount}
          onChange={(v) => setInputAmount(v ?? null)}
          min={1}
          max={10_000_000}
          prefix="¥"
          style={{ width: '100%' }}
          placeholder="输入预算金额"
        />
      </Modal>
    </div>
  );
}
