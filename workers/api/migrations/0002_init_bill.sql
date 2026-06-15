-- 0002_init_bill.sql
-- 账单模块:分类(一二级)、记录(仅支出)、标签、周期账单、预算、导入任务

-- 分类(一二级)
CREATE TABLE bill_category (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  level       INTEGER NOT NULL,
  name        TEXT NOT NULL,
  parent_id   TEXT REFERENCES bill_category(id),
  icon        TEXT,
  color       TEXT,
  sort        INTEGER NOT NULL DEFAULT 0,
  hidden      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_cat_family ON bill_category(family_id, level);

-- 标签
CREATE TABLE bill_tag (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#FF8C42',
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(family_id, name)
);
CREATE INDEX idx_tag_family ON bill_tag(family_id);

-- 账单记录(仅支出)
CREATE TABLE bill_record (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  amount      REAL NOT NULL,
  category_l1 TEXT NOT NULL,
  category_l2 TEXT NOT NULL,
  payer_id    TEXT NOT NULL REFERENCES sys_member(id),
  bill_date   TEXT NOT NULL,
  note        TEXT,
  image_url   TEXT,
  created_by  TEXT NOT NULL REFERENCES sys_member(id),
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  deleted_at  INTEGER
);
CREATE INDEX idx_bill_family_date ON bill_record(family_id, bill_date);
CREATE INDEX idx_bill_category ON bill_record(family_id, category_l1);
CREATE INDEX idx_bill_payer ON bill_record(family_id, payer_id);
CREATE INDEX idx_bill_deleted ON bill_record(deleted_at);

-- 账单-标签 关联
CREATE TABLE bill_record_tag (
  record_id   TEXT NOT NULL REFERENCES bill_record(id),
  tag_id      TEXT NOT NULL REFERENCES bill_tag(id),
  PRIMARY KEY (record_id, tag_id)
);

-- 周期性账单
CREATE TABLE bill_recurring (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  amount      REAL NOT NULL,
  category_l1 TEXT NOT NULL,
  category_l2 TEXT NOT NULL,
  payer_id    TEXT NOT NULL REFERENCES sys_member(id),
  cycle       TEXT NOT NULL,
  next_date   TEXT NOT NULL,
  note        TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_recurring_next ON bill_recurring(next_date);

-- 预算
CREATE TABLE bill_budget (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL,
  category_l1 TEXT,
  month       TEXT NOT NULL,
  amount      REAL NOT NULL,
  UNIQUE(family_id, category_l1, month)
);

-- 导入任务
CREATE TABLE bill_import_job (
  id               TEXT PRIMARY KEY,
  family_id        TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  status           TEXT NOT NULL,
  total            INTEGER NOT NULL DEFAULT 0,
  success          INTEGER NOT NULL DEFAULT 0,
  failed           INTEGER NOT NULL DEFAULT 0,
  error_report_url TEXT,
  created_by       TEXT NOT NULL REFERENCES sys_member(id),
  created_at       INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
