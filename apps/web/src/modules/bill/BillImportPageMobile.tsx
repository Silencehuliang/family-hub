import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Card, Toast, Tag } from 'antd-mobile';
import { DownlandOutline } from 'antd-mobile-icons';
import { useImportCsv, useConfirmImport } from './api';
import { BRAND_COLOR } from '@family-hub/shared';

interface ImportRow { billDate: string; amount: number; categoryL1: string; categoryL2: string; payerName: string; note?: string; errors?: string[] }

export function BillImportPageMobile() {
  const navigate = useNavigate();
  const importCsv = useImportCsv();
  const confirmImport = useConfirmImport();
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<{ total: number; validCount: number; invalidCount: number; valid: ImportRow[]; invalid: ImportRow[] } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = await importCsv.mutateAsync(text);
      setResult(data);
      setStep('preview');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : '解析失败');
    }
  };

  const handleConfirm = async () => {
    if (!result) return;
    try {
      const res = await confirmImport.mutateAsync({ rows: result.valid, skipFailed: true });
      Toast.show(`导入完成：成功 ${(res as { success: number }).success} 笔`);
      setStep('done');
    } catch (err: unknown) { Toast.show(err instanceof Error ? err.message : '导入失败'); }
  };

  const handleDownloadTemplate = () => {
    const csv = '日期,金额,一级分类,二级分类,付款人,备注\n2026-06-15,35,餐饮,三餐,爸爸,午餐\n2026-06-14,128.5,日常用品,纸品清洁,妈妈,周末采购';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '账单导入模板.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }} onBack={() => navigate(-1)}>
        导入账单
      </NavBar>

      <div style={{ padding: 16 }}>
        {step === 'upload' && (
          <>
            <Card style={{ borderRadius: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>支持 CSV 格式，首行为表头。请先下载模板查看字段格式。</div>
              <Button block fill="outline" onClick={handleDownloadTemplate}><DownlandOutline /> 下载导入模板</Button>
            </Card>

            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button block color="primary" loading={importCsv.isPending} onClick={() => document.getElementById('csv-upload')?.click()}>
              选择 CSV 文件
            </Button>
          </>
        )}

        {step === 'preview' && result && (
          <>
            <Tag color={result.invalidCount > 0 ? 'warning' : 'success'} style={{ marginBottom: 12 }}>
              共 {result.total} 行：{result.validCount} 行可导入，{result.invalidCount} 行有错误
            </Tag>

            {result.validCount > 0 && (
              <Card style={{ borderRadius: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>可导入数据</div>
                {result.valid.slice(0, 20).map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span>{row.billDate} · {row.categoryL1}</span>
                    <span style={{ color: '#FF4D4F' }}>¥{row.amount}</span>
                  </div>
                ))}
              </Card>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button block color="primary" loading={confirmImport.isPending} onClick={handleConfirm}>
                确认导入 {result.validCount} 笔
              </Button>
              <Button block fill="outline" onClick={() => { setStep('upload'); setResult(null); }}>重新选择</Button>
            </div>
          </>
        )}

        {step === 'done' && (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>导入完成</div>
            <Button block color="primary" onClick={() => navigate('/bill')}>查看账单</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
