-- 修改 duration_unit 列以支持 hour
ALTER TABLE recharge_packages MODIFY COLUMN duration_unit ENUM('hour', 'day', 'month', 'year') DEFAULT 'day';
ALTER TABLE points_exchange_products MODIFY COLUMN duration_unit ENUM('hour', 'day', 'month', 'year') DEFAULT 'day';

-- 清空并更新充值套餐表
TRUNCATE TABLE recharge_packages;

INSERT INTO recharge_packages (id, name, description, price, points, duration, duration_unit, recommended, sort_order, is_active) VALUES
(1, '8小时卡', '8小时使用时长', 9.90, 50, 8, 'hour', 0, 1, 1),
(2, '日卡', '1天使用时长', 14.90, 75, 1, 'day', 0, 2, 1),
(3, '周卡', '7天使用时长', 29.90, 150, 7, 'day', 1, 3, 1),
(4, '月卡', '30天使用时长', 79.90, 400, 30, 'day', 0, 4, 1),
(5, '季卡', '90天使用时长', 299.00, 1500, 90, 'day', 0, 5, 1),
(6, '半年卡', '180天使用时长', 699.00, 3500, 180, 'day', 0, 6, 1),
(7, '年卡', '365天使用时长', 999.00, 5000, 365, 'day', 0, 7, 1),
(8, '永久卡', '无限期使用', 4999.00, 9999999, 999999, 'day', 0, 8, 1);

-- 清空并更新积分兑换产品表
TRUNCATE TABLE points_exchange_products;

INSERT INTO points_exchange_products (id, name, description, points_cost, duration, duration_unit, sort_order, is_active) VALUES
(1, '8小时时长', '使用50积分兑换8小时', 50, 8, 'hour', 1, 1),
(2, '1天时长', '使用75积分兑换1天', 75, 1, 'day', 2, 1),
(3, '7天时长', '使用150积分兑换7天', 150, 7, 'day', 3, 1),
(4, '30天时长', '使用400积分兑换30天', 400, 30, 'day', 4, 1),
(5, '90天时长', '使用1500积分兑换90天', 1500, 90, 'day', 5, 1),
(6, '180天时长', '使用3500积分兑换180天', 3500, 180, 'day', 6, 1),
(7, '365天时长', '使用5000积分兑换365天', 5000, 365, 'day', 7, 1);
