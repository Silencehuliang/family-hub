/**
 * 账单统计页
 * 总览/趋势/结构/成员/标签 Tab 切换
 */
import { useState, useRef, useEffect } from 'react';
import { Typography, Card, Tabs, Progress, List, Empty } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useBillStats } from './api';
import * as echarts from 'echarts';

const { Title, Text } = Typography;

export function BillStatsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: stats } = useBillStats(month);

  const prevMonth = () => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>📊 统计</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LeftOutlined onClick={prevMonth} style={{ cursor: 'pointer' }} />
          <Text strong>{month}</Text>
          <RightOutlined onClick={nextMonth} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* 总览卡片 */}
      <Card style={{ marginBottom: 12 }}>
        <Text type="secondary">总支出</Text>
        <Title level={3} style={{ margin: '4px 0' }}>¥{(stats?.total ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Title>
        <Text type="secondary">日均 ¥{(stats?.dailyAvg ?? 0).toFixed(2)}</Text>
      </Card>

      {/* 预算进度 */}
      {stats?.budget && stats.budget.length > 0 && (
        <Card title="预算" size="small" style={{ marginBottom: 12 }}>
          {stats.budget.map((b, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{b.name}</Text>
                <Text type={b.overspent ? 'danger' : undefined}>
                  ¥{b.used.toLocaleString()} / ¥{b.amount.toLocaleString()}
                </Text>
              </div>
              <Progress
                percent={Math.min(Math.round((b.used / b.amount) * 100), 100)}
                strokeColor={b.overspent ? '#FF4D4F' : '#FF8C42'}
                showInfo={false}
              />
            </div>
          ))}
        </Card>
      )}

      {/* Tab 切换 */}
      <Tabs
        items={[
          { key: 'category', label: '分类', children: <CategoryChart data={stats?.byCategory ?? []} /> },
          { key: 'trend', label: '趋势', children: <TrendChart data={stats?.trend ?? []} /> },
          { key: 'member', label: '成员', children: <MemberList data={stats?.byMember ?? []} total={stats?.total ?? 0} /> },
          { key: 'tag', label: '标签', children: <TagList data={stats?.byTag ?? []} /> },
        ]}
      />
    </div>
  );
}

/** 分类饼图 */
function CategoryChart({ data }: { data: Array<{ name: string; icon: string; color: string; amount: number; percent: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.map((d) => ({ name: `${d.icon} ${d.name}`, value: d.amount, itemStyle: { color: d.color } })),
        label: { formatter: '{b}\n{d}%', fontSize: 11 },
      }],
    });
    return () => chartInstance.current?.dispose();
  }, [data]);

  if (data.length === 0) return <Empty description="暂无数据" />;

  return (
    <>
      <div ref={chartRef} style={{ height: 240 }} />
      <List
        size="small"
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <Text>{item.icon} {item.name}</Text>
            <Text>¥{item.amount.toFixed(2)} ({item.percent}%)</Text>
          </List.Item>
        )}
      />
    </>
  );
}

/** 趋势折线图 */
function TrendChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((d) => d.month) },
      yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
      series: [{
        type: 'line',
        data: data.map((d) => d.amount),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#FF8C42' },
      }],
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
    });
    return () => chart.dispose();
  }, [data]);

  if (data.length === 0) return <Empty description="暂无数据" />;
  return <div ref={chartRef} style={{ height: 240 }} />;
}

/** 成员排行 */
function MemberList({ data, total }: { data: Array<{ nickname: string; amount: number }>; total: number }) {
  if (data.length === 0) return <Empty description="暂无数据" />;
  return (
    <List
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <Text>{item.nickname}</Text>
          <div style={{ textAlign: 'right' }}>
            <Text strong>¥{item.amount.toFixed(2)}</Text>
            <br />
            <Text type="secondary">{total > 0 ? Math.round((item.amount / total) * 100) : 0}%</Text>
          </div>
        </List.Item>
      )}
    />
  );
}

/** 标签排行 */
function TagList({ data }: { data: Array<{ name: string; amount: number }> }) {
  if (data.length === 0) return <Empty description="暂无数据" />;
  return (
    <List
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <Text>🏷️ {item.name}</Text>
          <Text strong>¥{item.amount.toFixed(2)}</Text>
        </List.Item>
      )}
    />
  );
}
