import { ErrorCode } from '@family-hub/shared';
import type { TodoItem, TodoSubtask, Member } from '@family-hub/shared';
import { BizError } from '../../utils/response';
import { findOne, findMany, execute, batchExecute, now } from '../../db/client';
import { nanoid } from '../../utils/crypto';
import { camelCase, camelCaseAll } from '../../utils/mapper';

export interface TodoQuery {
  status?: string;
  assigneeId?: string;
  priority?: string;
  dueBefore?: number;
}

interface TodoRow {
  id: string;
  family_id: string;
  title: string;
  note: string | null;
  status: string;
  priority: string;
  due_at: number | null;
  repeat_rule: string | null;
  created_by: string;
  completed_by: string | null;
  completed_at: number | null;
  created_at: number;
}

export class TodoService {
  constructor(private db: D1Database) {}

  async list(familyId: string, query: TodoQuery): Promise<TodoItem[]> {
    const conditions: string[] = ['t.family_id = ?'];
    const params: unknown[] = [familyId];

    if (query.status) { conditions.push('t.status = ?'); params.push(query.status); }
    if (query.priority) { conditions.push('t.priority = ?'); params.push(query.priority); }
    if (query.dueBefore) { conditions.push('t.due_at <= ?'); params.push(query.dueBefore); }

    let joinClause = '';
    if (query.assigneeId) {
      joinClause = 'JOIN todo_assignee ta ON ta.todo_id = t.id';
      conditions.push('ta.member_id = ?');
      params.push(query.assigneeId);
    }

    const where = conditions.join(' AND ');

    const rawItems = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT DISTINCT t.* FROM todo_item t ${joinClause} WHERE ${where} ORDER BY t.due_at ASC, t.created_at DESC`,
      ...params,
    );

    if (rawItems.length === 0) return [];

    const items = rawItems.map((r) => camelCase<TodoItem>(r));

    const todoIds = items.map((r) => r.id);
    const placeholders = todoIds.map(() => '?').join(',');

    const assigneeRows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT ta.todo_id, m.id, m.nickname, m.avatar_url, m.role
       FROM todo_assignee ta JOIN sys_member m ON m.id = ta.member_id
       WHERE ta.todo_id IN (${placeholders})`,
      ...todoIds,
    );

    const subtaskRows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT * FROM todo_subtask WHERE todo_id IN (${placeholders}) ORDER BY sort ASC`,
      ...todoIds,
    );

    const assigneeMap = new Map<string, Member[]>();
    for (const ar of assigneeRows) {
      const member = camelCase<Member>(ar);
      const todoId = (ar as { todo_id: string }).todo_id;
      if (!assigneeMap.has(todoId)) assigneeMap.set(todoId, []);
      assigneeMap.get(todoId)!.push(member);
    }

    const subtaskMap = new Map<string, TodoSubtask[]>();
    for (const sr of subtaskRows) {
      const sub = camelCase<TodoSubtask>(sr);
      const todoId = (sr as { todo_id: string }).todo_id;
      if (!subtaskMap.has(todoId)) subtaskMap.set(todoId, []);
      subtaskMap.get(todoId)!.push(sub);
    }

    return items.map((item) => ({
      ...item,
      note: item.note ?? undefined,
      dueAt: item.dueAt ?? undefined,
      repeatRule: item.repeatRule ?? undefined,
      assignees: assigneeMap.get(item.id) ?? [],
      subtasks: subtaskMap.get(item.id) ?? [],
    }));
  }

  async getById(id: string, familyId: string): Promise<TodoItem> {
    const raw = await findOne<Record<string, unknown>>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!raw) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');
    const item = camelCase<TodoItem>(raw);

    const assigneeRows = await findMany<Record<string, unknown>>(
      this.db,
      `SELECT m.id, m.nickname, m.avatar_url, m.role
       FROM todo_assignee ta JOIN sys_member m ON m.id = ta.member_id
       WHERE ta.todo_id = ?`,
      id,
    );
    const assignees = camelCaseAll<Member>(assigneeRows);

    const subtaskRows = await findMany<Record<string, unknown>>(
      this.db,
      'SELECT * FROM todo_subtask WHERE todo_id = ? ORDER BY sort ASC',
      id,
    );
    const subtasks = camelCaseAll<TodoSubtask>(subtaskRows);

    return {
      ...item,
      note: item.note ?? undefined,
      dueAt: item.dueAt ?? undefined,
      repeatRule: item.repeatRule ?? undefined,
      completedBy: item.completedBy ?? undefined,
      completedAt: item.completedAt ?? undefined,
      assignees,
      subtasks,
    };
  }

  async create(
    familyId: string,
    memberId: string,
    input: {
      title: string;
      note?: string;
      priority?: string;
      dueAt?: number;
      assigneeIds?: string[];
      subtasks?: Array<{ title: string }>;
    },
  ): Promise<TodoItem> {
    const id = nanoid();
    const ts = now();

    const stmts: Array<{ sql: string; params: unknown[] }> = [
      {
        sql: `INSERT INTO todo_item (id, family_id, title, note, status, priority, due_at, created_by, created_at)
              VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?)`,
        params: [id, familyId, input.title, input.note ?? null, input.priority ?? 'mid', input.dueAt ?? null, memberId, ts],
      },
    ];

    if (input.assigneeIds && input.assigneeIds.length > 0) {
      for (const aid of input.assigneeIds) {
        stmts.push({
          sql: 'INSERT INTO todo_assignee (todo_id, member_id) VALUES (?, ?)',
          params: [id, aid],
        });
      }
    }

    if (input.subtasks && input.subtasks.length > 0) {
      for (let i = 0; i < input.subtasks.length; i++) {
        stmts.push({
          sql: 'INSERT INTO todo_subtask (id, todo_id, title, done, sort) VALUES (?, ?, ?, 0, ?)',
          params: [nanoid(), id, input.subtasks[i].title, i],
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
      note?: string;
      priority?: string;
      dueAt?: number;
      assigneeIds?: string[];
    },
  ): Promise<TodoItem> {
    const existing = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.note !== undefined) { sets.push('note = ?'); params.push(input.note); }
    if (input.priority !== undefined) { sets.push('priority = ?'); params.push(input.priority); }
    if (input.dueAt !== undefined) { sets.push('due_at = ?'); params.push(input.dueAt); }

    if (sets.length > 0) {
      params.push(id);
      await execute(this.db, `UPDATE todo_item SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

    if (input.assigneeIds !== undefined) {
      const batchStmts: Array<{ sql: string; params: unknown[] }> = [
        { sql: 'DELETE FROM todo_assignee WHERE todo_id = ?', params: [id] },
        ...input.assigneeIds.map((aid) => ({
          sql: 'INSERT INTO todo_assignee (todo_id, member_id) VALUES (?, ?)',
          params: [id, aid],
        })),
      ];
      await batchExecute(this.db, batchStmts);
    }

    return this.getById(id, familyId);
  }

  async setStatus(id: string, familyId: string, memberId: string, status: string): Promise<TodoItem> {
    const existing = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    const ts = now();
    if (status === 'done') {
      await execute(
        this.db,
        'UPDATE todo_item SET status = ?, completed_by = ?, completed_at = ? WHERE id = ?',
        status, memberId, ts, id,
      );
    } else {
      await execute(
        this.db,
        'UPDATE todo_item SET status = ?, completed_by = NULL, completed_at = NULL WHERE id = ?',
        status, id,
      );
    }

    await execute(
      this.db,
      'INSERT INTO todo_log (id, todo_id, member_id, action, at) VALUES (?, ?, ?, ?, ?)',
      nanoid(), id, memberId, 'status_change', ts,
    );

    return this.getById(id, familyId);
  }

  async delete(id: string, familyId: string): Promise<void> {
    const existing = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      id,
      familyId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    await execute(this.db, 'DELETE FROM todo_item WHERE id = ?', id);
  }

  async addSubtask(
    todoId: string,
    familyId: string,
    input: { title: string },
  ): Promise<TodoSubtask> {
    const todo = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      todoId,
      familyId,
    );
    if (!todo) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    const maxSort = await this.db.prepare(
      'SELECT COALESCE(MAX(sort), -1) as max_sort FROM todo_subtask WHERE todo_id = ?'
    ).bind(todoId).first<{ max_sort: number }>();
    const sort = (maxSort?.max_sort ?? -1) + 1;

    const subId = nanoid();
    await execute(
      this.db,
      'INSERT INTO todo_subtask (id, todo_id, title, done, sort) VALUES (?, ?, ?, 0, ?)',
      subId, todoId, input.title, sort,
    );

    return { id: subId, todoId, title: input.title, done: false, sort };
  }

  async updateSubtask(
    todoId: string,
    subId: string,
    familyId: string,
    input: { title?: string; done?: boolean },
  ): Promise<TodoSubtask> {
    const todo = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      todoId,
      familyId,
    );
    if (!todo) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    const existing = await findOne<Record<string, unknown>>(
      this.db,
      'SELECT * FROM todo_subtask WHERE id = ? AND todo_id = ?',
      subId,
      todoId,
    );
    if (!existing) throw new BizError(ErrorCode.NOT_FOUND, '子任务不存在');

    const sets: string[] = [];
    const params: unknown[] = [];
    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.done !== undefined) { sets.push('done = ?'); params.push(input.done ? 1 : 0); }

    if (sets.length > 0) {
      params.push(subId);
      await execute(this.db, `UPDATE todo_subtask SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

    return this.getSubtask(subId, todoId);
  }

  async deleteSubtask(todoId: string, subId: string, familyId: string): Promise<void> {
    const todo = await findOne<TodoRow>(
      this.db,
      'SELECT * FROM todo_item WHERE id = ? AND family_id = ?',
      todoId,
      familyId,
    );
    if (!todo) throw new BizError(ErrorCode.NOT_FOUND, '待办不存在');

    await execute(this.db, 'DELETE FROM todo_subtask WHERE id = ? AND todo_id = ?', subId, todoId);
  }

  private async getSubtask(id: string, todoId: string): Promise<TodoSubtask> {
    const raw = await findOne<Record<string, unknown>>(
      this.db,
      'SELECT * FROM todo_subtask WHERE id = ? AND todo_id = ?',
      id,
      todoId,
    );
    if (!raw) throw new BizError(ErrorCode.NOT_FOUND, '子任务不存在');
    return camelCase<TodoSubtask>(raw);
  }
}
