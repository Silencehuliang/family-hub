-- 0003_init_todo.sql
-- 待办模块:事项、指派、子任务、标签、操作日志

CREATE TABLE todo_item (
  id           TEXT PRIMARY KEY,
  family_id    TEXT NOT NULL,
  title        TEXT NOT NULL,
  note         TEXT,
  status       TEXT NOT NULL DEFAULT 'todo',
  priority     TEXT NOT NULL DEFAULT 'mid',
  due_at       INTEGER,
  repeat_rule  TEXT,
  created_by   TEXT NOT NULL REFERENCES sys_member(id),
  completed_by TEXT REFERENCES sys_member(id),
  completed_at INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_todo_family_status ON todo_item(family_id, status);
CREATE INDEX idx_todo_due ON todo_item(due_at);

CREATE TABLE todo_assignee (
  todo_id   TEXT NOT NULL REFERENCES todo_item(id),
  member_id TEXT NOT NULL REFERENCES sys_member(id),
  PRIMARY KEY (todo_id, member_id)
);

CREATE TABLE todo_subtask (
  id      TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL REFERENCES todo_item(id),
  title   TEXT NOT NULL,
  done    INTEGER NOT NULL DEFAULT 0,
  sort    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_subtask_todo ON todo_subtask(todo_id);

CREATE TABLE todo_tag (
  id        TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name      TEXT NOT NULL,
  UNIQUE(family_id, name)
);

CREATE TABLE todo_item_tag (
  todo_id TEXT NOT NULL,
  tag_id  TEXT NOT NULL,
  PRIMARY KEY (todo_id, tag_id)
);

-- 待办操作日志(修正:详细设计 §7.1 引用但 schema 缺失,此处补上)
CREATE TABLE todo_log (
  id        TEXT PRIMARY KEY,
  todo_id   TEXT NOT NULL REFERENCES todo_item(id),
  member_id TEXT NOT NULL REFERENCES sys_member(id),
  action    TEXT NOT NULL,
  at        INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_todo_log_todo ON todo_log(todo_id);
