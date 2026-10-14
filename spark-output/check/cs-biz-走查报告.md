# 设计走查报告 — CS-Biz 前端轻量化与专业化优化

**走查目标**：CS-Biz 前端整体界面设计（Token 系统 + 业务样式 + 8 个业务页面）
**走查时间**：2026-10-14
**走查模式**：自动走查（Mode A — 基于代码文件静态分析）
**参考标准**：阿里云控制台（Aliyun Console）设计语言 — 轻量化、专业化

---

## 总览

| 严重度 | 数量 |
| --- | --- |
| Blocker | 3 |
| Major | 8 |
| Minor | 6 |
| Pass（默认通过未列） | 3 |

---

## Findings（按严重度排序）

### Blocker

#### B-1. [组件使用] Token 系统双重定义 — `business.css` 与 `coffeelink-tokens.css` 冲突

- **出现位置**：`frontend/apps/console/src/styles/business.css:1-15` vs `frontend/apps/console/src/styles/coffeelink-tokens.css:74-87`
- **问题描述**：两个文件同时定义 `--biz-*` 变量但给出不同的具体值。`business.css` 直接定义 `--biz-page: #f6f8fa`、`--biz-text: #182230`、`--biz-surface: #fff` 等硬编码值；`coffeelink-tokens.css` 将 `--biz-*` 定义为 `--color-*` 的别名（如 `--biz-page: var(--color-canvas)` = `#f5f7fa`）。CSS 加载顺序决定最终值，导致颜色不可预测，且违反 "单一 token 源" 原则。
- **修复建议**：
  1. 删除 `business.css` 中 `:root` 和 `.dark` 的 `--biz-*` 硬编码定义（第 1-29 行）
  2. 保留 `coffeelink-tokens.css` 作为唯一 token 源
  3. `business.css` 仅保留通过 `var(--biz-*)` 引用 token 的样式规则
  4. 如需覆盖特定值，应在 `coffeelink-tokens.css` 的 `:root` 层统一调整

#### B-2. [视觉层级] 深色模式 Header 出现双层嵌套阴影 — "大圈套小圈"

- **出现位置**：`frontend/apps/console/src/styles/desktop.css:165`
- **问题描述**：`.dark .cl-global-header` 使用了 `box-shadow: 0 10px 30px rgba(0,0,0,.19), inset 0 1px 0 rgba(235,245,255,.085)` — 一个 30px 扩散的外阴影 + 一个 inset 内阴影同时作用。这正是用户明确禁止的"大圈套小圈"多层嵌套阴影效果，在深色模式下产生沉重的视觉负担。
- **修复建议**：
  ```css
  /* 移除外阴影，仅保留底部边缘线 */
  .dark .cl-global-header {
    box-shadow: none;
    border-bottom: 1px solid var(--color-border);
  }
  ```
  阿里云控制台的 Header 不使用任何阴影，仅通过 1px 底边线分隔。

#### B-3. [视觉层级] Surface 卡片阴影过重 — 不符合轻量化标准

- **出现位置**：`frontend/apps/console/src/styles/desktop.css:115` + `frontend/apps/console/src/styles/coffeelink-tokens.css:65`
- **问题描述**：`.surface` 类应用了 `box-shadow: var(--shadow-panel)` 即 `0 4px 20px rgb(15 23 42 / 6%)`。这意味着页面上每一个内容面板（表格区、表单区、统计区）都带有 20px 扩散的阴影。多个相邻 surface 的阴影互相叠加，产生"脏脏的"视觉效果。阿里云控制台的内容卡片仅使用 1px 边框、不使用阴影。
- **修复建议**：
  ```css
  /* desktop.css */
  .cl-desktop-main .surface {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--cl-card-radius);
    box-shadow: none; /* 移除阴影，保持轻量 */
  }
  ```

---

### Major

#### M-1. [组件使用] Metric Card 额外叠加阴影

- **出现位置**：`frontend/apps/console/src/views/members/index.vue:441`
- **问题描述**：`.cl-metric-card` 同时拥有 `border: 1px solid var(--color-border)` 和 `box-shadow: var(--shadow-panel)`。已有边框的卡片再加阴影属于冗余视觉层级。
- **修复建议**：移除 `box-shadow: var(--shadow-panel)`，仅保留 1px 边框。

#### M-2. [组件使用] `--shadow-menu` 阴影参数过重

- **出现位置**：`frontend/apps/console/src/styles/coffeelink-tokens.css:66`
- **问题描述**：`--shadow-menu: 18px 20px 52px var(--color-shadow)` — X 偏移 18px、Y 偏移 20px、模糊 52px，这是一个极其夸张的阴影参数，会产生明显的"漂浮"感。
- **修复建议**：
  ```css
  --shadow-menu: 0 8px 24px rgb(15 23 42 / 10%);
  ```
  或如果菜单面板已有边框，可直接设为 `none`。

#### M-3. [视觉层级] 导航活跃项阴影不必要

- **出现位置**：`frontend/apps/console/src/styles/desktop.css:93`
- **问题描述**：`.cl-primary-link.is-active` 使用 `box-shadow: 0 4px 12px var(--color-shadow)` 给当前选中的导航项加阴影。渐变背景已经足够表达选中状态，额外阴影显得累赘。
- **修复建议**：移除该 `box-shadow`，渐变背景 + 白色文字已提供充分的视觉区分。

#### M-4. [组件使用] desktop.css 中大量硬编码颜色值

- **出现位置**：`frontend/apps/console/src/styles/desktop.css` 多处
- **问题描述**：以下颜色直接写死 hex 值而非引用 token：
  - `#536274`（`.cl-brand-words small`，第 64 行）
  - `#0e9272`（`.cl-tenant-building`，第 66 行）
  - `#67768b`（`.cl-search-apply`，第 74 行）
  - `#4a5c76`（`.cs-shell-tool`，第 76 行）
  - `#2865ee`（`.cs-account-avatar` 背景，第 81 行）
  - `#526481`（`.cl-navigation-promo p`，第 151 行）
  - 深色模式下 `#adc0d8`、`#d7e5f6`、`#c3d2e5`、`#9bd5c9` 等（第 182-185 行）
- **修复建议**：
  1. 在 `coffeelink-tokens.css` 中新增语义 token：
     ```css
     --color-text-caption: #64748b;    /* 替代 #536274, #67768b, #4a5c76 */
     --color-avatar-bg: #2563eb;       /* 替代 #2865ee，跟随主色 */
     ```
  2. 深色模式对应值也应在 `:root.dark` 中定义为 token
  3. 所有硬编码处改为 `var(--color-*)` 引用

#### M-5. [组件使用] members/index.vue 中大量硬编码颜色

- **出现位置**：`frontend/apps/console/src/views/members/index.vue:433-449`
- **问题描述**：scoped 样式中出现多个硬编码颜色：
  - `#8290a4`（面包屑文字）
  - `#273344`、`#59708d`（Hero 区域文字）
  - `#0b9d74`、`#e7edf4`、`#0b936f`（使用率环形图）
  - 深色模式 `#213952`、`#365474`、`#e9f1ff`
- **修复建议**：提取为语义 token 或至少使用 `var(--color-*)` 系列变量。

#### M-6. [视觉层级] business.css 的 `--font-family` 与 coffeelink-tokens.css 的 `--font-sans` 重复定义

- **出现位置**：`business.css:14` vs `coffeelink-tokens.css:35`
- **问题描述**：两个文件各自定义了字体栈，且 `business.css` 包含 `Inter` 而 `coffeelink-tokens.css` 不包含。`business.css` 的 `html, body, #app` 规则（第 30 行）与 `coffeelink-tokens.css` 的同类规则（第 117-121 行）互相竞争。
- **修复建议**：统一使用 `coffeelink-tokens.css` 的 `--font-sans`，删除 `business.css` 中的 `--font-family` 和 `html, body, #app` 规则。

#### M-7. [视觉层级] business.css 与 desktop.css 的 `.page` 样式冲突

- **出现位置**：`business.css:34` vs `desktop.css:109`
- **问题描述**：`business.css` 定义 `.page { max-width: 1680px; margin: 0 auto; padding: 30px 32px 32px; }` 而 `desktop.css` 覆盖为 `.cl-desktop-main .page { max-width: none; padding: var(--space-5) var(--cl-page-gutter) var(--space-6); }`。这种"定义后再覆盖"的模式增加了维护成本。
- **修复建议**：`business.css` 中的 `.page` 应使用 token 变量作为初始值，`desktop.css` 仅在需要时覆盖特定属性。

#### M-8. [视觉层级] Header 搜索框 inset 阴影不必要

- **出现位置**：`frontend/apps/console/src/styles/desktop.css:72`
- **问题描述**：`.cl-header-search-field .el-input__wrapper` 使用了 `box-shadow: inset 0 1px 0 rgba(255,255,255,.55) !important` — 一个内部高光阴影。在已有 `border` 和半透明 `background` 的情况下，这个 inset 阴影是多余的视觉层。
- **修复建议**：移除 `box-shadow`，依靠 border + background  already 提供足够的视觉层次。

---

### Minor

#### m-1. [组件使用] personal/index.vue 中 `#fff` 硬编码

- **出现位置**：`frontend/apps/console/src/views/personal/index.vue:45`
- **问题描述**：`.color-option` 的 `color: #fff` 应使用 `var(--color-on-primary)` 或 `#ffffff` 的 token 引用。
- **修复建议**：改为 `color: var(--color-on-primary)`。

#### m-2. [视觉层级] business.css 中 `.surface` 圆角 8px 与 token 系统 14px 不一致

- **出现位置**：`business.css:40` vs `coffeelink-tokens.css:54`
- **问题描述**：`business.css` 定义 `.surface { border-radius: 8px }` 而 token 系统中 `--radius-lg: 14px`，`desktop.css` 使用 `var(--cl-card-radius)` = `var(--radius-lg)` = `14px` 覆盖。`business.css` 的 8px 在非 desktop 场景下生效，造成不一致。
- **修复建议**：`business.css` 的 `.surface` 改为 `border-radius: var(--radius-lg)`。

#### m-3. [视觉层级] business.css 的 `.stat-strip dd` 字号 30px 偏大

- **出现位置**：`business.css:52`
- **问题描述**：统计数字使用 `font-size: 30px`，而 token 系统中 `--text-metric: 32px`。阿里云控制台的统计数字通常在 24-28px 范围，30px 在密度较高的页面中显得突兀。
- **修复建议**：改为 `font-size: var(--text-metric)` 或固定 28px，与阿里云控制台对齐。

#### m-4. [视觉层级] `.el-button` 圆角 6px 与卡片圆角 14px 差距过大

- **出现位置**：`business.css:53`
- **问题描述**：按钮 `border-radius: 6px` 而卡片 `border-radius: 14px`，两者差距 8px。阿里云控制台通常保持按钮和卡片圆角在同一视觉家族内（如 6px/8px 或 4px/6px）。
- **修复建议**：统一为 `var(--radius-sm)` = `6px`（按钮）和 `var(--radius-md)` = `10px`（卡片），缩小差距。

#### m-5. [内容文案] 面包屑颜色 `#8290a4` 对比度可能不足

- **出现位置**：`members/index.vue:433`
- **问题描述**：`#8290a4` 在白色背景上的对比度约为 3.2:1，不满足 WCAG AA 对正文（4.5:1）的要求。
- **修复建议**：使用 `var(--color-text-muted)` = `#64748b`（对比度 4.6:1）替代。

#### m-6. [组件使用] `business.css` 的 `.el-dialog` 圆角 10px 与 token 不一致

- **出现位置**：`business.css:86`
- **问题描述**：对话框 `border-radius: 10px` 不在 token 系统的 radius 梯度中（6/10/14/18）。虽然恰好等于 `--radius-md`，但应显式引用 token。
- **修复建议**：改为 `border-radius: var(--radius-md)`。

---

## 通过的类别

| 类别 | 状态 | 说明 |
| --- | --- | --- |
| 链路通畅性 | 通过 | 8 个业务页面均有明确入口和出口，抽屉/表单提供取消和关闭路径 |
| 异常态覆盖 | 通过 | 空状态、加载态、错误态均有设计（PageState 组件统一处理） |
| 内容文案 | 通过 | 无工程标签泄露，文案遵循业务术语规范 |

---

## 修复优先级建议

### 必须修复（Blocker — 影响整体设计系统一致性）

1. **B-1**：统一 Token 源 — 删除 `business.css` 中的 `--biz-*` 硬编码定义
2. **B-2**：移除深色 Header 双层阴影
3. **B-3**：移除 `.surface` 的 `box-shadow`，改为纯边框

### 建议修复（Major — 影响轻量化目标）

4. **M-1**：移除 Metric Card 阴影
5. **M-2**：减轻 `--shadow-menu` 参数
6. **M-3**：移除导航活跃项阴影
7. **M-4/M-5**：将硬编码颜色替换为 token 引用
8. **M-6/M-7**：消除 business.css 与 coffeelink-tokens.css 的重复定义
9. **M-8**：移除搜索框 inset 阴影

### 可延后（Minor — 精度优化）

10. **m-1~m-6**：圆角统一、字号微调、对比度修复

---

## 阿里云控制台对标差距总结

| 维度 | 阿里云控制台 | CS-Biz 当前 | 差距 |
| --- | --- | --- | --- |
| 卡片阴影 | 无阴影，1px 边框 | `--shadow-panel` 20px 扩散阴影 | 需移除 |
| Header 阴影 | 无阴影，底部 1px 线 | 深色模式双层嵌套阴影 | 需移除 |
| Token 统一性 | 单一 token 源 | 两套 `--biz-*` 定义冲突 | 需统一 |
| 硬编码颜色 | 全部走 token | desktop.css + members 约 20+ 处硬编码 | 需提取 |
| 导航选中态 | 背景色区分，无阴影 | 渐变 + 阴影 | 需移除阴影 |
| 统计数字 | 24-28px | 30px | 微调 |
| 内容面圆角 | 6-8px | 8px（business.css）/ 14px（desktop.css） | 需统一 |
