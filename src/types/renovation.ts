/** 账单分类 */
export type BillCategory = "硬装" | "软装" | "家电" | "工程" | "设计费" | "其他";

/** 付款方式 */
export type PayMethod = "现金" | "转账" | "信用卡" | "花呗" | "其他";

/** 付款状态 */
export type PayStatus = "已付款" | "待付款" | "已退款";

/** 主材状态 */
export type MaterialStatus = "待采购" | "已下单" | "到货待装" | "已安装" | "有质量问题";

/** 账单明细 */
export interface RenovationBill {
  _id?: string;
  name: string;
  category: BillCategory;
  /** 金额（元，>0） */
  amount: number;
  /** 付款日期 YYYY-MM-DD */
  payDate: string;
  payMethod: PayMethod;
  payStatus: PayStatus;
  /** 供应商/商家名称 */
  supplier?: string;
  /** 商家电话或微信号 */
  supplierContact?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

/** 主材清单 */
export interface RenovationMaterial {
  _id?: string;
  name: string;
  /** 规格型号 */
  spec?: string;
  brand?: string;
  unitPrice: number;
  quantity: number;
  /** 单位（默认"件"） */
  unit?: string;
  /** 小计 = unitPrice × quantity */
  subtotal?: number;
  /** 采购日期 */
  purchaseDate?: string;
  /** 实际安装日期 */
  installDate?: string;
  /** 预计安装日期 */
  expectedInstallDate?: string;
  status: MaterialStatus;
  /** 保修期至 YYYY-MM-DD */
  warrantyUntil?: string;
  supplier?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

/** 分类聚合 */
export interface CategoryBreakdown {
  [category: string]: number;
}

/** 月度趋势 */
export interface MonthlyTrendItem {
  month: string; // "2026-01"
  total: number;
}

/** 保修提醒项 */
export interface WarrantyExpiringItem {
  name: string;
  warrantyUntil: string;
  daysLeft: number;
}

/** 聚合统计响应 */
export interface RenovationSummary {
  totalSpent: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  payProgress: number; // 0~1
  thisMonthSpent: number;
  billCount: number;
  categoryBreakdown: CategoryBreakdown;
  monthlyTrend: MonthlyTrendItem[];
  warrantyExpiring: WarrantyExpiringItem[];
}
