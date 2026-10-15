# 来源与验证证据

真实仓库提交、具体 PR、工作流原始输出与真实环境回读，分别证明**不同层级**的事实。任何阶段只传递对应版本的证据，不从文档“PASS”推断未经执行的门禁。

| 证据 | 用途与边界 |
| --- | --- |
| [2026-10-15 Yunka/三权计划源证据](yunka-permission-plan-2026-10-15.md) | 固定 cs-biz/Yunka 源 SHA、PR #7/#8/#9 与 Issue #10–#17、仍未实现项 |
| [2026-10-12 来源快照](sources-2026-10-12.json) | **历史**空仓库/候选发布观察，不能视为最新 HEAD |
| [S00 验证](S00-validation.md) | 建仓期目录与结构检查历史记录 |
| [S01 验证](S01-validation.md) | 前端模板固定源码、构建/浏览器 Mock 旅程与当期提交证据 |

S00/S01 验证不等于 IdP/DB/API 成功；PR #8 的 Full 20 passed/1 skipped 仅属于它的固定候选；Yunka 独立 CI 不证明 cs-biz Consumer 的生产资格。阶段性接受需要实际 Go Toolchain/PB 生成零漂移/安全负例/API+DB/Browser 及适用的真实部署与 main 回读。
