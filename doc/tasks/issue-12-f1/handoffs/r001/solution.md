# F1 r001 方案：真实 Consumer，不复制框架

状态：DESIGN_REVIEW，尚未实施。完整范围由 requirements.md 维护。

## 背景与目标

F0 #11 已合并关闭，确定 D1=A、Go1.26.9 和权责。当前 backend 仍 go1.23.0，仅有 Authz V2 库；主线没有 Yunka Consumer。开放的 #21/#25 不能当作已集成，而且 #25 使用旧 SDK/Go 版本，不能直接合并满足 F1。

目标是让开发者在干净 cs-biz checkout 中，以锁定工具链一次完成生成/校验、运行本地基础探针，并按 TraceID 查询真实服务 span。所有证据绑定实际 cs-biz SHA；不宣布业务认证、租户 SQL 或生产可用。

## 选择与替代

推荐 A：以 backend 为唯一 Consumer module，使用已批准外部四模块与 CLI 制品；只加入只读本地运行探针、生成链及遥测。保留既有 Authz V2，无新 IAM、无业务双入口。
B 为等待 F2/F3 业务 API 后再接入，会延后 F1 独立验收；C 为复制上游 Consumer/旧 PR 全量实现，会引入旧版本、示例业务和第二来源，拒绝。
本轮推荐 A 是待确认的具体实现方案，不把 F0 的 D1=A 当作本轮审批。

## 条件、资源与边界

固定输入继续引用 F0 r005 versions.md / producer-record.json，不另造版本真源：SDK bc7c0e1dd6b4e815951130c7acfbf60371445453，CLI producer 3e46ec4d51b9c31bd9f687bb4f773b314cd57451，Go1.26.9 / language1.26.0、protoc3.21.12 与固定 plugins。
制品 run38734324861 / artifact11971414833，到期 2026-11-14T12:26:20Z；依赖发布或制品不可取得、摘要不符即阻断，不静默重建/换版本。CLI 需要 linux/amd64 与 /opt/hostedtoolcache/go/1.26.9/x64；安装根不能通过伪造检查绕过。
本会话 Docker/protoc 不在 PATH，Collector 本地运行尚未具备；在隔离的 Linux CI runner 实际运行同一 loopback 栈，保留可本机复现入口，不能把环境缺失写 PASS。
DB/IdP/Session/legacy group 保持后续阶段阻塞，不选默认。F1 无持久化，真实 DB 验收标 BLOCKED_F3，不从 Issue 的证据要求中删掉。

## 自动化与 Human

系统自动下载校验、精确匹配依赖图、生成/漂移比对、源码审计、启动隔离遥测栈、发送探针、轮询查询实际 span、清理资源和收集证据。Human 审阅本轮方案/使用条件及必要价值决策；不负责重复启动常规 CI。
没有批量业务对象选定，文本导入不适用；对工具锁使用结构化文件逐项比对，不让 Human 手工抄版本。
没有前端设计变更，因此 UX/项目可视化 Demo 不适用；技术流程见 flow.mmd，Trace Backend 是运行验收工具，不冒充产品 Demo。

## 风险与恢复

保留供应链 artifact 到期、工具安装根约束、上游固定 cloud.provider=alibaba_cloud 的事实；本地 Jaeger span 不证明 SLS 或云部署。日志使用允许字段，不记录请求体、原始 URL/query、Token/Session/PII。
坏配置启动明确失败；collector 不可达时业务探针与 stdout 可用但导出失败明确可见，不谎称查询成功；Shutdown/Flush 用有上限 context。不存在 DB 回滚；停止进程/本地容器、还原 F1 提交即可，不触碰生产数据。
