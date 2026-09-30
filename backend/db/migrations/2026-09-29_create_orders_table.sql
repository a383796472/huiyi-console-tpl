-- ============================================================
-- 订单中心（四平台统一订单表）数据库迁移
-- 日期: 2026-09-29
-- 数据库: console-backend / huiyi_test
-- 数据源: Shopify / 聚水潭(抖音) / 天猫 / 1688
-- 说明: 只存各平台共有(关联性重复)的字段做列表展示；
--       完整原始数据存 raw_data JSON，详情页按分类渲染
-- ============================================================

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `platform` VARCHAR(20) NOT NULL COMMENT '平台: shopify / jushuitan / tmall / alibaba1688',
  `shop_name` VARCHAR(128) DEFAULT NULL COMMENT '店铺名称',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号(聚水潭=内部订单号,其余=平台订单号)',
  `online_order_no` VARCHAR(255) DEFAULT NULL COMMENT '线上订单号(聚水潭合并单为拼接值)',
  `order_time` DATETIME DEFAULT NULL COMMENT '下单时间',
  `pay_time` DATETIME DEFAULT NULL COMMENT '付款时间',
  `fulfill_time` DATETIME DEFAULT NULL COMMENT '发货时间',
  `buyer_name` VARCHAR(255) DEFAULT NULL COMMENT '买家/收件人',
  `buyer_account` VARCHAR(255) DEFAULT NULL COMMENT '买家账号(脱敏ID)',
  `province` VARCHAR(64) DEFAULT NULL COMMENT '省份/收件地区',
  `item_count` INT NOT NULL DEFAULT 0 COMMENT '商品件数(数量合计)',
  `item_kind_count` INT NOT NULL DEFAULT 0 COMMENT '商品行数',
  `currency` VARCHAR(8) DEFAULT NULL COMMENT '币种: CNY / USD',
  `total_amount` DECIMAL(12,2) DEFAULT NULL COMMENT '订单总额(买家应付)',
  `paid_amount` DECIMAL(12,2) DEFAULT NULL COMMENT '买家实付金额',
  `freight_amount` DECIMAL(12,2) DEFAULT NULL COMMENT '运费',
  `discount_amount` DECIMAL(12,2) DEFAULT NULL COMMENT '折扣金额',
  `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '退款金额',
  `order_status` VARCHAR(64) DEFAULT NULL COMMENT '平台原始状态文本',
  `status_code` VARCHAR(20) DEFAULT NULL COMMENT '归一化状态: pending/paid/shipped/completed/cancelled/other',
  `is_counted` TINYINT NOT NULL DEFAULT 1 COMMENT '是否计入业绩: 1=是 0=否',
  `logistics_no` VARCHAR(128) DEFAULT NULL COMMENT '物流单号',
  `logistics_company` VARCHAR(64) DEFAULT NULL COMMENT '物流公司',
  `remark` VARCHAR(512) DEFAULT NULL COMMENT '备注/留言',
  `raw_data` JSON DEFAULT NULL COMMENT '完整原始数据(详情页分类展示用)',
  `sync_date` DATE DEFAULT NULL COMMENT '数据同步日期',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_order` (`platform`, `order_no`),
  KEY `idx_order_time` (`order_time`),
  KEY `idx_status` (`status_code`),
  KEY `idx_shop` (`shop_name`),
  KEY `idx_sync_date` (`sync_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表(四平台统一)';
