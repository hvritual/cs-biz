# S0：已授权的 Docker MySQL 与真实非生产 OIDC

来源为 [原始 Human 要求](rounds/r001/raw-user.txt)，直接确认“搭建”；它只批准独立资源切片，不批准 P1–P5 业务规则或生产发布。基线 main `071078f597f8248ac1b282e6039ab02311bb85d8`，分支 `feat/yunka-f-series-completion`。本步骤为 #14 的前提交付，不关闭 #14/#13/#10。

WHY：可先建立真实 DB/IdP 条件，避免无关会话/邀请/Scope 选择拖住已授权资源工作。WHAT：固定 Docker 资源、私有随机状态/凭据、标准 OIDC 资源 code+PKCE 流程、双 schema 最小权限与持久重启。BOUNDARY：仅 `backend/deploy/identity/**`、`backend/deploy/README.md`、必要 `backend/ci/check.sh` 及本任务/导航；不改应用、前端、依赖/生成、旧封存、门禁判定或上游。PROOF：现有 Full 中真实 Docker/SQL/IdP、原测试、独立评审、候选/main receipt。

模式：资源 `harness_required`，风险 T3。当前没有本地 Docker，不将环境缺失当 TDD RED；静态/ownership反例先测，真实运行交支持Docker的 CI，失败原件保留。选择成熟非生产 Keycloak 是本资源任务的可替换技术实现，不引入业务会话策略或第二 IAM。

| AC | 明确通过/失败 | 反例、恢复与方法 |
| --- | --- | --- |
| S0-01 | 使用已记录 digest 的 MySQL/Keycloak 实际启动，所有暴露端口仅127.0.0.1；凭据运行时生成，Git/日志/artifact不含秘密 | 缺Docker、ready失败、缺secret/非法state/environment都不写PASS；真实Compose/Discovery/JWKS/SQL |
| S0-02 | `cs_biz` 与 `keycloak` schema账号各自可用且互相访问被拒绝 | 实际MySQL两个方向拒绝；root仅初始化/资源验证，不作业务账号 |
| S0-03 | 合成主体实际IdP code+S256 PKCE交换成功，code replay/错误verifier拒绝 | 实际HTTP/cookie/form/Token端点；管理bootstrap password grant与应用probe分开；不冒充BFF签名/audience验证 |
| S0-04 | MySQL/IdP重启后同一专用SQL标记及主体仍存在 | 先保留原操作/volume状态，未知不得重新初始化覆盖；只在允许中断的测试资源运行 |
| S0-05 | private state初始化拒绝覆盖/符号链接/非自有marker；开发停止保留卷，CI仅清理唯一生成的CI项目 | 静态所有权反例+实际CI资源生命周期；无删除开发卷快捷入口，不影响其他项目 |
| S0-06 | 普通expected-head合并之前精确候选独立评审及Full/receipt通过，随后main树/合并后资格通过 | 缺/旧/跳过不算通过；不降低检查；S0不证明F2/F3或生产完成 |

生产接入保留标准Provider边界和后续实际适配资格，不声称本包已实现BFF/Session或切换生产IdP。开发资源具体说明与启动命令见 [资源README](../../../backend/deploy/identity/README.md)。运行结果、失败/修复、实际镜像/源码/CI身份与最终状态以本步骤交付PR为准。
