# W04 验证记录

本次交付是 SDLC 工作流重构，不是业务功能或应用部署。任务与验收见 [W04](W04-three-stage-agents.md)。基线为 main `0085c7426cd972babe38b3703a4dbb4ee25229a0`；最终 PR 的精确 head/base、真实 Full run、独立 quality receipt、合并 SHA 与 main 回读保存在 PR 中，避免把候选自述当成远端通过证明。

## 结构与能力

| Agent / 所有者 | 单一职能能力 | 下游文件 |
| --- | --- | --- |
| Design / sdlc-design | capture、research、intent、solution、ux、preview、acceptance、language、handoff | design-to-build.json |
| Build / sdlc-build | admit、plan、implement、verify、review、integrate、handoff | build-to-deploy.json |
| Deploy / sdlc-deploy | admit、plan、execute、observe、recover、handoff | deploy-receipt.json |

三包各自包含 Agent 指令与标准 TOML、控制清单、内部 Skill、Schema、模板、样例和检测脚本。内部能力只产出当前结果；Agent 串联、检查与选择后续能力。只返回当前 Skill 文本及绑定的输入/资源路径，不加载整个能力目录。原入口为兼容转发；历史任务、产品源码和封存验收保持不变。协议与迁移映射见 [归属](../../.agents/skills/sdlc-workflow/references/migration.md)，定义依据见 [标准来源](../../.agents/skills/sdlc-workflow/references/standards.md)。

## 实际本地验证

- 原 136 项治理测试与新增 45 项行为测试合计 **181 项通过**；新测试由工作流 Skill 所有，doc/ci 仅作为发现桥。
- 三包结构、原生注册镜像、消费者契约、通用脚本一致性、正例/阻塞/失败/未知样例，以及逐包复制到独立临时目录后运行全部通过。
- 31 个新增或修改的 Skill 定义通过 skill-creator quick_validate；仓库结构/链接、旧 Build/Design/模块入口、权限与质量策略、前端交付策略及 diff 空白检查通过。
- 原始命令/退出码/输出见 [本地记录](W04-evidence/local-validation.json) 和 [Skill 格式记录](W04-evidence/skill-validation.json)。exit 0 可以表示结构合法的 BLOCKED；必须读取 JSON state，不能把退出码当完成证明。

独立审查先发现并复现范围扩张、冻结产物被替换、发布包交接不一致、执行前缺少持久操作 ID，以及 UI 产物未绑定已审设计包五类缺口。修复后分别加入反例。最终审查重新检查实际修复、真实 Git 快照 UI 正反例、全部 181 项测试与独立复制检查，未发现剩余阻塞项。审查没有修改实现。

## 前向 Agent 应用

使用无会话历史的新 Agent，仅提供所属工作流路径、局部任务输入和允许写入的任务目录；不提供预期答案，不读取其他案例或测试。原始输入、产物、校验输出及逐文件摘要保留在 [前向记录](W04-evidence/forward-replay.json)。

| 阶段 | 实际产出与退出 | 证明的边界 |
| --- | --- | --- |
| Design | solution 与技术设计；BLOCKED | 识别原始需求 reviewed_design 与冻结 intake deployed 的冲突，不暗改冻结边界 |
| Build | harness_required 计划；结构下一步 implement | 给出输入/输出断言、负例、真实测试入口待核实及独立审查出口；未执行实现 |
| Deploy | recover；BLOCKED / unknown | 保留操作 ID 和 null 发布身份，缺真实目标/授权工具时不重试或回滚 |

前向应用后仅清理 artifact_io.py 文件末尾一个空行；保留原始产物且不重签，按精确评估版本复制包回放三次均通过。版本摘要及差异在前向记录中明确区分。发布版本的样例已重新生成，全部本地回归重新运行。此处为指令驱动 Agent 使用证明；当前环境没有 Codex CLI，原生角色发现/启动仍为 NOT_VERIFIED。

本次没有真实部署、没有借用示例 URI 签署批准，也没有运行 SDK/API 服务。静态检测始终保留 authentic_approval/runtime=NOT_VERIFIED、execution_granted=false。实际执行仍由 Agent 根据原始授权、当前项目事实和独立外部证据判断；工作流安装本身不授权任何部署。
