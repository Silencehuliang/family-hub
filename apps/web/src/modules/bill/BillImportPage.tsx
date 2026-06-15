/**
 * 导入页面
 * 上传 CSV → 预览 → 校验结果 → 确认导入
 */
import { useState } from 'react';
import { Typography, Upload, Button, Table, Alert, Space, message, Card } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useImportCsv, useConfirmImport } from './api';

const { Title, Paragraph } = Typography;

interface ImportRow {
  billDate: string;
  amount: number;
  categoryL1: string;
  categoryL2: string;
  payerName: string;
  note?: string;
  errors?: string[];
}

export function BillImportPage() {
  const navigate = useNavigate();
  const importCsv = useImportCsv();
  const confirmImport = useConfirmImport();

  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<{
    total: number;
    validCount: number;
    invalidCount: number;
    valid: ImportRow[];
    invalid: ImportRow[];
  } | null>(null);

  // 上传 CSV
  const handleUpload = async (file: File) => {
    const text = await file.text();
    try {
      const data = await importCsv.mutateAsync(text);
      setResult(data);
      setStep('preview');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '解析失败');
    }
    return false; // 阻止 antd 自动上传
  };

  // 确认导入
  const handleConfirm = async () => {
    if (!result) return;
    try {
      const res = await confirmImport.mutateAsync({ rows: result.valid, skipFailed: true });
      message.success(`导入完成：成功 ${(res as { success: number }).success} 笔`);
      setStep('done');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '导入失败');
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const csv = '日期,金额,一级分类,二级分类,付款人,备注\n2026-06-15,35,餐饮,三餐,爸爸,午餐\n2026-06-14,128.5,日常用品,纸品清洁,妈妈,周末采购';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '账单导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>📥 导入账单</Title>

      {/* 步骤 1: 上传 */}
      {step === 'upload' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Paragraph type="secondary">
              支持 CSV 格式，首行为表头。请先下载模板查看字段格式。
            </Paragraph>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              下载导入模板
            </Button>
          </Card>

          <Upload
            accept=".csv"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />} loading={importCsv.isPending}>
              选择 CSV 文件
            </Button>
          </Upload>
        </>
      )}

      {/* 步骤 2: 预览 */}
      {step === 'preview' && result && (
        <>
          <Alert
            type={result.invalidCount > 0 ? 'warning' : 'success'}
            message={`共 ${result.total} 行：${result.validCount} 行可导入，${result.invalidCount} 行有错误`}
            style={{ marginBottom: 16 }}
          />

          {result.validCount > 0 && (
            <>
              <Title level={5}>可导入数据</Title>
              <Table
                size="small"
                dataSource={result.valid}
                rowKey={(_, i) => String(i)}
                pagination={false}
                columns={[
                  { title: '日期', dataIndex: 'billDate', width: 100 },
                  { title: '金额', dataIndex: 'amount', width: 80, render: (v: number) => `¥${v}` },
                  { title: '分类', dataIndex: 'categoryL1' },
                  { title: '付款人', dataIndex: 'payerName', width: 80 },
                  { title: '备注', dataIndex: 'note', ellipsis: true },
                ]}
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          {result.invalidCount > 0 && (
            <>
              <Title level={5}>错误数据</Title>
              <Table
                size="small"
                dataSource={result.invalid}
                rowKey={(_, i) => String(i)}
                pagination={false}
                columns={[
                  { title: '日期', dataIndex: 'billDate', width: 100 },
                  { title: '金额', dataIndex: 'amount', width: 80 },
                  { title: '错误', dataIndex: 'errors', render: (v: string[]) => v?.join('；') },
                ]}
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          <Space>
            <Button type="primary" loading={confirmImport.isPending} onClick={handleConfirm}>
              确认导入 {result.validCount} 笔
            </Button>
            <Button onClick={() => { setStep('upload'); setResult(null); }}>重新选择</Button>
          </Space>
        </>
      )}

      {/* 步骤 3: 完成 */}
      {step === 'done' && (
        <Card>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <Title level={4}>导入完成</Title>
            <Button type="primary" onClick={() => navigate('/bill')}>查看账单</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
