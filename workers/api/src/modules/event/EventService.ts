import { ErrorCode } from '@family-hub/shared';
import type { EventItem, EventParticipant, EventReminder } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, batchExecute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';
import { camelCase, camelCaseAll } from '../../utils/mapper';

interface EventRow {
  id: string;
  family_id: string;
  title: string;
  type: string;
  start_at: number;
  end_at: number | null;
  all_day: number;
  location: string | null;
  note: string | null;
  repeat_rule: string | null;
  created_by: string;
  created_at: number;
}

export class EventService {
  constructor(private db: D1Database) {}

  async calendar(familyId: string, month: string): Promise<EventItem[]> {
    const [yearStr, monthNumStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthNumStr);

    const monthStart = Math.floor(new Date(year, monthNum - 1, 1).getTime() / 1000);
    const monthEnd = Math.floor(new Date(year, monthNum, 1).getTime() / 1000);

    const rawItems = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT * FROM event_item WHERE family_id = ? AND start_at >= ? AND start_at < ? ORDER BY start_at ASC',
      familyId, monthStart, monthEnd,
    );

    const yearlyRaw = await findMany<Record<string, unknown>>(
      this.db,
      "SELECT * FROM event_item WHERE family_id = ? AND repeat_rule = 'yearly'",
      familyId,
    );

    const seenIds = new Set(rawItems.map(r => (r as { id: string }).id));
    for (const yr of yearlyRaw) {
      const d = new Date((yr as { start_at: number }).start_at * 1000);
      if (d.getMonth() + 1 === monthNum && !seenIds.has((yr as { id: string }).id)) {
        rawItems.push(yr);
      }
    }

    if (rawItems.length === 0) return [];

    const items = rawItems.map(r => {
      const item = camelCase<EventItem>(r);
      item.allDay = !!((r as { all_day: number }).all_day);
      return item;
    });

    const eventIds = items.map(r => r.id);
    const placeholders = eventIds.map(() => '?').join(',');

    const participantRows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT ep.event_id, ep.member_id, m.nickname
       FROM event_participant ep JOIN sys_member m ON m.id = ep.member_id
       WHERE ep.event_id IN (${placeholders})`,
      ...eventIds,
    );

    const participantMap = new Map<string, EventParticipant[]>();
    for (const pr of participantRows) {
      const ep = camelCase<EventParticipant>(pr);
      const eid = (pr as { event_id: string }).event_id;
      if (!participantMap.has(eid)) participantMap.set(eid, []);
      participantMap.get(eid)!.push(ep);
    }

    return items.map(item => ({
      ...item,
      note: item.note ?? undefined,
      location: item.location ?? undefined,
      endAt: item.endAt ?? undefined,
      repeatRule: item.repeatRule ?? undefined,
      participants: participantMap.get(item.id) ?? [],
      reminders: [],
    }));
  }

  async getById(id: string, familyId: string): Promise<EventItem> {
    const raw = await findOne<Record<string, unknown>>(
      this.db,
      'SELECT * FROM event_item WHERE id = ? AND family_id = ?',
      id, familyId,
    );
    if (!raw) throw new BizError(ErrorCode.NOT_FOUND, '日程不存在');
    const item = camelCase<EventItem>(raw);
    item.allDay = !!((raw as { all_day: number }).all_day);

    const participantRows = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT ep.event_id, ep.member_id, m.nickname FROM event_participant ep JOIN sys_member m ON m.id = ep.member_id WHERE ep.event_id = ?',
      id,
    );
    const participants = camelCaseAll<EventParticipant>(participantRows);

    const reminderRows = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT id, event_id, offset_minutes FROM event_reminder WHERE event_id = ? ORDER BY offset_minutes ASC',
      id,
    );
    const reminders = camelCaseAll<EventReminder>(reminderRows);

    return {
      ...item,
      note: item.note ?? undefined,
      location: item.location ?? undefined,
      endAt: item.endAt ?? undefined,
      repeatRule: item.repeatRule ?? undefined,
      participants,
      reminders,
    };
  }

  async create(
    familyId: string,
    memberId: string,
    input: {
      title: string;
      type: string;
      startAt: number;
      endAt?: number;
      allDay?: boolean;
      location?: string;
      note?: string;
      repeatRule?: string;
      participantIds?: string[];
      reminderOffsets?: number[];
    },
  ): Promise<EventItem> {
    const id = nanoid();
    const ts = now();

    const stmts: Array<{ sql: string; params: unknown[] }> = [
      {
        sql: `INSERT INTO event_item (id, family_id, title, type, start_at, end_at, all_day, location, note, repeat_rule, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [id, familyId, input.title, input.type, input.startAt, input.endAt ?? null, input.allDay ? 1 : 0, input.location ?? null, input.note ?? null, input.repeatRule ?? null, memberId, ts],
      },
    ];

    if (input.participantIds && input.participantIds.length > 0) {
      for (const pid of input.participantIds) {
        stmts.push({
          sql: 'INSERT INTO event_participant (event_id, member_id) VALUES (?, ?)',
          params: [id, pid],
        });
      }
    }

    if (input.reminderOffsets && input.reminderOffsets.length > 0) {
      for (const offset of input.reminderOffsets) {
        stmts.push({
          sql: 'INSERT INTO event_reminder (id, event_id, offset_minutes) VALUES (?, ?, ?)',
          params: [nanoid(), id, offset],
        });
      }
    }

    await batchExecute(this.db, stmts);
    return this.getById(id, familyId);
  }

  async update(
    id: string,
    familyId: string,
    _memberId: string,
    input: {
      title?: string;
      type?: string;
      startAt?: number;
      endAt?: number;
      allDay?: boolean;
      location?: string;
      note?: string;
      repeatRule?: string;
      participantIds?: string[];
      reminderOffsets?: number[];
    },
  ): Promise<EventItem> {
    const existing = await findOne<EventRow>(
      this.db,
      'SELECT * FROM event_item WHERE id = ? AND family_id = ?',
      id, familyId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '日程不存在');

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.type !== undefined) { sets.push('type = ?'); params.push(input.type); }
    if (input.startAt !== undefined) { sets.push('start_at = ?'); params.push(input.startAt); }
    if (input.endAt !== undefined) { sets.push('end_at = ?'); params.push(input.endAt); }
    if (input.allDay !== undefined) { sets.push('all_day = ?'); params.push(input.allDay ? 1 : 0); }
    if (input.location !== undefined) { sets.push('location = ?'); params.push(input.location); }
    if (input.note !== undefined) { sets.push('note = ?'); params.push(input.note); }
    if (input.repeatRule !== undefined) { sets.push('repeat_rule = ?'); params.push(input.repeatRule); }

    if (sets.length > 0) {
      params.push(id);
      await execute(this.db, `UPDATE event_item SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

    if (input.participantIds !== undefined || input.reminderOffsets !== undefined) {
      const batchStmts: Array<{ sql: string; params: unknown[] }> = [];

      if (input.participantIds !== undefined) {
        batchStmts.push(
          { sql: 'DELETE FROM event_participant WHERE event_id = ?', params: [id] },
          ...input.participantIds.map(pid => ({
            sql: 'INSERT INTO event_participant (event_id, member_id) VALUES (?, ?)',
            params: [id, pid],
          })),
        );
      }

      if (input.reminderOffsets !== undefined) {
        batchStmts.push(
          { sql: 'DELETE FROM event_reminder WHERE event_id = ?', params: [id] },
          ...input.reminderOffsets.map(offset => ({
            sql: 'INSERT INTO event_reminder (id, event_id, offset_minutes) VALUES (?, ?, ?)',
            params: [nanoid(), id, offset],
          })),
        );
      }

      if (batchStmts.length > 0) {
        await batchExecute(this.db, batchStmts);
      }
    }

    return this.getById(id, familyId);
  }

  async delete(id: string, familyId: string): Promise<void> {
    const existing = await findOne<EventRow>(
      this.db,
      'SELECT * FROM event_item WHERE id = ? AND family_id = ?',
      id, familyId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '日程不存在');

    await this.db.batch([
      this.db.prepare('DELETE FROM event_participant WHERE event_id = ?').bind(id),
      this.db.prepare('DELETE FROM event_reminder WHERE event_id = ?').bind(id),
      this.db.prepare('DELETE FROM event_item WHERE id = ?').bind(id),
    ]);
  }
}
