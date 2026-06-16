import { useState, useRef, useEffect } from 'react';
import { NavBar, Card, ProgressBar, Tabs, Empty } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import { useBillStats } from './api';
import * as echarts from 'echarts';
import { BRAND_COLOR } from '@family-hub/shared';

export function BillStatsPageMobile() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: stats } = useBillStats(month);

  const adjustMonth = (delta: number) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
  };

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        onBack={() => window.history.back()}
      >📊 统计</NavBar>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <LeftOutline style={{ fontSize: 18 }} onClick={() => adjustMonth(-1)} />
          <span style={{ fontWeight: 600 }}>{month}</span>
          <RightOutline style={{ fontSize: 18 }} onClick={() => adjustMonth(1)} />
        </div>

        <Card style={{ borderRadius: 16, marginBottom: 12 }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 12, color: '#999' }}>总支出</div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>
              ¥{(stats?.total ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>日均 ¥{(stats?.dailyAvg ?? 0).toFixed(2)}</div>
          </div>
        </Card>

        {stats?.budget && stats.budget.length > 0 && (
          <Card style={{ borderRadius: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>预算</div>
            {stats.budget.map((b, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{b.name}</span>
                  <span style={{ color: b.overspent ? '#FF4D4F' : '#333' }}>
                    ¥{b.used.toLocaleString()} / ¥{b.amount.toLocaleString()}
                  </span>
                </div>
                <ProgressBar percent={Math.min(Math.round((b.used / b.amount) * 100), 100)} style={{ '--fill-color': b.overspent ? '#FF4D4F' : BRAND_COLOR }} />
              </div>
            ))}
          </Card>
        )}

        <Tabs>
          <Tabs.Tab title="分类" key="category">
            <CategoryChart data={stats?.byCategory ?? []} />
          </Tabs.Tab>
          <Tabs.Tab title="趋势" key="trend">
            <TrendChart data={stats?.trend ?? []} />
          </Tabs.Tab>
          <Tabs.Tab title="成员" key="member">
            <MemberList data={stats?.byMember ?? []} total={stats?.total ?? 0} />
          </Tabs.Tab>
          <Tabs.Tab title="标签" key="tag">
            <TagList data={stats?.byTag ?? []} />
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
}

function CategoryChart({ data }: { data: Array<{ name: string; icon: string; color: string; amount: number; percent: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({ tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' }, series: [{ type: 'pie', radius: ['40%', '70%'], data: data.map((d) => ({ name: `${d.icon} ${d.name}`, value: d.amount, itemStyle: { color: d.color } })) }] });
    return () => chart.dispose();
  }, [data]);
  if (data.length === 0) return <Empty />;
  return <div ref={chartRef} style={{ height: 240 }} />;
}

function TrendChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: data.map((d) => d.month) }, yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } }, series: [{ type: 'line', data: data.map((d) => d.amount), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: BRAND_COLOR } }], grid: { left: 50, right: 20, top: 20, bottom: 30 } });
    return () => chart.dispose();
  }, [data]);
  if (data.length === 0) return <Empty />;
  return <div ref={chartRef} style={{ height: 240 }} />;
}

function MemberList({ data, total }: { data: Array<{ nickname: string; amount: number }>; total: number }) {
  if (data.length === 0) return <Empty />;
  return <div>{data.map((item, i) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span>{item.nickname}</span>
      <span style={{ fontWeight: 600 }}>¥{item.amount.toFixed(2)} <span style={{ fontWeight: 400, color: '#999' }}>{total > 0 ? Math.round((item.amount / total) * 100) : 0}%</span></span>
    </div>
  ))}</div>;
}

function TagList({ data }: { data: Array<{ name: string; amount: number }> }) {
  if (data.length === 0) return <Empty />;
  return <div>{data.map((item, i) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span>🏷️ {item.name}</span>
      <span style={{ fontWeight: 600 }}>¥{item.amount.toFixed(2)}</span>
    </div>
  ))}</div>;
}
