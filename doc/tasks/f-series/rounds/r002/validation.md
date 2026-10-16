# r002 验证、失败与阶段返回

基线 main `191189ba63ffcbda8f62be1981ae3b892172a9c9`，统一分支 `feat/yunka-f-series-delivery`，候选 [PR #41](https://github.com/hvritual/cs-biz/pull/41)。本轮仅设计和隔离预览，业务 R/AC 不因以下技术验证转为 PROVEN。

## 已观察的失败及修复

| 候选/运行 | 原观察 | 修复/处理 |
| --- | --- | --- |
| 本机浏览器安装 | 两个固定引擎CDN均返回损坏包，无可用Chromium | 停止重复下载；使用项目现有自动Full真实runner；没有更改门禁或换随机浏览器 |
| C1 `c7efdad` / [38923851394](https://github.com/hvritual/cs-biz/actions/runs/38923851394) | 身份通过；空菜单仍显示4项；Checkbox测试点击隐藏输入超时 | 预览响应式菜单slot；点击可见label且断言导出可用；保留失败原件 |
| C2 `d4ecb75` / [38924378179](https://github.com/hvritual/cs-biz/actions/runs/38924378179) | 新修复候选被后续候选替代并取消 | 不计PASS |
| C3 `d5b51c4` / [38924558890](https://github.com/hvritual/cs-biz/actions/runs/38924558890) | 类型核实发现runner Locator不支持嵌套locator；该run被替代取消 | 同义顶层CSS定位；实际类型检查通过；不计PASS |
| C4 `935b58d` / [38924775697](https://github.com/hvritual/cs-biz/actions/runs/38924775697) | 身份与邀请/范围/双语通过；营销/双tab在Select输入被文字层覆盖时点击超时 | 点击可见wrapper、真实选项选择及全部结果断言不变 |
| C5 `f80c3fa` / [38925798479](https://github.com/hvritual/cs-biz/actions/runs/38925798479) | 身份、邀请、双真实tab通过；最后一次嵌套深链在应用启动完成前即时读路径失败；原failure DOM仅有root | 等待路由及拒绝标题真实出现；不取消原路径断言；主题/英文截图等待对应控件/壳层加载 |

| C6 `5eaf258` / [38926600179](https://github.com/hvritual/cs-biz/actions/runs/38926600179) | 真实拒绝URL包含合法from查询参数，测试结尾正则不接纳；英文DOM已经翻译而测试误查button，实际为menuitem | 接纳URL查询参数但保留pathname/拒绝标题；验证壳层真实ARIA和品牌英译 |

独立内容审查曾以CHANGES_REQUESTED指出租户/Session分裂、跨tab旧快照覆盖未知记录、整批邀请误消除、营销Scope和旧导航状态。修复使用单一设计状态、Web Locks最新合并、storage同步、逐项回读和隔离guard。它们只是预览夹具机制，不冒充真实BFF/DB权限或幂等事务。

## 最终预览候选

精确运行候选 `ff488d1ceda6ed85d92607f1149d96a2aba3df39`，tree `812a6c272ac407c779aba7a5a5438b4f903e27bc`。现有自动 [Full 38928327116 attempt 1](https://github.com/hvritual/cs-biz/actions/runs/38928327116) 的classify/backend/frontend/quality-gate全部success；[原始回执](evidence/quality-receipt.json)为QUALIFIED，base/head/PR/tier/attempt已独立读取核对。

真实tester-army 5/5通过（4条新增设计旅程+1条保留旅程）；Playwright原回归16通过，唯一Mobile跳过仍为原策略。Fast47单元测试及类型/lint/双语/Desktop/policy通过。原始[浏览器摘要](evidence/browser-summary.md)、[派生结果索引](evidence/browser-results.json)和[截图索引](evidence/screens.json)关联原artifact与SHA；[预览证据](preview-evidence.json)绑定全部变更frontend源码及当前候选。CI浏览器artifact按现有策略保留7天，源码/复现命令及摘要可继续复核。

C7隔离在首渲染前发布空Mock导航，仅允许实际已注册审阅路径及专用拒绝页；根/嵌套/未知审阅地址均拒绝并可回到原操作。unknown截图含对话退出过渡，稳定可操作性由随后真实交互证明，不能仅凭单帧截图推断。复查中文/英文与深色实图，成功回读后旧拒绝提示已清除。后续证据整理和硬依赖修正仅修改文档；frontend相对C7保持字节一致，最终文档候选仍按现有门禁资格核实。

本地已实跑：冻结锁安装、Fast（47单元测试与类型/lint/copy/Desktop/policy）、E2E类型；生产构建11/11及设计入口/fixture标记排除。最终CI必须覆盖当前精确候选，旧部分PASS不能代替。

## 设计验收与Goal返回

D-01来源和原件保留、D-02完整分母及依赖映射已独立内容核实。D-03上述关键场景实际浏览器证明通过；未覆盖的CRM/F6完整屏幕仍是后续切片设计义务。D-04[独立审查](independent-review.md)的内容与已测技术体验部分通过，Human同版设计/体验确认仍未取得。

Goal读回：没有新增真实OIDC/BFF/持久Access/营销Domain/Scope SQL/Outbox/生产结果；没有关闭原业务Issue。当前没有可直接进入Build的intake。P1影响S1及依赖、P7影响S2及共同后继，P2/P4影响S3及共同后继；S3不依赖S2实现，P6仅影响对应生产资格。最小后继是提交当前同版设计给Human审阅；本轮不重问已确认MySQL/OIDC/单分支方向、不扩散生产阻塞。实际Human确认后，Goal建立对应已获准切片的精确Design/Build准入，再沿原目标继续。
