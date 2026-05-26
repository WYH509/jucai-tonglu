/**
 * 飞书 API 工具模块
 *
 * 使用 axios 与飞书 Bitable 交互。
 * 环境变量通过 process.env 读取 (需在 .env.local 中配置)。
 */

import axios from "axios";

// 环境变量配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || "";
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || "";

// 私募基金 Bitable 配置
const FEISHU_PRIVATE_FUND_APP_TOKEN = process.env.FEISHU_PRIVATE_FUND_APP_TOKEN || "";
const FEISHU_TABLE_PRIVATE_FUND_INPUT = process.env.FEISHU_TABLE_PRIVATE_FUND_INPUT || "";

/**
 * 获取飞书 tenant_access_token
 */
export async function getTenantAccessToken(): Promise<string> {
  const res = await axios.post(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }
  );
  return res.data.tenant_access_token;
}

/**
 * 创建飞书 client headers（含 Authorization）
 */
export async function createFeishuHeaders(): Promise<Record<string, string>> {
  const token = await getTenantAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

// ========== 基础 Bitable API ==========

/**
 * 列出 Bitable 记录
 * @param appToken - Bitable 的 app_token
 * @param tableId - 表格 ID
 * @param pageSize - 每页记录数（默认 20）
 */
export async function listRecords(
  appToken: string,
  tableId: string,
  pageSize: number = 20
) {
  const headers = await createFeishuHeaders();
  const res = await axios.get(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    { headers, params: { page_size: pageSize } }
  );
  return res.data;
}

/**
 * 在 Bitable 中创建记录
 * @param appToken - Bitable 的 app_token
 * @param tableId - 表格 ID
 * @param fields - 字段值对象
 */
export async function createRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, unknown>
) {
  const headers = await createFeishuHeaders();
  const res = await axios.post(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    { fields },
    { headers }
  );
  return res.data;
}

// ========== 私募基金专用方法 ==========

/**
 * 获取私募基金 Bitable 的配置
 */
export function getPrivateFundConfig() {
  return {
    appToken: FEISHU_PRIVATE_FUND_APP_TOKEN,
    tableId: FEISHU_TABLE_PRIVATE_FUND_INPUT,
  };
}

/**
 * 列出私募基金所有记录
 */
export async function listPrivateFundRecords() {
  const { appToken, tableId } = getPrivateFundConfig();
  if (!appToken || !tableId) {
    throw new Error("私募基金 Bitable 配置缺失，请检查环境变量");
  }
  return listRecords(appToken, tableId, 100);
}

/**
 * 创建私募基金记录
 * @param fields - 字段值对象
 */
export async function createPrivateFundRecord(fields: Record<string, unknown>) {
  const { appToken, tableId } = getPrivateFundConfig();
  if (!appToken || !tableId) {
    throw new Error("私募基金 Bitable 配置缺失，请检查环境变量");
  }
  return createRecord(appToken, tableId, fields);
}
