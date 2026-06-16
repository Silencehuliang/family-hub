import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Input, Button, Tag, Toast, DatePicker } from 'antd-mobile';
import { useCreateBill, useUpdateBill, useBill, useCategoryTree, useTags } from './api';
import { useAuthStore } from '@/core/auth/store';
import type { BillCategory } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';
import dayjs from 'dayjs';

export function BillEditPageMobile() {
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
  const [billDate, setBillDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateVisible, setDateVisible] = useState(false);

  useEffect(() => {
    if (existingBill) {
      setAmount(existingBill.amount.toString());
      setSelectedL1(existingBill.categoryL1);
      setSelectedL2(existingBill.categoryL2);
      setBillDate(existingBill.billDate);
      setNote(existingBill.note ?? '');
      setSelectedTags(existingBill.tags?.map((t) => t.id) ?? []);
    }
  }, [existingBill]);

  const handleSelectL1 = (cat: BillCategory) => {
    setSelectedL1(cat.id); setSelectedL2(null); setShowL2Picker(true);
  };

  const handleSelectL2 = (cat: BillCategory) => {
    setSelectedL2(cat.id); setShowL2Picker(false);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { Toast.show('请输入有效金额'); return; }
    if (!selectedL1 || !selectedL2) { Toast.show('请选择分类'); return; }
    try {
      if (isEdit && id) {
        await updateBill.mutateAsync({ id, amount: amountNum, categoryL1: selectedL1, categoryL2: selectedL2, payerId: member?.id ?? '', billDate, note: note || undefined, tags: selectedTags });
        Toast.show('已更新');
      } else {
        await createBill.mutateAsync({ amount: amountNum, categoryL1: selectedL1, categoryL2: selectedL2, payerId: member?.id ?? '', billDate, note: note || undefined, tags: selectedTags });
        Toast.show('已记录');
      }
      navigate('/bill');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '操作失败'); }
  };

  const l1Categories = catTree?.l1 ?? [];
  const l2Categories = catTree?.l2.filter((c) => c.parentId === selectedL1) ?? [];
  const selectedL1Cat = l1Categories.find((c) => c.id === selectedL1);
  const selectedL2Cat = catTree?.l2.find((c) => c.id === selectedL2);

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        {isEdit ? '编辑账单' : '记一笔'}
      </NavBar>

      <div style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <div style={{ fontSize: 12, color: '#999' }}>金额</div>
          <Input
            type="number"
            value={amount}
            onChange={(v) => setAmount(v)}
            placeholder="0.00"
            style={{ '--font-size': '28px', textAlign: 'center' }}
            autoFocus={!isEdit}
          />
        </div>

        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>选择分类</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {l1Categories.filter((c) => !c.hidden).map((cat) => (
            <div key={cat.id} onClick={() => handleSelectL1(cat)}
              style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: selectedL1 === cat.id ? `${cat.color}20` : '#fff', border: selectedL1 === cat.id ? `2px solid ${cat.color}` : '1px solid #eee' }}
            >
              <div style={{ fontSize: 22 }}>{cat.icon}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{cat.name}</div>
            </div>
          ))}
        </div>

        {showL2Picker && l2Categories.length > 0 && (
          <div style={{ marginBottom: 12, padding: 12, background: '#fff', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{selectedL1Cat?.icon} {selectedL1Cat?.name} - 选择子分类</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {l2Categories.map((cat) => (
                <Tag key={cat.id} color={selectedL2 === cat.id ? selectedL1Cat?.color : 'default'} style={{ cursor: 'pointer', borderRadius: 8 }} onClick={() => handleSelectL2(cat)}>{cat.icon} {cat.name}</Tag>
              ))}
            </div>
          </div>
        )}

        {selectedL1Cat && selectedL2Cat && !showL2Picker && (
          <div style={{ marginBottom: 12, padding: 8, background: `${selectedL1Cat.color}10`, borderRadius: 8 }}>
            <Tag color={selectedL1Cat.color} style={{ borderRadius: 4 }}>{selectedL1Cat.icon} {selectedL1Cat.name} / {selectedL2Cat.icon} {selectedL2Cat.name}</Tag>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>日期</div>
          <div
            style={{ padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #eee', cursor: 'pointer' }}
            onClick={() => setDateVisible(true)}
          >{billDate}</div>
          <DatePicker
            visible={dateVisible}
            onClose={() => setDateVisible(false)}
            onConfirm={(v) => { setBillDate(dayjs(v).format('YYYY-MM-DD')); setDateVisible(false); }}
          />
        </div>

        {tags.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.filter((t) => !t.archived).map((tag) => (
                <Tag
                  key={tag.id}
                  color={selectedTags.includes(tag.id) ? tag.color : 'default'}
                  style={{ borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => setSelectedTags((prev) => prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id])}
                >{tag.name}</Tag>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>备注</div>
          <Input placeholder="可选备注" value={note} onChange={(v) => setNote(v)} />
        </div>

        <Button block color="primary" size="large" loading={createBill.isPending || updateBill.isPending} onClick={handleSubmit}>
          {isEdit ? '保存修改' : '记一笔'}
        </Button>
      </div>
    </div>
  );
}
