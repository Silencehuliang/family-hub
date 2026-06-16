import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, SpinLoading, Tag, Card, Empty } from 'antd-mobile';
import { AddOutline, LeftOutline, RightOutline } from 'antd-mobile-icons';
import dayjs from 'dayjs';
import { useCalendar } from './api';
import type { EventItem } from '@family-hub/shared';
import { BRAND_COLOR } from '@family-hub/shared';

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

export function CalendarPageMobile() {
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

  return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NavBar
        style={{ '--border-bottom': 'none', background: BRAND_COLOR, color: '#fff' }}
        right={<AddOutline style={{ fontSize: 20 }} onClick={() => navigate('/calendar/new')} />}
      >日程</NavBar>

      <div style={{ padding: 12, background: '#fff', margin: 12, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <LeftOutline style={{ fontSize: 20, color: '#666' }} onClick={() => setCurrent(c => c.subtract(1, 'month'))} />
          <span style={{ fontWeight: 600, fontSize: 16 }}>{current.format('YYYY年M月')}</span>
          <RightOutline style={{ fontSize: 20, color: '#666' }} onClick={() => setCurrent(c => c.add(1, 'month'))} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading /></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {WEEK_DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#888', fontWeight: 600, padding: '4px 0' }}>{d}</div>
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
                      textAlign: 'center', padding: '2px 0', minHeight: 36, cursor: 'pointer',
                      background: isSelected ? BRAND_COLOR + '20' : 'transparent',
                      borderRadius: 8, opacity: cell.isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    <span style={{
                      display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: '50%',
                      background: isToday ? BRAND_COLOR : undefined, color: isToday ? '#fff' : '#333',
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                    }}>{cell.date.date()}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 1 }}>
                        {dayEvents.slice(0, 2).map(e => (
                          <div key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', background: getEventColor(e.type) }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedDay && (
        <div style={{ padding: '0 12px 12px' }}>
          <Card style={{ borderRadius: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{selectedDay.format('M月D日 dddd')}</div>
            {selectedEvents.length === 0 ? (
              <Empty description="当天无日程" />
            ) : (
              selectedEvents.map(e => (
                <div key={e.id} onClick={() => navigate(`/calendar/${e.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}
                >
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: getEventColor(e.type), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{e.title}</span>
                    <div>
                      <Tag color={getEventColor(e.type)} style={{ fontSize: 10, borderRadius: 4 }}>{e.type}</Tag>
                      {e.allDay && <Tag style={{ fontSize: 10, borderRadius: 4 }}>全天</Tag>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
