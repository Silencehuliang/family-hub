/**
 * 记账/编辑页
 * 金额键盘 + 分类宫格 + 二级选择 + 标签 + 日期 + 备注
 */
import { useState, useEffect } from 'react';
import { Button, Input, DatePicker, Space, Tag, message, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateBill, useUpdateBill, useBill, useCategoryTree, useTags } from './api';
import { useAuthStore } from '@/core/auth/store';
import type { BillCategory } from '@family-hub/shared';
import dayjs from 'dayjs';

const { Text } = Typography;

export function BillEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { member } = useAuthStore();

  const { data: existingBill } = useBill(id ?? '');
  const { data: catTree } = useCategoryTree();
  const { data: tags = [] } = useTags();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const [amount, setAmount] = useState('');
  const [selectedL1, setSelectedL1] = useState<string | null>(null);
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [showL2Picker, setShowL2Picker] = useState(false);
  const [payerId, setPayerId] = useState(member?.id ?? '');
  const [billDate, setBillDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 编辑模式回填
  useEffect(() => {
    if (existingBill) {
      setAmount(existingBill.amount.toString());
      setSelectedL1(existingBill.categoryL1);
      setSelectedL2(existingBill.categoryL2);
      setPayerId(existingBill.payerId);
      setBillDate(existingBill.billDate);
      setNote(existingBill.note ?? '');
      setSelectedTags(existingBill.tags?.map((t) => t.id) ?? []);
    }
  }, [existingBill]);

  // 选一级分类 → 弹出二级选择
  const handleSelectL1 = (cat: BillCategory) => {
    setSelectedL1(cat.id);
    setSelectedL2(null);
    setShowL2Picker(true);
  };

  // 选二级分类
  const handleSelectL2 = (cat: BillCategory) => {
    setSelectedL2(cat.id);
    setShowL2Picker(false);
  };

  // 提交
  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { message.error('请输入有效金额'); return; }
    if (!selectedL1 || !selectedL2) { message.error('请选择分类'); return; }

    try {
      if (isEdit && id) {
        await updateBill.mutateAsync({
          id,
          amount: amountNum,
          categoryL1: selectedL1,
          categoryL2: selectedL2,
          payerId,
          billDate,
          note: note || undefined,
          tags: selectedTags,
        });
        message.success('已更新');
      } else {
        await createBill.mutateAsync({
          amount: amountNum,
          categoryL1: selectedL1,
          categoryL2: selectedL2,
          payerId,
          billDate,
          note: note || undefined,
          tags: selectedTags,
        });
        message.success('已记录');
      }
      navigate('/bill');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const l1Categories = catTree?.l1 ?? [];
  const l2Categories = catTree?.l2.filter((c) => c.parentId === selectedL1) ?? [];
  const selectedL1Cat = l1Categories.find((c) => c.id === selectedL1);
  const selectedL2Cat = catTree?.l2.find((c) => c.id === selectedL2);

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Typography.Title level={4}>{isEdit ? '编辑账单' : '记一笔'}</Typography.Title>

      {/* 金额 */}
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Text type="secondary">金额</Text>
        <Input
          prefix="¥"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="0.00"
          style={{ fontSize: 28, textAlign: 'center' }}
          size="large"
          autoFocus={!isEdit}
        />
      </div>

      {/* 一级分类宫格 */}
      <Text type="secondary">选择分类</Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '8px 0' }}>
        {l1Categories.filter((c) => !c.hidden).map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleSelectL1(cat)}
            style={{
              textAlign: 'center',
              padding: '8px 4px',
              borderRadius: 8,
              cursor: 'pointer',
              background: selectedL1 === cat.id ? `${cat.color}20` : '#f5f5f5',
              border: selectedL1 === cat.id ? `2px solid ${cat.color}` : '2px solid transparent',
            }}
          >
            <div style={{ fontSize: 24 }}>{cat.icon}</div>
            <Text style={{ fontSize: 11 }}>{cat.name}</Text>
          </div>
        ))}
      </div>

      {/* 二级分类选择 */}
      {showL2Picker && l2Categories.length > 0 && (
        <div style={{ margin: '12px 0', padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
          <Text type="secondary">{selectedL1Cat?.icon} {selectedL1Cat?.name} - 选择子分类</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {l2Categories.map((cat) => (
              <Tag
                key={cat.id}
                color={selectedL2 === cat.id ? selectedL1Cat?.color : undefined}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => handleSelectL2(cat)}
              >
                {cat.icon} {cat.name}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* 已选分类显示 */}
      {selectedL1Cat && selectedL2Cat && !showL2Picker && (
        <div style={{ margin: '8px 0', padding: 8, background: `${selectedL1Cat.color}10`, borderRadius: 8 }}>
          <Tag color={selectedL1Cat.color}>{selectedL1Cat.icon} {selectedL1Cat.name} / {selectedL2Cat.icon} {selectedL2Cat.name}</Tag>
        </div>
      )}

      {/* 日期 */}
      <div style={{ margin: '12px 0' }}>
        <Text type="secondary">日期</Text>
        <DatePicker
          value={dayjs(billDate)}
          onChange={(d) => d && setBillDate(d.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
          size="large"
        />
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <Text type="secondary">标签</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {tags.filter((t) => !t.archived).map((tag) => (
              <Tag.CheckableTag
                key={tag.id}
                checked={selectedTags.includes(tag.id)}
                onChange={(checked) => {
                  setSelectedTags((prev) => checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id));
                }}
              >
                {tag.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>
      )}

      {/* 备注 */}
      <div style={{ margin: '12px 0' }}>
        <Text type="secondary">备注</Text>
        <Input.TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="可选备注"
          maxLength={200}
          rows={2}
        />
      </div>

      {/* 提交 */}
      <Space style={{ marginTop: 16, width: '100%' }} direction="vertical">
        <Button
          type="primary"
          size="large"
          block
          loading={createBill.isPending || updateBill.isPending}
          onClick={handleSubmit}
        >
          {isEdit ? '保存修改' : '记一笔'}
        </Button>
        <Button block onClick={() => navigate(-1)}>取消</Button>
      </Space>
    </div>
  );
}
