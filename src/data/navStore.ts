/**
 * NAV 记录数据存储
 *
 * 使用 CloudBase（飞书 Bitable）作为主要存储，本地 JSON 文件作为回退方案。
 * 当 .env.local 中配置了飞书 Bitable 信息时，使用 Bitable；
 * 否则使用本地 JSON 文件存储。
 */

import fs from "fs";
import path from "path";
import {
  getPrivateFundConfig,
  createRecord,
  listRecords,
} from "@/lib/feishu";

export interface NavRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  values: Record<string, number>; // { fundName: nav }
  createdAt?: string;
}

// ---------- 本地文件存储 ----------

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DATA_FILE = path.join(DATA_DIR, "navRecords.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalRecords(): NavRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalRecords(records: NavRecord[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

// ---------- CloudBase 字段映射 ----------
// Bitable 中 NAV 记录的字段命名规则：
//   "日期" -> date
//   "基金名称_净值" -> fundName: navValue (每个基金一个字段)
//   "创建时间" -> createdAt

function navRecordToBitableFields(record: NavRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    日期: record.date,
  };
  for (const [fundName, nav] of Object.entries(record.values)) {
    fields[fundName] = nav;
  }
  return fields;
}

function bitableFieldsToNavRecord(item: any): NavRecord {
  const fields = item.fields || {};
  const values: Record<string, number> = {};
  const fundNameFields = Object.keys(fields).filter(
    (k) => k !== "日期" && k !== "创建时间" && k !== "id"
  );
  for (const name of fundNameFields) {
    const v = Number(fields[name]);
    if (!isNaN(v)) {
      values[name] = v;
    }
  }
  return {
    id: item.record_id,
    date: fields["日期"] || "",
    values,
    createdAt: fields["创建时间"] || item.created_time,
  };
}

// ---------- 公共 API ----------

/**
 * 查询 NAV 记录列表，按日期降序排列
 */
export async function listNavRecords(): Promise<NavRecord[]> {
  const { appToken, tableId } = getPrivateFundConfig();

  if (appToken && tableId) {
    try {
      const result = await listRecords(appToken, tableId, 500);
      const items: any[] = result?.data?.items || [];
      return items.map(bitableFieldsToNavRecord);
    } catch (err) {
      console.error("[NavStore] Bitable 查询失败，回退本地存储:", err);
      return readLocalRecords();
    }
  }

  return readLocalRecords();
}

/**
 * 查询最新的 NAV 记录
 */
export async function getLatestNavRecord(): Promise<NavRecord | null> {
  const records = await listNavRecords();
  // 按日期降序排列取第一条
  const sorted = records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0] || null;
}

/**
 * 查询指定日期的 NAV 记录
 */
export async function getNavRecordByDate(
  date: string
): Promise<NavRecord | null> {
  const records = await listNavRecords();
  return records.find((r) => r.date === date) || null;
}

/**
 * 保存 NAV 记录
 *
 * - 如果同日期已存在，则覆盖
 * - 未填写的字段沿用上次记录的净值（若上次记录存在且该字段有值）
 * - 若上次也无记录，则沿用 fundsData 中的当前净值
 */
export async function saveNavRecord(
  date: string,
  filledValues: Record<string, number | "">
): Promise<NavRecord> {
  const { appToken, tableId } = getPrivateFundConfig();

  // 1. 查询同日期已有记录
  const existing = await getNavRecordByDate(date);
  // 2. 查询上次记录
  const latest = await getLatestNavRecord();
  // 3. 导入基金基础信息（用于首次回退）
  const { fundsData } = await import("./privateFundData");

  // 构建最终 values：已填写字段覆盖，未填写字段沿用
  const values: Record<string, number> = {};
  const allFundNames = fundsData.map((f) => f["基金名称"]);

  for (const fundName of allFundNames) {
    const filled = filledValues[fundName];
    if (filled !== undefined && filled !== "") {
      values[fundName] = Number(filled);
    } else if (existing && existing.values[fundName] !== undefined) {
      values[fundName] = existing.values[fundName];
    } else if (latest && latest.values[fundName] !== undefined) {
      values[fundName] = latest.values[fundName];
    } else {
      // 回退到基础信息的当前净值
      const fund = fundsData.find((f) => f["基金名称"] === fundName);
      values[fundName] = fund ? fund["当前净值"] : 0;
    }
  }

  const record: NavRecord = { date, values };

  if (appToken && tableId) {
    try {
      const fields = navRecordToBitableFields(record);
      // Bitable: 如果有 existing id 则更新，否则创建
      if (existing?.id) {
        const { default: axios } = await import("axios");
        const { createFeishuHeaders } = await import("@/lib/feishu");
        const headers = await createFeishuHeaders();
        await axios.put(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${existing.id}`,
          { fields },
          { headers }
        );
      } else {
        await createRecord(appToken, tableId, fields);
      }
      record.id = existing?.id;
    } catch (err) {
      console.error("[NavStore] Bitable 保存失败，回退本地存储:", err);
      saveLocal(date, values);
    }
  } else {
    saveLocal(date, values);
  }

  return record;
}

function saveLocal(date: string, values: Record<string, number>) {
  const records = readLocalRecords();
  const idx = records.findIndex((r) => r.date === date);
  if (idx >= 0) {
    records[idx] = { date, values };
  } else {
    records.push({ date, values });
  }
  writeLocalRecords(records);
}

// ---------- 月度统计相关 ----------

/**
 * 按月计算每只基金的收益率
 * 收益率 = 该月收益 / 成本基数
 * 成本基数 = 购买金额 / 持有份额 * 持有份额 = 购买金额（简化）
 *
 * 返回: { fundName: { "1月": rate, "2月": rate, ... } }
 */
export function calculateMonthlyReturnRates(): Record<
  string,
  Record<string, number>
> {
  // 使用本地月度收益数据
  const { fundsData, monthlyProfitData } = require("./privateFundData");

  const result: Record<string, Record<string, number>> = {};

  for (const fund of fundsData) {
    const name = fund["基金名称"];
    const investment = fund["购买金额"];
    const profits = monthlyProfitData[name];
    if (!profits) continue;

    const rates: Record<string, number> = {};
    for (const [month, profit] of Object.entries(profits)) {
      rates[month] = investment > 0 ? (profit as number) / investment : 0;
    }
    result[name] = rates;
  }

  return result;
}

/**
 * 获取所有月份的列表（去重排序）
 */
export function getAllMonths(): string[] {
  const { monthlyProfitData } = require("./privateFundData");
  const monthSet = new Set<string>();
  for (const profits of Object.values(monthlyProfitData) as Record<
    string,
    number
  >[]) {
    for (const m of Object.keys(profits)) {
      monthSet.add(m);
    }
  }
  return sortMonths(Array.from(monthSet));
}

function sortMonths(months: string[]): string[] {
  const monthOrder: Record<string, number> = {
    "1月": 1,
    "2月": 2,
    "3月": 3,
    "4月": 4,
    "5月": 5,
    "6月": 6,
    "7月": 7,
    "8月": 8,
    "9月": 9,
    "10月": 10,
    "11月": 11,
    "12月": 12,
  };
  return months.sort((a, b) => (monthOrder[a] || 0) - (monthOrder[b] || 0));
}
