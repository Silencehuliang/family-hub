import { useState, useMemo, useCallback } from 'react';
import { Button, Spin, Empty, Tag, Typography, Card } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCalendar } from './api';
import type { EventItem } from '@family-hub/shared';

const { Text, Title } = Typography;

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const EVENT_COLORS: Record<string, string> = {
  birthday: '#FF6B6B', anniversary: '#FF8C42', medical: '#4ECDC4',
  bill: '#45B7D1', travel: '#96CEB4', id_expiring: '#F4D03F', other: '#DDA0DD',
};

function getEventColor(type: string): string { return EVENT_COLORS[type] ?? '#DDA0DD'; }
function getDateStr(d: dayjs.Dayjs): string { return d.format('YYYY-MM-DD'); }

function eventsForDay(events: EventItem[], day: dayjs.Dayjs): EventItem[] {
  const dayStart = day.startOf('day').unix();
  const dayEnd = day.endOf('day').unix();
  return events.filter(e => {
    if (e.allDay) return dayjs.unix(e.startAt).format('YYYY-MM-DD') === getDateStr(day);
    return e.startAt >= dayStart && e.startAt <= dayEnd;
  });
}

export function CalendarPageDesktop() {
  const navigate = useNavigate();
  const today = dayjs();
  const [current, setCurrent] = useState(dayjs().startOf('month'));
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null);
  const monthKey = current.format('YYYY-MM');
  const { data: events, isLoading } = useCalendar(monthKey);

  const grid = useMemo(() => {
    const start = current.startOf('month');
    const end = current.endOf('month');
    const startDow = start.day();
    const cells: Array<{ date: dayjs.Dayjs; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < startDow; i++) cells.push({ date: start.subtract(startDow - i, 'day'), isCurrentMonth: false });
    for (let d = 1; d <= current.daysInMonth(); d++) cells.push({ date: start.date(d), isCurrentMonth: true });
    const remaining = 7 - (cells.length % 7 || 7);
    for (let i = 1; i <= remaining; i++) cells.push({ date: end.add(i, 'day'), isCurrentMonth: false });
    return cells;
  }, [current]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay || !events) return [];
    return eventsForDay(events, selectedDay);
  }, [selectedDay, events]);

  const prevMonth = useCallback(() => setCurrent(c => c.subtract(1, 'month')), []);
  const nextMonth = useCallback(() => setCurrent(c => c.add(1, 'month')), []);

  return (
    <div style={{ padding: 16, maxWidth: 768, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>日程</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/calendar/new')}>新建</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Button type="text" icon={<LeftOutlined />} onClick={prevMonth} />
        <Text strong style={{ fontSize: 16 }}>{current.format('YYYY年M月')}</Text>
        <Button type="text" icon={<RightOutlined />} onClick={nextMonth} />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
            {WEEK_DAYS.map(d => (
              <div key={d} style={{ background: '#fafafa', textAlign: 'center', padding: '8px 4px', fontWeight: 600, fontSize: 12, color: '#888' }}>{d}</div>
            ))}
            {grid.map((cell, i) => {
              const dayEvents = events ? eventsForDay(events, cell.date) : [];
              const isToday = getDateStr(cell.date) === getDateStr(today);
              const isSelected = selectedDay && getDateStr(selectedDay) === getDateStr(cell.date);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(cell.date)}
                  style={{
                    background: cell.isCurrentMonth ? '#fff' : '#f9f9f9', minHeight: 64, padding: 4, cursor: 'pointer',
                    borderBottom: isSelected ? '2px solid #1677ff' : undefined, opacity: cell.isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 2 }}>
                    <span style={{ display: 'inline-block', width: 24, height: 24, lineHeight: '24px', borderRadius: '50%', background: isToday ? '#1677ff' : undefined, color: isToday ? '#fff' : undefined, fontSize: 12, fontWeight: isToday ? 700 : 400 }}>
                      {cell.date.date()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); navigate(`/calendar/${e.id}`); }}
                        style={{ fontSize: 10, padding: '1px 3px', borderRadius: 3, background: getEventColor(e.type) + '30', color: getEventColor(e.type), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >{e.title}</div>
                    ))}
                    {dayEvents.length > 2 && <Text style={{ fontSize: 10, textAlign: 'center', color: '#999' }}>+{dayEvents.length - 2}</Text>}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDay && (
            <Card style={{ marginTop: 16 }} size="small" title={selectedDay.format('M月D日 dddd')}>
              {selectedEvents.length === 0 ? (
                <Empty description="当天无日程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                selectedEvents.map(e => (
                  <div key={e.id} onClick={() => navigate(`/calendar/${e.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  >
                    <div style={{ width: 4, height: 32, borderRadius: 2, background: getEventColor(e.type), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 14 }}>{e.title}</Text>
                      <div>
                        <Tag color={getEventColor(e.type)} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{e.type}</Tag>
                        {e.allDay && <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>全天</Tag>}
                        {e.location && <Text type="secondary" style={{ fontSize: 12 }}>{e.location}</Text>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
