-- 0007_add_indexes.sql
-- 添加缺失的数据库索引，优化查询性能

-- bill_record: 按家庭/日期/软删除查询（列表、统计）
CREATE INDEX idx_bill_record_family_date ON bill_record(family_id, bill_date, deleted_at);

-- bill_record_tag: 标签关联查询
CREATE INDEX idx_bill_record_tag_record ON bill_record_tag(record_id);
CREATE INDEX idx_bill_record_tag_tag ON bill_record_tag(tag_id);

-- sys_device: 设备指纹登录 + 信任校验
CREATE INDEX idx_sys_device_fingerprint ON sys_device(fingerprint, trusted);

-- sys_device: 按成员查询设备
CREATE INDEX idx_sys_device_member ON sys_device(member_id);

-- sys_member: 按家庭查询成员
CREATE INDEX idx_sys_member_family ON sys_member(family_id);

-- bill_recurring: Cron 扫描到期周期账单
CREATE INDEX idx_bill_recurring_active ON bill_recurring(active, next_date);

-- bill_budget: 按家庭/月份查询预算
CREATE INDEX idx_bill_budget_family_month ON bill_budget(family_id, month);

-- event_item: 工作台查询即将到来的日程
CREATE INDEX idx_event_family_start ON event_item(family_id, start_at);
