# W08：父目标维护、切片准入与阶段返回

来源：2026-10-16 Human 先要求停止 F 系列，再要求重新设计五项责任，并明确“分析cs-biz仓库，按照上述要求修改工作流”。已审设计为本轮上一答的五项职责、Goal 外循环、局部冻结/完整分母、阻塞影响及停止反例。基线 main `9272114c7e79f3267820f393fcdd4b747b503f89`；本任务分支 `fix/goal-workflow-continuity`。已回读相关旧候选PR #23 / Issue #22：其Goal/Resume与Issue intake尚未合入、依赖旧工作流和旧Full等待，本轮不整包导入、不关闭#22；以当前main上的Goal/三阶段包修复本次任务流。修改仓库工作流与测试已获授权；F 系列仍停止，生产/产品实施不在本任务内；交付边界为可审阅、已测试的仓库变更，不推定新增部署或合并授权。

WHY：现有 Goal 文本有局部暂停/继续要求，但检查器将未决决定整体返回 Human，且阶段 consumer 没有父目标对账动作。WHAT：在现有 Goal records 加可选 coordination/control 投影；绑定原始 R/AC、逐单元准入与决定范围；分开前置条件和业务证据；阶段终态返回 Goal。BOUNDARY：仅现有工作流包/镜像、AGENTS 与必要任务导航、治理反例；不改 frontend/backend、门禁分级/断言、F0/F1/F系列封存原件或旧 module-outcome-v1 语义。

| AC | 明确结果 / 验证 |
| --- | --- |
| W08-01 | Goal 保留全部非可选 R 与已知 AC；遗漏业务出口、仅剩前置任务、越出原验收或复用漂移准入均拒绝 |
| W08-02 | 完整映射决定影响，只暂停相关节点及后继；独立已准入任务继续；无映射不假设独立；全部阻塞才请求相应 Human 决定 |
| W08-03 | 资源完成不产生业务 PROVEN；全部阶段完成但业务缺证据仍待验收；原环境/基线、独立review/真实readback缺失均不接受完成 |
| W08-04 | Design/Build/Deploy完成和阻塞返回RECONCILE_GOAL；未对账事件、变化观察、active候选、未知副作用、累计预算和同一候选恢复均受约束 |
| W08-05 | Human stop优先于进度/基线漂移；设计讨论不恢复产品实施；旧探索/操作格式兼容，旧封存不改，新样例明确EXAMPLE_ONLY |
| W08-06 | 实际运行反例、完整治理/包/文档检查与独立审查；同步Git候选及实际质量证据，不能把静态检查当真实业务或无人值守调度 |

执行命令：`python3 -m unittest discover -s doc/ci -p 'test_*.py' -v`、`python3 doc/ci/check_repository.py`、`python3 doc/ci/check_sdlc_workflow.py --mode structure`、`python3 .agents/skills/sdlc-workflow/scripts/check_docs.py`、`python3 .agents/skills/sdlc-workflow/scripts/check_packages.py`，固定依赖见 CI requirements。工作流/规则变更自动选 Full；本地主机缺 Docker/Go 时不声明本地后端通过。候选SHA、原始失败/修复、独立review、远端run/receipt与最终状态以对应PR实际回读为准。

本轮只更新项目自带 Skill，不修改账户个人 Skill。检查器是离线只读的绑定/路由检查；真实依赖充分性、审批、证据真实性由宿主与独立审阅负责。没有新增常驻runner、自动通知、生产操作或F系列续跑。
