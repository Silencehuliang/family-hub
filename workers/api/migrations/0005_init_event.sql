-- 0005_init_event.sql
-- 日程模块:事项、参与成员、提醒规则

CREATE TABLE event_item (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  start_at    INTEGER NOT NULL,
  end_at      INTEGER,
  all_day     INTEGER NOT NULL DEFAULT 0,
  location    TEXT,
  note        TEXT,
  repeat_rule TEXT,
  created_by  TEXT NOT NULL REFERENCES sys_member(id),
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_event_family_start ON event_item(family_id, start_at);

CREATE TABLE event_participant (
  event_id  TEXT NOT NULL REFERENCES event_item(id),
  member_id TEXT NOT NULL REFERENCES sys_member(id),
  PRIMARY KEY (event_id, member_id)
);

CREATE TABLE event_reminder (
  id             TEXT PRIMARY KEY,
  event_id       TEXT NOT NULL REFERENCES event_item(id),
  offset_minutes INTEGER NOT NULL
);
CREATE INDEX idx_event_reminder_event ON event_reminder(event_id);
