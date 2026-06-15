-- 0004_init_shop.sql
-- 购买清单模块:清单、商品、模板

CREATE TABLE shop_list (
  id         TEXT PRIMARY KEY,
  family_id  TEXT NOT NULL,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_by TEXT NOT NULL REFERENCES sys_member(id),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_shop_list_family ON shop_list(family_id, status);

CREATE TABLE shop_item (
  id           TEXT PRIMARY KEY,
  list_id      TEXT NOT NULL REFERENCES shop_list(id),
  name         TEXT NOT NULL,
  qty          REAL NOT NULL DEFAULT 1,
  unit         TEXT DEFAULT '个',
  est_price    REAL,
  category     TEXT,
  priority     TEXT DEFAULT 'mid',
  bought       INTEGER NOT NULL DEFAULT 0,
  buyer_id     TEXT REFERENCES sys_member(id),
  actual_price REAL,
  bought_at    INTEGER,
  note         TEXT,
  sort         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_shop_item_list ON shop_item(list_id, bought);

CREATE TABLE shop_template (
  id         TEXT PRIMARY KEY,
  family_id  TEXT NOT NULL,
  name       TEXT NOT NULL,
  items_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
