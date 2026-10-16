# r002 方案：兑现 F2–F6 的真实业务链

状态：DESIGN_REVIEW，尚未获本版 Human 设计批准。来源为 [本次原文](raw-user.txt)、[现行事实](sources.json)、[原始 F 系列验收](../r001/requirements.md)。本轮恢复设计；原停止事件留存，不重写 r001。实施/合并沿已有授权逐切片准入；生产发布另需具体目标和批准。

## 背景与结果

现有 Console 是本地 Mock，后端只有纯 Go Authz 与固定 Yunka 技术探针；S0 的真实资源不是业务 IAM。目标是成员可信登录、在当前标签页选择企业、按当前 Function 及对应 Scope 操作真实业务，并在撤权、拒绝、失败和回复丢失后得到可信结果。

不重做 F0/F1、不整体合入已归档 PR、不创建第二套角色权威或工作流引擎。方案只回答推进与取舍，具体数据/API/事务组织见 [设计](design.md)，逐项通过/失败见 [验收](requirements.md)。本轮不实施正式后端/业务客户端，不声称 F2/F3 已完成。

## 路线选择与反证

| 路线 | 判断 | 代价与反证 |
| --- | --- | --- |
| 复用固定 Yunka + 当前 Access 权威 + 标准 OIDC BFF + Docker MySQL | 推荐；继承已确认的框架、供应端与三权语义 | 当前 Access Store/BFF/Domain 真实实现缺失；必须补真实 SQL/API 测试 |
| 按 F2 编号先做营销、临时身份/权限后补 | 不采用 | 不能满足真实主体与当前 grants，容易形成第二权威或重复迁移 |
| 先全量重写 IAM/Console 再整包合并 | 不采用 | 反馈周期过长，合并风险与无业务进展问题重现；使用小型完整纵向切片 |

## MVP / Full Runtime / Production

| 单元 | 输入、结果、业务后继 | 不在本单元宣称 |
| --- | --- | --- |
| D：当前设计 | 原 R/AC、实际来源、场景预览、决策包、独立覆盖审查 | 无 Human 本版确认不发 Build handoff；不伪造全模块 lock |
| S1：F3 可信基础 | 已验资源 + 获准 P1；可信 OIDC/BFF、持久 Access 只读权威、0/1/N 企业与独立标签页上下文，为 S2 提供真实主体 | 不关闭完整 F3；测试夹具是测试主体，不是生产 bootstrap 权限 |
| S2：F2 营销纵向链 | S1；营销 read/execute、真实 Domain/回执、Function-only 与拒绝无副作用、浏览器到 DB Trace | 不以 Menu 缺失拒绝合法营销；不把重复抑制当响应重放 |
| S3：F3 完整身份管理 | S1/S2 的集成回读 + P2/P4；邀请/成员/角色/Owner/撤权/会话旅程与双标签页 | 无真实投递资源时不宣称生产邀请或恢复完成 |
| S4：F4 SQL Scope | S2+S3；CRM/营销每动作 tenant/self/assigned/explicit SQL 范围、批量/导出/统计和竞争 | legacy group 保持原已审 fail closed；不得改授或扩大范围 |
| S5：F5 统一执行 | S4；完整路由清单、HTTP/gRPC/Child/Worker、UoW/Outbox、回滚与旧入口下线 | 未测 transport/未定义业务效果不能从分母删除 |
| S6A：F6 非生产资格 | S3–S5；固定 Consumer/schema 的迁移/备份恢复/并发/故障/安全/观测和发布材料 | 不关闭完整 #17，不等于生产部署 |
| S6B：F6 生产回读 | S6A + P6 生产资源/SLO/策略 + 显式发布/回滚权；真实环境验收 | 没有目标环境或 SLS 开启证据时不得宣布 F6 / O1 完工 |

全部采用单一分支 feat/yunka-f-series-delivery，一次一个 active 候选，每步独立 PR/main 回读后同分支快进继续。设计分支与后续实现复用；本 PR 只交付待审设计和隔离预览。

## 影响、自动化与资源

正式交付将影响 backend 的 contracts/source-owned identity/access/marketing/crm、SQL 迁移/Repository、受控 Console typed-client 和对应 CI。源事实与类型由 canonical PB/SQL/Access 各自所有者维护；不复制 schema 或手改 generated。

系统负责确定性校验、文本去重、权限内精确匹配、关联原 operation 的回读。Human 负责新业务策略、歧义和最终风险选择。批量邀请设计采用逐行邮箱粘贴→格式/去重/范围核对→影响确认→逐项结果，选择不发送；未知结果只查询原任务，不整批重发。

外部邮件、SLS、生产 IdP、TLS/secret、容量/SLO 尚无当前资源。只阻塞其对应结果和依赖；不阻塞独立设计/安全测试准备。MySQL/OIDC 资源方向不重问，S0 运行资格在实施时复核镜像/制品时效。

## 当前需要 Human 的决定

仅 [决策包](decision-review.md) 的 P1/P2/P4/P7 是本轮待定产品/安全含义；P3/P5 已有基础约束直接继承，P6 留到具体生产候选和资源齐备时。批准本设计不是承认运行/生产已经完成。
