# 装修记账 v2 — 完整开发规格

> 任务代号：`renovation-v2`
> 创建日期：2026-06-15
> 优先级：P0（用户当面要求）
> 目标：替换飞书 Bitable 旧装修记账 + 首页改两个大按键
> 部署目标：https://jucai-tonglu.onrender.com（Render + CloudBase）

---

## 0. 用户决策（已拍板，2026-06-15 20:50）

| # | 决策 | 结果 |
|---|---|---|
| 1 | 多项目支持？ | ❌ 不做。只有"湘江公寓"一个项目，无需多项目维度 |
| 2 | 图纸 & 资料模块？ | ❌ 砍掉 |
| 3 | 数据来源？ | 手动录入 + 预置测试数据（用户后续手动改/删） |
| 4 | 预算功能？ | ❌ 不要总预算。**要：总花费 / 当前付款进度 / 本月支出 / 主材保修提醒** |

---

## 1. 项目上下文（必读）

### 1.1 仓库与部署
- **本地路径**：`C:\Openclaw\jucai-tonglu`
- **Render 服务**：`srv-d7un1f9j2pic73c2b7d0`（Web Service, free, Node 20）
- **GitHub**：`https://github.com/WYH509/jucai-tonglu`（分支 `main`）
- **Render URL**：`https://jucai-tonglu.onrender.com`
- **环境变量**：CloudBase 凭证已在 Render 配置（私募看板在用同样的环境变量）
- **部署方式**：git push → Render 自动 build & deploy

### 1.2 技术栈（**严格遵守，禁止升级**）
- Next.js：**15.3.9**（LTS，**禁止** `^` 前缀，**禁止** canary/preview）
- React：**19.1.0**
- Tailwind CSS：**4**（已有 `@tailwindcss/postcss`）
- TypeScript：**5**（严格模式）
- 数据库：**腾讯云开发 CloudBase**（用 `@cloudbase/js-sdk` ^3.3.11）
- 部署：Render free tier

### 1.3 现有架构参考
- **私募基金看板**（`/private-fund`）已在用 CloudBase，可作为模板
  - CloudBase SDK 封装：`src/lib/cloudbase.ts`
  - API route 模板：`src/app/api/private-fund/route.ts`
  - UI 组件模板：`src/components/private-fund/PrivateFundDashboard.tsx`（iOS 风格）
- **首页**：`src/app/page.tsx` → `src/components/HomePage.tsx`（两个小按钮，**要改大按键**）

### 1.4 硬性偏好（违反 = 任务失败）
- ❌ **禁止 canary/preview/^ 前缀的依赖**（必须锁 LTS）
- ❌ **禁止自动生成/编造业务数据**（用户对假数据零容忍，参考 MEMORY.md "严重教训"）
  - 测试数据是**用户明确要求预置的**，必须标注"演示数据"角标，**绝不能假装是真实数据**
- ✅ UI 风格：iOS 风格（圆角、毛玻璃、蓝色主调、12-14px 圆角按钮）
- ✅ 颜色规则（中国习惯）：正数红色 `#dc2626`、负数绿色 `#16a34a`、金额千分位
- ✅ 中文界面
- ✅ 移动端优先，桌面端自适应

### 1.5 必读历史背景
- 旧装修记账用飞书 Bitable，**已废弃**（参考 `C:\Openclaw\MEMORY.md` "飞书多维表格已废弃"）
- 私募基金看板有详细计算规则（分红再投、NAV 等），**装修记账不涉及**
- 用户的"严重教训"：**绝对不要自动生成假数据**（2026-06-08 私募看板事故）

---

## 2. 范围定义

### 2.1 必须做
- ✅ 删除旧装修记账全部代码（详见 §6）
- ✅ 数据库 schema：两个 CloudBase 集合（`renovation_bills`、`renovation_materials`）
- ✅ 种子数据：约 12 条账单 + 8 条主材（用户会改/删）
- ✅ API routes（GET/POST/PUT/DELETE）
- ✅ 装修记账页面（`/renovation`）— **新设计**
- ✅ 首页（`/`）改两个大按键
- ✅ 端到端自测 + git commit + Render 部署
- ✅ **总花费 / 付款进度 / 本月支出 / 主材保修提醒**（用户指定必须）

### 2.2 不做（用户已砍）
- ❌ 多项目（只有湘江公寓）
- ❌ 图纸 & 资料上传
- ❌ 总预算
- ❌ 飞书 Bitable 集成
- ❌ 用户登录/鉴权（单用户使用，Render 内置隐私即可）

---

## 3. 数据模型

### 3.1 集合 1：`renovation_bills`（账单明细）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `_id` | string | 自动 | CloudBase 自动 ID |
| `name` | string | ✅ | 装修项名称，如"全屋瓷砖铺贴" |
| `category` | string | ✅ | `硬装` / `软装` / `家电` / `工程` / `设计费` / `其他` |
| `amount` | number | ✅ | 金额（元，>0） |
| `payDate` | string | ✅ | 付款日期 `YYYY-MM-DD` |
| `payMethod` | string | ✅ | `现金` / `转账` / `信用卡` / `花呗` / `其他` |
| `payStatus` | string | ✅ | `已付款` / `待付款` / `已退款` |
| `supplier` | string | ❌ | 供应商/商家名称 |
| `supplierContact` | string | ❌ | 商家电话或微信号 |
| `notes` | string | ❌ | 备注 |
| `createdAt` | number | 自动 | 创建时间戳（毫秒） |
| `updatedAt` | number | 自动 | 更新时间戳（毫秒） |

### 3.2 集合 2：`renovation_materials`（主材清单）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `_id` | string | 自动 | CloudBase 自动 ID |
| `name` | string | ✅ | 材料名称，如"客厅瓷砖" |
| `spec` | string | ❌ | 规格型号，如"800x800mm 抛光砖" |
| `brand` | string | ❌ | 品牌，如"东鹏" |
| `unitPrice` | number | ✅ | 单价（元） |
| `quantity` | number | ✅ | 数量 |
| `unit` | string | ❌ | 单位（块/米/平方米/件，默认"件"） |
| `subtotal` | number | 自动 | 小计 = unitPrice × quantity |
| `purchaseDate` | string | ❌ | 采购日期 |
| `installDate` | string | ❌ | 实际安装日期 |
| `expectedInstallDate` | string | ❌ | 预计安装日期 |
| `status` | string | ✅ | `待采购` / `已下单` / `到货待装` / `已安装` / `有质量问题` |
| `warrantyUntil` | string | ❌ | 保修期至 `YYYY-MM-DD`（用于提醒） |
| `supplier` | string | ❌ | 供应商 |
| `notes` | string | ❌ | 备注 |
| `createdAt` | number | 自动 | |
| `updatedAt` | number | 自动 | |

### 3.3 种子数据（用户要求预置）

**renovation_bills（12 条）**：
```
1. 全屋瓷砖铺贴, 硬装, 18500, 2026-05-10, 转账, 已付款, 备注: 客厅+卧室+厨房
2. 客厅沙发, 软装, 6800, 2026-05-15, 信用卡, 已付款, 备注: 米白色布艺沙发
3. 冰箱, 家电, 5200, 2026-04-28, 转账, 已付款, 备注: 双开门 600L
4. 墙面乳胶漆, 硬装, 3200, 2026-05-08, 转账, 已付款, 备注: 三棵树环保漆
5. 窗帘定制, 软装, 2800, 2026-05-20, 花呗, 待付款, 备注: 全屋定制窗帘
6. 洗衣机, 家电, 3500, 2026-04-25, 转账, 已付款, 备注: 洗烘一体机
7. 设计费, 设计费, 8000, 2026-05-01, 转账, 已付款, 备注: 全案设计
8. 卫生间防水, 工程, 4500, 2026-05-12, 现金, 已付款, 备注: 主卫+客卫
9. 厨房橱柜, 硬装, 12000, 2026-05-25, 转账, 待付款, 备注: 不锈钢台面
10. 空调（3台）, 家电, 9800, 2026-06-01, 信用卡, 待付款, 备注: 美的变频
11. 灯具全屋, 软装, 4200, 2026-05-18, 转账, 已付款, 备注: 主灯+筒灯
12. 水电改造, 工程, 15000, 2026-04-20, 转账, 已付款, 备注: 全屋水电
```

**renovation_materials（8 条）**：
```
1. 客厅瓷砖, 800x800mm 抛光砖, 东鹏, 45, 120, 块, 2026-04-15, 已安装, 2028-04-15
2. 卧室木地板, 实木复合, 大自然, 280, 35, 平方米, 2026-04-20, 已安装, 2031-04-20
3. 冰箱, BCD-600, 海尔, 5200, 1, 台, 2026-04-28, 已安装, 2028-04-28
4. 洗衣机, 洗烘一体, 西门子, 3500, 1, 台, 2026-04-25, 已安装, 2028-04-25
5. 沙发, 3+1 布艺, 林氏木业, 6800, 1, 套, 2026-05-15, 已安装, 2026-11-15
6. 乳胶漆, 5L 环保型, 三棵树, 320, 10, 桶, 2026-05-05, 已安装, -
7. 橱柜, 不锈钢台面+多层板, 欧派, 12000, 1, 套, 2026-05-25, 到货待装, 2026-12-25
8. 空调（3台）, 1.5匹 变频, 美的, 3266, 3, 台, 2026-06-01, 待采购, 2028-06-01
```

> ⚠️ 种子数据是**演示数据**。前端必须在第一次加载且 `bills.length === 0` 时自动 seed，并在页面顶部用蓝色 chip 提示"演示数据，可删除"。

---

## 4. API 设计（Next.js Route Handlers）

### 4.1 `GET /api/renovation/bills`
- 返回所有账单，按 `payDate desc` 排序
- 响应：`{ bills: RenovationBill[] }`

### 4.2 `POST /api/renovation/bills`
- 创建一条账单
- 请求体：完整账单字段（不含 `_id`/`createdAt`/`updatedAt`）
- 响应：`{ id: string }`

### 4.3 `PUT /api/renovation/bills/:id`
- 更新账单
- 请求体：Partial<RenovationBill>
- 响应：`{ ok: true }`

### 4.4 `DELETE /api/renovation/bills/:id`
- 删除账单
- 响应：`{ ok: true }`

### 4.5 `GET /api/renovation/materials`
- 返回所有主材
- 响应：`{ materials: RenovationMaterial[] }`

### 4.6 `POST /api/renovation/materials`
- 同上对称
### 4.7 `PUT /api/renovation/materials/:id`
### 4.8 `DELETE /api/renovation/materials/:id`

### 4.9 `GET /api/renovation/summary`
- 聚合统计
- 响应：
  ```json
  {
    "totalSpent": 90000,           // sum(amount where payStatus != '已退款')
    "totalPaid": 70000,            // sum(amount where payStatus == '已付款')
    "totalPending": 20000,         // sum(amount where payStatus == '待付款')
    "totalRefunded": 0,            // sum(amount where payStatus == '已退款')
    "payProgress": 0.778,          // totalPaid / (totalPaid + totalPending)
    "thisMonthSpent": 0,           // 当月 sum
    "billCount": 12,
    "categoryBreakdown": {         // 分类聚合
      "硬装": 33700, "软装": 13800, "家电": 18500, "工程": 19500, "设计费": 8000, "其他": 0
    },
    "monthlyTrend": [              // 最近 6 个月
      { "month": "2026-01", "total": 0 },
      ...
    ],
    "warrantyExpiring": [          // 30 天内到期的保修项
      { "name": "沙发", "warrantyUntil": "2026-11-15", "daysLeft": 153 }
    ]
  }
  ```

### 4.10 `POST /api/renovation/seed`（**特殊**）
- 仅当 bills 集合为空时，注入种子数据
- 用于首次部署初始化
- 响应：`{ ok: true, seeded: { bills: 12, materials: 8 } }`

---

## 5. UI 设计

### 5.1 首页（`/`）两个大按键

**当前**：横向小按钮（`sm:flex-row` 边对边）

**新设计**：
- **移动端**（<640px）：垂直堆叠，每块占满宽度
- **桌面端**（≥640px）：左右二分，各占 50%，最小高度 200px
- 每个按键：
  - 大圆角（`rounded-2xl`，16px）
  - 渐变背景：
    - 基金看板：`from-amber-400 to-orange-500`（金色）
    - 装修记账：`from-emerald-400 to-teal-500`（蓝绿）
  - 白色文字 + 阴影 + hover 上浮
  - 顶部 32px 圆形图标（emoji 或 SVG）
  - 主标题（24px bold）
  - 副标题（14px opacity-90）
  - 右下角小箭头 `→`

**参考布局**：
```
┌─────────────────────────────────┐
│        聚 财 通 录             │
│      简洁 · 高效 · 一目了然      │
│                                 │
│  ┌────────────┬────────────┐   │
│  │   💰        │   🏠        │   │
│  │  私募基金看板  │  装修记账    │   │
│  │  收益·净值·趋势│  项目·主材·进度│   │
│  │            →│            →│   │
│  └────────────┴────────────┘   │
│                                 │
└─────────────────────────────────┘
（手机端：上下堆叠）
```

### 5.2 装修记账页面（`/renovation`）

**布局结构**（顶部 → 底部）：
1. **顶部栏**（粘性）：返回按钮 + 标题"装修记账" + 刷新按钮
2. **总览卡片区**（4 张卡片，2x2 网格，移动端单列）：
   - 总花费（红色加粗）
   - 本月支出
   - 已付款 / 待付款（双行展示，付款进度条）
   - 付款进度（百分比 + 圆环图或进度条）
3. **保修提醒区**（仅当有 30 天内到期项时显示）：红色 chip 列表
4. **分类统计**（5 张小卡，水平滚动）：
   - 硬装/软装/家电/工程/设计费，每张：分类名 + 金额 + 占比百分比
5. **月度趋势**（条形图，简易手写 SVG 即可，不要引重型图表库）：
   - 最近 6 个月，每月一根条，hover 显示金额
6. **Tab 切换**："账单明细" / "主材清单"（粘性）
7. **列表区**（根据 Tab 显示）：
   - 账单明细：按日期分组，每组显示日期标题 + 金额小计
   - 主材清单：按状态分组
8. **右下角浮动按钮**（FAB）：+（弹出选择"新增账单"或"新增主材"）
9. **新增/编辑表单**：Modal 弹窗（iOS 风格，半屏滑入）
10. **演示数据提示**（仅当 bills.length > 0 且 updatedAt < 某阈值时显示）

### 5.3 关键交互细节
- 长按列表项 → 弹出"编辑 / 删除"操作
- 滑动列表项 → 显示删除按钮（iOS 风格）
- 空状态：友好的插图 + "添加第一笔装修费用"按钮
- Loading：骨架屏
- 错误：toast 提示"加载失败，请重试"

---

## 6. 文件操作清单

### 6.1 必须删除
| 路径 | 原因 |
|---|---|
| `src/app/renovation/page.tsx` | 旧页面 |
| `src/components/renovation/RenovationTracker.tsx` | 旧组件 |
| `src/components/renovation/` | 整个目录 |

> ⚠️ 动手删除前，先把上面 2 个文件**复制到 `renovation-v2-history/` 备份**。

### 6.2 必须保留
- `src/lib/cloudbase.ts`（新增 `queryAllBills` / `createBill` / `updateBill` / `deleteBill` / `queryAllMaterials` / 等函数）
- `src/app/api/private-fund/*`（不动）

### 6.3 必须新建
| 路径 | 内容 |
|---|---|
| `src/app/api/renovation/bills/route.ts` | GET 全部 + POST 新建 |
| `src/app/api/renovation/bills/[id]/route.ts` | PUT + DELETE |
| `src/app/api/renovation/materials/route.ts` | GET + POST |
| `src/app/api/renovation/materials/[id]/route.ts` | PUT + DELETE |
| `src/app/api/renovation/summary/route.ts` | GET 聚合统计 |
| `src/app/api/renovation/seed/route.ts` | POST 注入种子 |
| `src/app/renovation/page.tsx` | 装修记账新页面（薄壳） |
| `src/components/renovation/RenovationDashboard.tsx` | 主组件 |
| `src/components/renovation/SummaryCards.tsx` | 总览卡片区 |
| `src/components/renovation/CategoryBreakdown.tsx` | 分类统计 |
| `src/components/renovation/MonthlyTrend.tsx` | 月度趋势条形图 |
| `src/components/renovation/WarrantyAlerts.tsx` | 保修提醒 |
| `src/components/renovation/BillList.tsx` | 账单列表 |
| `src/components/renovation/MaterialList.tsx` | 主材列表 |
| `src/components/renovation/BillFormModal.tsx` | 账单新增/编辑 |
| `src/components/renovation/MaterialFormModal.tsx` | 主材新增/编辑 |
| `src/components/renovation/FloatingActionButton.tsx` | + 按钮 |
| `src/data/renovationSeed.ts` | 种子数据 |
| `src/types/renovation.ts` | TypeScript 类型定义 |

### 6.4 必须修改
| 路径 | 变更 |
|---|---|
| `src/components/HomePage.tsx` | 改两个大按键 |
| `src/lib/cloudbase.ts` | 新增 renovation 相关 query 函数 |
| `package.json` | **不允许新增依赖**，全部用现有包（next/react/cloudbase-sdk/axios） |

---

## 7. 端到端自测清单（必须全部通过才能交付）

### 7.1 构建测试
- [ ] `npm run build` 成功（Next.js 15.3.9 + React 19.1.0）
- [ ] TypeScript 严格模式无错误
- [ ] ESLint 无 error（warning 可接受）

### 7.2 本地启动测试
- [ ] `npm run dev` 启动成功
- [ ] `curl http://localhost:3000/` 返回 200，HTML 中包含"聚财通录"
- [ ] `curl http://localhost:3000/renovation` 返回 200
- [ ] `curl http://localhost:3000/api/renovation/summary` 返回 200 + JSON

### 7.3 单元/集成测试（自写）
- [ ] 种子数据 seed API 调用一次后，bills.length === 12, materials.length === 8
- [ ] 创建账单 → summary.totalSpent 增加
- [ ] 删除账单 → summary.totalSpent 减少
- [ ] 付款进度计算正确（totalPaid / (totalPaid + totalPending)）
- [ ] 分类聚合金额与单条数据求和一致
- [ ] 月度趋势最近 6 个月都有数据（即使 0）
- [ ] 保修提醒 30 天内过滤正确

### 7.4 浏览器视觉测试
- [ ] 截图首页（移动端宽度 375px）—— 两个大按键垂直堆叠
- [ ] 截图首页（桌面端宽度 1280px）—— 两个大按键左右二分
- [ ] 截图装修记账页面（移动端）—— 总览卡片 2x2 网格
- [ ] 截图装修记账页面（桌面端）—— 总览卡片横排
- [ ] 截图新增账单表单弹窗
- [ ] 截图空状态

### 7.5 部署测试
- [ ] git commit 信息明确（含"renovation v2"）
- [ ] git push 成功
- [ ] Render 自动部署触发
- [ ] 等待 3-5 分钟部署完成
- [ ] `curl https://jucai-tonglu.onrender.com/` 返回 200
- [ ] `curl https://jucai-tonglu.onrender.com/renovation` 返回 200
- [ ] `curl https://jucai-tonglu.onrender.com/api/renovation/summary` 返回有效 JSON
- [ ] 浏览器实际访问 https://jucai-tonglu.onrender.com/ 视觉确认

### 7.6 回归测试
- [ ] `/private-fund` 仍然正常工作（没破坏现有功能）

---

## 8. 提交格式

subagent 完成后，必须在最后一条消息中提供：

```markdown
## 装修记账 v2 — 交付报告

### 完成度
- [x] 数据库 schema（bills + materials 集合已建）
- [x] API routes（9 个 endpoint）
- [x] 种子数据（12 + 8 条）
- [x] 前端页面（10 个组件）
- [x] 首页大按键（移动 + 桌面）
- [x] 端到端自测（构建 + 启动 + API + 部署）
- [x] git commit + push
- [x] Render 部署验证

### 关键文件
- src/app/renovation/page.tsx
- src/components/renovation/RenovationDashboard.tsx
- src/app/api/renovation/summary/route.ts
- src/components/HomePage.tsx（首页大按键）

### 自测结果
- npm run build：✅ 成功
- curl /：✅ 200
- curl /renovation：✅ 200
- curl /api/renovation/summary：✅ 200 + 有效 JSON
- git push：✅ commit xxx pushed
- Render 部署：✅ 验证通过

### 演示截图
（粘贴 4-6 张关键截图）

### 已知问题 / 后续优化
（如有）

### 部署 URL
https://jucai-tonglu.onrender.com/renovation
```

---

## 9. 风险与回滚

- **回滚方案**：Render Dashboard → 选上一个 commit → "Manual Deploy" → 选旧 commit
- **数据安全**：种子数据有"演示数据"标记，用户会手动清理
- **CloudBase 配额**：5GB 免费存储 / 50 万次读 / 4 万次写，初期完全够用

---

**任务结束。subagent 收到此 spec 后立即开始执行。**
