-- 0001_init_sys.sql
-- 系统公共表:家庭、成员、邀请码、设备、会话、通知、通知偏好、飞书配置、Web Push 订阅
-- 注意:sys_notify_pref 使用 inapp 字段(应用内),非 PRD §6.1 残留的 email

-- 家庭
CREATE TABLE sys_family (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 成员
CREATE TABLE sys_member (
  id               TEXT PRIMARY KEY,
  family_id        TEXT NOT NULL REFERENCES sys_family(id),
  nickname         TEXT NOT NULL,
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'member',
  pin_hash         TEXT,
  pin_locked_until INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_member_family ON sys_member(family_id);

-- 邀请码
CREATE TABLE sys_invite (
  code        TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL REFERENCES sys_family(id),
  role        TEXT NOT NULL DEFAULT 'member',
  max_uses    INTEGER NOT NULL DEFAULT 1,
  used_count  INTEGER NOT NULL DEFAULT 0,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 设备(信任)
CREATE TABLE sys_device (
  id             TEXT PRIMARY KEY,
  member_id      TEXT NOT NULL REFERENCES sys_member(id),
  fingerprint    TEXT NOT NULL,
  device_name    TEXT,
  last_ip        TEXT,
  last_active_at INTEGER NOT NULL,
  trusted        INTEGER NOT NULL DEFAULT 1,
  created_at     INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(member_id, fingerprint)
);
CREATE INDEX idx_device_member ON sys_device(member_id);
CREATE INDEX idx_device_fingerprint ON sys_device(fingerprint);

-- 会话(DB 兜底可审计,主要走 KV)
CREATE TABLE sys_session (
  token       TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES sys_member(id),
  device_id   TEXT REFERENCES sys_device(id),
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_session_member ON sys_session(member_id);

-- 应用内通知
CREATE TABLE sys_notification (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  member_id   TEXT,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  ref_type    TEXT,
  ref_id      TEXT,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_notif_member ON sys_notification(member_id, read);
CREATE INDEX idx_notif_family ON sys_notification(family_id, created_at);

-- 通知偏好(每成员每类型)
CREATE TABLE sys_notify_pref (
  member_id   TEXT NOT NULL REFERENCES sys_member(id),
  type        TEXT NOT NULL,
  feishu      INTEGER NOT NULL DEFAULT 1,
  webpush     INTEGER NOT NULL DEFAULT 1,
  inapp       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (member_id, type)
);

-- 飞书配置(每家庭一条)
CREATE TABLE sys_feishu_config (
  family_id   TEXT PRIMARY KEY REFERENCES sys_family(id),
  webhook_url TEXT NOT NULL,
  secret      TEXT,
  enabled     INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Web Push 订阅
CREATE TABLE sys_push_subscription (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES sys_member(id),
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_push_member ON sys_push_subscription(member_id);
