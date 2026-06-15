-- 0006_seed_categories.sql
-- 账单分类种子数据:14 个一级 + 60+ 二级
-- 挂在 system family(family_id='system'),家庭创建时复制一份到新家庭
-- 图标统一用 emoji(全站统一)

-- ═══ 一级分类(14 项)═══════════════════════════════════════════
INSERT INTO bill_category(id, family_id, level, name, icon, color, sort) VALUES
('cat_food',      'system', 1, '餐饮',     '🍚', '#FF7A45', 1),
('cat_daily',     'system', 1, '日常用品', '🛒', '#13C2C2', 2),
('cat_utility',   'system', 1, '居家水电', '💡', '#FAAD14', 3),
('cat_clothing',  'system', 1, '服饰美容', '👕', '#FF85C0', 4),
('cat_medical',   'system', 1, '医疗健康', '🏥', '#FF4D4F', 5),
('cat_transport', 'system', 1, '交通出行', '🚗', '#1890FF', 6),
('cat_edu',       'system', 1, '教育学习', '📚', '#722ED1', 7),
('cat_fun',       'system', 1, '娱乐休闲', '🎮', '#EB2F96', 8),
('cat_digital',   'system', 1, '数码电器', '💻', '#2F54EB', 9),
('cat_housing',   'system', 1, '居住房租', '🏠', '#87D068', 10),
('cat_baby',      'system', 1, '家庭育儿', '🍼', '#FFA940', 11),
('cat_gift',      'system', 1, '人情社交', '🎁', '#A0522D', 12),
('cat_finance',   'system', 1, '金融保险', '💼', '#08979C', 13),
('cat_other',     'system', 1, '其他支出', '✈️', '#8C8C8C', 14);

-- ═══ 二级分类 ════════════════════════════════════════════════

-- 餐饮
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_food_meal',    'system', 2, '三餐',     'cat_food', '🍽️', 1),
('cat_food_takeout', 'system', 2, '外卖',     'cat_food', '🥡', 2),
('cat_food_snack',   'system', 2, '零食饮料', 'cat_food', '🍪', 3),
('cat_food_gather',  'system', 2, '聚餐',     'cat_food', '🍻', 4),
('cat_food_grocery', 'system', 2, '果蔬生鲜', 'cat_food', '🥬', 5);

-- 日常用品
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_daily_paper',   'system', 2, '纸品清洁', 'cat_daily', '🧻', 1),
('cat_daily_wash',    'system', 2, '洗护日化', 'cat_daily', '🧴', 2),
('cat_daily_kitchen', 'system', 2, '厨房用品', 'cat_daily', '🍳', 3),
('cat_daily_pet',     'system', 2, '宠物用品', 'cat_daily', '🐾', 4);

-- 居家水电
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_util_water', 'system', 2, '水费',   'cat_utility', '💧', 1),
('cat_util_elec',  'system', 2, '电费',   'cat_utility', '⚡', 2),
('cat_util_gas',   'system', 2, '燃气',   'cat_utility', '🔥', 3),
('cat_util_net',   'system', 2, '宽带',   'cat_utility', '🌐', 4),
('cat_util_prop',  'system', 2, '物业',   'cat_utility', '🏢', 5);

-- 服饰美容
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_clo_cloth', 'system', 2, '服装鞋帽', 'cat_clothing', '👕', 1),
('cat_clo_acc',   'system', 2, '配饰',     'cat_clothing', '👓', 2),
('cat_clo_skin',  'system', 2, '护肤化妆', 'cat_clothing', '💄', 3),
('cat_clo_hair',  'system', 2, '理发美容', 'cat_clothing', '💈', 4);

-- 医疗健康
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_med_out',    'system', 2, '门诊',   'cat_medical', '🩺', 1),
('cat_med_drug',   'system', 2, '药品',   'cat_medical', '💊', 2),
('cat_med_exam',   'system', 2, '体检',   'cat_medical', '🩻', 3),
('cat_med_dental', 'system', 2, '齿科',   'cat_medical', '🦷', 4),
('cat_med_supp',   'system', 2, '保健',   'cat_medical', '🌿', 5);

-- 交通出行
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_tr_bus',    'system', 2, '公交地铁', 'cat_transport', '🚇', 1),
('cat_tr_taxi',   'system', 2, '打车',     'cat_transport', '🚕', 2),
('cat_tr_fuel',   'system', 2, '加油',     'cat_transport', '⛽', 3),
('cat_tr_park',   'system', 2, '停车过路', 'cat_transport', '🅿️', 4),
('cat_tr_ticket', 'system', 2, '火车机票', 'cat_transport', '✈️', 5);

-- 教育学习
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_edu_fee',     'system', 2, '学费',   'cat_edu', '🎓', 1),
('cat_edu_train',   'system', 2, '培训',   'cat_edu', '🏫', 2),
('cat_edu_book',    'system', 2, '书籍',   'cat_edu', '📚', 3),
('cat_edu_station', 'system', 2, '文具',   'cat_edu', '✏️', 4),
('cat_edu_hobby',   'system', 2, '兴趣班', 'cat_edu', '🎨', 5);

-- 娱乐休闲
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_fun_movie',  'system', 2, '电影演出', 'cat_fun', '🎬', 1),
('cat_fun_game',   'system', 2, '游戏',     'cat_fun', '🎮', 2),
('cat_fun_travel', 'system', 2, '旅行',     'cat_fun', '🏖️', 3),
('cat_fun_hobby',  'system', 2, '爱好',     'cat_fun', '🎸', 4),
('cat_fun_party',  'system', 2, '聚会',     'cat_fun', '🥳', 5);

-- 数码电器
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_dig_phone',  'system', 2, '手机', 'cat_digital', '📱', 1),
('cat_dig_pc',     'system', 2, '电脑', 'cat_digital', '💻', 2),
('cat_dig_app',    'system', 2, '家电', 'cat_digital', '🖥️', 3),
('cat_dig_acc',    'system', 2, '配件', 'cat_digital', '🔌', 4),
('cat_dig_repair', 'system', 2, '维修', 'cat_digital', '🔧', 5);

-- 居住房租
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_hou_rent', 'system', 2, '房租', 'cat_housing', '🏠', 1),
('cat_hou_loan', 'system', 2, '房贷', 'cat_housing', '🏦', 2),
('cat_hou_furn', 'system', 2, '家具', 'cat_housing', '🛋️', 3);

-- 家庭育儿
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_baby_milk',  'system', 2, '奶粉尿不湿', 'cat_baby', '🍼', 1),
('cat_baby_cloth', 'system', 2, '童装玩具',   'cat_baby', '🧸', 2),
('cat_baby_edu',   'system', 2, '教育',       'cat_baby', '📖', 3),
('cat_baby_vac',   'system', 2, '疫苗',       'cat_baby', '💉', 4);

-- 人情社交
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_gift_red',  'system', 2, '礼金红包', 'cat_gift', '🧧', 1),
('cat_gift_treat','system', 2, '请客',     'cat_gift', '🍽️', 2),
('cat_gift_gift', 'system', 2, '礼物',     'cat_gift', '🎁', 3);

-- 金融保险
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_fin_insure', 'system', 2, '保险',         'cat_finance', '🛡️', 1),
('cat_fin_invest', 'system', 2, '理财',         'cat_finance', '📈', 2),
('cat_fin_card',   'system', 2, '信用卡年费',   'cat_finance', '💳', 3);

-- 其他支出
INSERT INTO bill_category(id, family_id, level, name, parent_id, icon, sort) VALUES
('cat_other_misc', 'system', 2, '杂项', 'cat_other', '📦', 1);
