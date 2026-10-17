# r002 第一阶段审阅入口

本轮恢复 F2–F6 的整体目标，只准备第一步同版设计、交互预览和准入对账。业务交付仍未完成；不关闭 #10/#13–17/#19，不进入未准入的正式 Build。

## 业务路线与责任

S0仅资源前提已经交付；后续默认优先队列为S1真实OIDC/BFF/持久Access基础 → S2完整F2营销链 → S3完整F3管理旅程 → S4完整F4 SQL Scope → S5完整F5统一Operation/Outbox → S6A非生产资格 → S6B获准生产部署及回读。真实依赖是S1分别前置S2/S3，二者共同前置S4。P7仅影响S2及共同后继；P2/P4到位的S3可独立推进。S1不提前关闭F3，S6A不提前关闭F6。

| 事项 | 负责方 | 本轮实际结果 |
| --- | --- | --- |
| 原目标与完整分母 | Goal，当前主会话 | requirements.md保留R1–R9/AC01–16与F0/O1全矩阵，原件不改 |
| 拆分与准入 | Design提出、Goal接纳、独立Reviewer反查 | solution/design/architecture与每单元依赖；当前没有Build准入 |
| 业务进展判断 | 独立结果Reviewer核实际行为，Goal对账 | 预览/CI只作设计和软件证据，业务链仍NOT_RUN |
| 阻塞范围 | 阶段报告，Goal算影响，Human决策 | P1→S1依赖；P7→S2；P2/P4→S3；P6→对应生产出口 |
| 局部完成后的接续 | Goal | 阶段返回/合并后读回原AC、审查和当前main，再选择一个已准入单元；不以局部成功结束父目标 |

## 需要本版确认的业务含义

完整选择、依据及影响见[集中决策包](decision-review.md)。

| ID | 推荐 | 当前状态 |
| --- | --- | --- |
| P1 | Session空闲30分钟、绝对8小时；普通退出结束当前浏览器全部标签页 | 待Human确认，影响S1 |
| P2 | 邀请72小时单次、受控非生产投递、创建与送达分开显示 | 待Human确认，影响S3 |
| P4 | 同动作Scope可并集、委派不扩权、事务保护最后活动Owner | 待Human确认，影响S3 |
| P7 | 营销execute为草稿→启动、同事务回执；不触发真实外部触达/扣费 | 待Human确认，影响S2 |

这些候选不是既有批准。若只批准S1所需设计，后续建立S1精确intake，其他切片继续保留待决；不将局部批准扩成全模块锁。生产发布不在当前审批内。

## 预览入口与证明边界

在本PR分支的 `frontend/apps/console` 运行 `corepack pnpm exec vite --mode design --host 127.0.0.1 --port 5790 --strictPort`，浏览 `http://127.0.0.1:5790/__design/f-series`。依赖仍从frontend根目录安装锁定版本。

复用现有BasicLayout和组件；5790合成journal与5777/5778 origin隔离。生产构建排除预览代码。登录、邀请、营销结果均是审阅夹具，不是真实身份/发送/SQL/生产结果。当前只是关键交互预览，F4/F6完整屏幕还需在各自准入前细化。

实际验证、独立审查、失败修复和当前阶段返回以[validation](validation.md)及preview-evidence.json为准。本版未获得Human体验/设计批准，未生成design-to-build.json。
