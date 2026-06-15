/**
 * CloudBase 数据层 — 私募基金看板
 *
 * 使用 @cloudbase/js-sdk 连接腾讯云 CloudBase 数据库。
 * 所有环境变量通过 process.env 读取（需在 .env.local 中配置）。
 *
 * ## 数据库集合设计
 *
 * ### 1. private_funds — 基金基础信息
 * | 字段              | 类型     | 说明             |
 * |-------------------|----------|------------------|
 * | _id               | string   | 自动 ID          |
 * | name              | string   | 基金名称          |
 * | code              | string   | 基金代码          |
 * | purchaseDate      | string   | 购买日期 YYYY-MM-DD |
 * | purchaseAmount    | number   | 购买金额（元）     |
 * | shares            | number   | 持有份额          |
 * | currentNav        | number   | 当前净值          |
 * | currentMarketValue| number   | 当前市值          |
 * | cumulativeReturn  | number   | 累计收益率(小数)   |
 * | remark            | string?  | 备注             |
 *
 * ### 2. nav_history — 净值历史
 * | 字段     | 类型   | 说明                    |
 * |----------|--------|------------------------|
 * | _id      | string | 自动 ID                 |
 * | fundCode | string | 关联基金代码             |
 * | date     | string | 日期 YYYY-MM-DD         |
 * | nav      | number | 当日净值                |
 *
 * ### 3. profit_records — 收益记录
 * | 字段       | 类型   | 说明                          |
 * |------------|--------|-------------------------------|
 * | _id        | string | 自动 ID                       |
 * | fundCode   | string | 关联基金代码                   |
 * | fundName   | string | 基金名称（冗余，便于查询）       |
 * | periodType | string | 周期类型：monthly / weekly     |
 * | periodKey  | string | 周期标识：YYYY-MM              |
 * | periodLabel| string | 显示标签：5月                  |
 * | profit     | number | 收益金额（元，负值为亏损）      |
 * | year       | number | 所属年份                      |
 *
 * ### 4. transaction_records — 交易记录
 * | 字段     | 类型   | 说明                        |
 * |----------|--------|-----------------------------|
 * | _id      | string | 自动 ID                     |
 * | fundCode | string | 关联基金代码                 |
 * | fundName | string | 基金名称（冗余）              |
 * | type     | string | 交易类型：buy / sell / dividend |
 * | date     | string | 交易日期 YYYY-MM-DD         |
 * | amount   | number | 交易金额（元）                |
 * | shares   | number | 交易份额                     |
 * | nav      | number | 交易时净值                   |
 * | remark   | string?| 备注                        |
 *
 * ## 种子数据
 * 首次部署需将 src/data/privateFundData.ts 中的本地数据导入到上述集合。
 * 建议通过 CloudBase 控制台或以下命令执行导入脚本：
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-private-funds.ts
 */

import cloudbase from "@cloudbase/js-sdk";
import type { RenovationBill, RenovationMaterial } from "@/types/renovation";

// ========== 类型定义 ==========

export interface PrivateFund {
  /** CloudBase 自动生成的文档 ID */
  _id?: string;
  /** 基金名称 */
  name: string;
  /** 基金代码 */
  code: string;
  /** 购买日期 YYYY-MM-DD */
  purchaseDate: string;
  /** 购买金额（元） */
  purchaseAmount: number;
  /** 持有份额 */
  shares: number;
  /** 当前净值 */
  currentNav: number;
  /** 当前市值 */
  currentMarketValue: number;
  /** 累计收益率 (小数，如 0.7341 表示 73.41%) */
  cumulativeReturn: number;
  /** 备注 */
  remark: string | null;
}

export interface NavRecord {
  _id?: string;
  /** 关联基金代码 */
  fundCode: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 当日净值 */
  nav: number;
}

export interface ProfitRecord {
  _id?: string;
  /** 关联基金代码 */
  fundCode: string;
  /** 基金名称（冗余字段，便于查询展示） */
  fundName: string;
  /** 周期类型 monthly | weekly */
  periodType: "monthly" | "weekly";
  /** 周期标识，如 "2026-05" */
  periodKey: string;
  /** 显示标签，如 "5月" */
  periodLabel: string;
  /** 收益金额（元），负值表示亏损 */
  profit: number;
  /** 所属年份 */
  year: number;
}

export interface TransactionRecord {
  _id?: string;
  /** 关联基金代码 */
  fundCode: string;
  /** 基金名称（冗余字段） */
  fundName: string;
  /** 交易类型 */
  type: "buy" | "sell" | "dividend";
  /** 交易日期 */
  date: string;
  /** 交易金额（元） */
  amount: number;
  /** 交易份额 */
  shares: number;
  /** 交易时净值 */
  nav: number;
  /** 备注 */
  remark: string | null;
}

// API 响应类型
export interface FundSummary {
  /** 总投入金额 */
  totalInvestment: number;
  /** 当前总资产 */
  totalAssets: number;
  /** 本月收益合计 */
  totalMonthlyProfit: number;
  /** 本年收益合计 */
  totalYearlyProfit: number;
}

export interface FundEnriched extends PrivateFund {
  /** 本周收益（暂为 0） */
  本周收益: number;
  /** 本月收益 */
  本月收益: number;
  /** 本年收益 */
  本年收益: number;
}

export interface FundDashboardData {
  funds: FundEnriched[];
  summary: FundSummary;
}

// ========== 初始化 ==========

/** CloudBase 应用实例（单例） */
let app: ReturnType<typeof cloudbase.init> | null = null;

/**
 * 获取 CloudBase 应用实例（惰性初始化）
 * 在 Next.js 边缘运行时 / Node.js 环境中使用密钥认证。
 */
export function getCloudBaseApp() {
  if (app) return app;

  const envId = process.env.CLOUDBASE_ENV_ID || process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;

  if (!envId) {
    throw new Error(
      "[CloudBase] 缺少环境变量 CLOUDBASE_ENV_ID，请在 .env.local 中配置"
    );
  }

  app = cloudbase.init({
    env: envId,
    timeout: 15000,
  });

  return app;
}

// ========== 数据库实例 ==========

/**
 * 获取 CloudBase 数据库实例
 */
export function getDB() {
  const app = getCloudBaseApp();
  return app.database();
}

/**
 * 获取集合引用
 * CloudBase JS SDK 的 collection() 返回 CollectionReference
 */
export function collection(name: string) {
  return getDB().collection(name);
}

// ========== 数据查询工具 ==========

/**
 * 查询所有基金基础信息
 */
export async function queryAllFunds(): Promise<PrivateFund[]> {
  const res = await collection("private_funds")
    .orderBy("purchaseDate", "asc")
    .get();
  return (res.data || []) as PrivateFund[];
}

/**
 * 按代码查询单只基金
 */
export async function queryFundByCode(code: string): Promise<PrivateFund | null> {
  const res = await collection("private_funds")
    .where({ code })
    .get();
  return (res.data?.[0] as PrivateFund) || null;
}

/**
 * 查询某一年所有月度收益记录
 */
export async function queryMonthlyProfits(year: number): Promise<ProfitRecord[]> {
  const res = await collection("profit_records")
    .where({
      periodType: "monthly",
      year,
    })
    .orderBy("periodKey", "asc")
    .get();
  return (res.data || []) as ProfitRecord[];
}

/**
 * 查询某只基金某年的月度收益
 */
export async function queryFundMonthlyProfits(
  fundCode: string,
  year: number
): Promise<ProfitRecord[]> {
  const res = await collection("profit_records")
    .where({
      fundCode,
      periodType: "monthly",
      year,
    })
    .orderBy("periodKey", "asc")
    .get();
  return (res.data || []) as ProfitRecord[];
}

/**
 * 查询净值历史（最多查最近 365 条）
 */
export async function queryNavHistory(
  fundCode: string,
  limit: number = 365
): Promise<NavRecord[]> {
  const res = await collection("nav_history")
    .where({ fundCode })
    .orderBy("date", "desc")
    .limit(limit)
    .get();
  return (res.data || []) as NavRecord[];
}

/**
 * 查询所有交易记录
 */
export async function queryTransactions(
  fundCode?: string,
  limit: number = 100
): Promise<TransactionRecord[]> {
  const query = fundCode
    ? collection("transaction_records").where({ fundCode })
    : collection("transaction_records");
  const res = await query.orderBy("date", "desc").limit(limit).get();
  return (res.data || []) as TransactionRecord[];
}

// ========== 装修记账 — 账单明细 ==========

/**
 * 查询所有账单，按 payDate 降序
 */
export async function queryAllBills(): Promise<RenovationBill[]> {
  const res = await collection("renovation_bills")
    .orderBy("payDate", "desc")
    .get();
  return (res.data || []) as RenovationBill[];
}

/**
 * 创建账单
 */
export async function createBill(
  data: Omit<RenovationBill, "_id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const res = await collection("renovation_bills").add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  if (!res.id) throw new Error("[CloudBase] createBill 返回的 id 为空");
  return res.id;
}

/**
 * 更新账单
 */
export async function updateBill(
  docId: string,
  data: Partial<RenovationBill>
): Promise<void> {
  await collection("renovation_bills").doc(docId).update({
    ...data,
    updatedAt: Date.now(),
  });
}

/**
 * 删除账单
 */
export async function deleteBill(docId: string): Promise<void> {
  await collection("renovation_bills").doc(docId).remove();
}

/**
 * 查询 bills 集合总数（判断是否为空）
 */
export async function countBills(): Promise<number> {
  const res = await collection("renovation_bills").count();
  return res.total || 0;
}

/**
 * 批量创建账单（种子）
 */
export async function createBills(
  bills: Omit<RenovationBill, "_id" | "createdAt" | "updatedAt">[]
): Promise<string[]> {
  const now = Date.now();
  const docs = bills.map((b) => ({ ...b, createdAt: now, updatedAt: now }));
  const res = await collection("renovation_bills").add(docs);
  return res.ids || [];
}

// ========== 装修记账 — 主材清单 ==========

/**
 * 查询所有主材
 */
export async function queryAllMaterials(): Promise<RenovationMaterial[]> {
  const res = await collection("renovation_materials")
    .orderBy("purchaseDate", "desc")
    .get();
  return (res.data || []) as RenovationMaterial[];
}

/**
 * 创建主材
 */
export async function createMaterial(
  data: Omit<RenovationMaterial, "_id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const subtotal = data.unitPrice * data.quantity;
  const res = await collection("renovation_materials").add({
    ...data,
    subtotal,
    createdAt: now,
    updatedAt: now,
  });
  if (!res.id) throw new Error("[CloudBase] createMaterial 返回的 id 为空");
  return res.id;
}

/**
 * 更新主材
 */
export async function updateMaterial(
  docId: string,
  data: Partial<RenovationMaterial>
): Promise<void> {
  const updateData: any = { ...data, updatedAt: Date.now() };
  // 如果 unitPrice 或 quantity 改变，重新计算 subtotal
  if (data.unitPrice !== undefined || data.quantity !== undefined) {
    // 需要先查当前值
    const current = await collection("renovation_materials").doc(docId).get();
    const cur = current.data as unknown as RenovationMaterial;
    const up = data.unitPrice ?? cur.unitPrice;
    const qty = data.quantity ?? cur.quantity;
    updateData.subtotal = up * qty;
  }
  await collection("renovation_materials").doc(docId).update(updateData);
}

/**
 * 删除主材
 */
export async function deleteMaterial(docId: string): Promise<void> {
  await collection("renovation_materials").doc(docId).remove();
}

/**
 * 查询 materials 集合总数
 */
export async function countMaterials(): Promise<number> {
  const res = await collection("renovation_materials").count();
  return res.total || 0;
}

/**
 * 批量创建主材（种子）
 */
export async function createMaterials(
  materials: Omit<RenovationMaterial, "_id" | "createdAt" | "updatedAt">[]
): Promise<string[]> {
  const now = Date.now();
  const docs = materials.map((m) => ({
    ...m,
    subtotal: m.unitPrice * m.quantity,
    createdAt: now,
    updatedAt: now,
  }));
  const res = await collection("renovation_materials").add(docs);
  return res.ids || [];
}

// ========== 数据写入工具 ==========

/**
 * 创建基金记录
 */
export async function createFund(fund: PrivateFund): Promise<string> {
  const res = await collection("private_funds").add({
    ...fund,
  });
  if (!res.id) throw new Error("[CloudBase] createFund 返回的 id 为空");
  return res.id;
}

/**
 * 批量创建基金记录
 */
export async function createFunds(funds: PrivateFund[]): Promise<string[]> {
  const res = await collection("private_funds").add(
    funds.map((f) => ({ ...f }))
  );
  return res.ids || [];
}

/**
 * 更新基金记录
 */
export async function updateFund(
  docId: string,
  data: Partial<PrivateFund>
): Promise<void> {
  await collection("private_funds").doc(docId).update(data);
}

/**
 * 创建收益记录
 */
export async function createProfitRecord(
  record: ProfitRecord
): Promise<string> {
  const res = await collection("profit_records").add(record);
  if (!res.id) throw new Error("[CloudBase] createProfitRecord 返回的 id 为空");
  return res.id;
}

/**
 * 批量创建收益记录
 */
export async function createProfitRecords(
  records: ProfitRecord[]
): Promise<string[]> {
  const res = await collection("profit_records").add(records);
  return res.ids || [];
}

/**
 * 创建交易记录
 */
export async function createTransaction(
  record: TransactionRecord
): Promise<string> {
  const res = await collection("transaction_records").add(record);
  if (!res.id) throw new Error("[CloudBase] createTransaction 返回的 id 为空");
  return res.id;
}

/**
 * 创建净值记录（追加）
 */
export async function createNavRecord(record: NavRecord): Promise<string> {
  const res = await collection("nav_history").add(record);
  if (!res.id) throw new Error("[CloudBase] createNavRecord 返回的 id 为空");
  return res.id;
}

// ========== 汇总计算 ==========

/**
 * 从月收益记录中计算本月（最新月）收益合计
 * @param profits 某年所有月收益记录
 * @param currentMonthLabel 当前月份标签，如 "5月"
 */
export function calcTotalMonthlyProfit(
  profits: ProfitRecord[],
  currentMonthLabel: string
): number {
  return profits
    .filter((p) => p.periodLabel === currentMonthLabel)
    .reduce((sum, p) => sum + p.profit, 0);
}

/**
 * 从月收益记录中计算本年收益合计
 */
export function calcTotalYearlyProfit(profits: ProfitRecord[]): number {
  return profits.reduce((sum, p) => sum + p.profit, 0);
}

/**
 * 计算单只基金的本月收益
 */
export function calcFundMonthlyProfit(
  profits: ProfitRecord[],
  fundCode: string,
  currentMonthLabel: string
): number {
  return profits
    .filter((p) => p.fundCode === fundCode && p.periodLabel === currentMonthLabel)
    .reduce((sum, p) => sum + p.profit, 0);
}

/**
 * 计算单只基金的本年收益
 */
export function calcFundYearlyProfit(
  profits: ProfitRecord[],
  fundCode: string
): number {
  return profits
    .filter((p) => p.fundCode === fundCode)
    .reduce((sum, p) => sum + p.profit, 0);
}

/**
 * 获取本年涉及的月份标签列表（去重、排序）
 */
export function getYearMonthLabels(profits: ProfitRecord[]): string[] {
  const labels = new Set(profits.map((p) => p.periodLabel));
  return Array.from(labels);
}

// ========== 仪表盘数据组装 ==========

/**
 * 组装完整的仪表盘数据
 * 1. 查询所有基金基础信息
 * 2. 查询本年所有月度收益记录
 * 3. 计算：本年本月合计、本年合计、单只基金月/年收益
 * 4. 返回前端所需格式
 */
export async function fetchDashboardData(): Promise<FundDashboardData> {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-based
  const currentMonthLabel = `${currentMonthIndex + 1}月`;

  const [funds, profits] = await Promise.all([
    queryAllFunds(),
    queryMonthlyProfits(currentYear),
  ]);

  const totalInvestment = funds.reduce(
    (sum, f) => sum + f.purchaseAmount,
    0
  );

  const totalAssets = funds.reduce(
    (sum, f) => sum + f.currentMarketValue,
    0
  );

  const enriched: FundEnriched[] = funds.map((fund) => ({
    ...fund,
    本周收益: 0,
    本月收益: calcFundMonthlyProfit(profits, fund.code, currentMonthLabel),
    本年收益: calcFundYearlyProfit(profits, fund.code),
  }));

  const summary: FundSummary = {
    totalInvestment,
    totalAssets,
    totalMonthlyProfit: calcTotalMonthlyProfit(profits, currentMonthLabel),
    totalYearlyProfit: calcTotalYearlyProfit(profits),
  };

  return { funds: enriched, summary };
}
