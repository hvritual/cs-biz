# 历史产物协议与保留的验证入口

## 来源与身份

源包：本次会话先前交付的 `codex-sdlc-revision-bundle-v0.4.0.zip`，核对了其核心脚本与合成例子。该包不在 cs-biz 仓库中。本目录存放的是**兼容实现**，并非把源包源代码逐字节导入。版本兼容只对本次覆盖的输入结构/规则作保证。

| 原始模块 | 原版 SHA256 | 当前 cs-biz 对应入口 | 状态 |
| --- | --- | --- | --- |
| `prompt-optimizer/scripts/decision_gate.py` | `ea0df62f275813fce8760076aee1d3ac470b2004534eedd9a950914907b787aa` | `doc/ci/check_intent_v02.py` | 结构／约束／决策树子集 |
| `sdlc-design/scripts/revision_core.py` | `670bb02a4ffde7f92580221682823ef715c139a8359e54bdc602dc791fabcaf5` | `doc/ci/check_revision_v04.py` | 修订、快照、保留项只读验证子集 |
| `sdlc-design/scripts/revision_store.py` | `36d2b52d3ad7ce9242021e8445591d0cca9bbab75855b660b83d68ae72c472af` | 尚无 | **未迁移**：独占写、CAS、封存、恢复 |
| `sdlc-build/scripts/build_gate.py` | `51241acf2db2e481f43ba8dba69bec6c1e53e8cdc3a9067581444cdcbd8417ee` | `doc/ci/check_build_v04.py` | 证据结构／覆盖／TDD 与五模式验证子集 |
| `sdlc-workflow/scripts/sdlc_gate.py` | `f8df760495832b82095b39cd6987f893407998d2adc5c6a7be1d7c68250ac58d` | `doc/ci/check_sdlc_workflow.py` | **轻量阶段契约**，不是原版完整阶段门禁 |

不要把兼容子集称为原版完整移植；不符合旧格式或遗漏字段时必须显式失败／停在不确定状态。

## 按现有产物选择协议

| 实际输入 | 保留的 CLI | 机械证明边界 |
| --- | --- | --- |
| request.json / sdlc-artifact-v1 | 所属阶段 scripts/check_workflow.py | 当前 package/定义/输入/产物绑定，读取 JSON state，不授予执行 |
| design-loop.json / intent-design-v2 | doc/ci/check_design_workflow.py --task TASK --repo-root . | 已审包、source/Preview/范围/引用一致性，不认证 Human 或浏览器 |
| intent-spec.json / v0.2 | doc/ci/check_intent_v02.py FILE --repo-root . | 原始要求/决策树结构子集 |
| design-revisions.json / controlled-revisions-v1 | doc/ci/check_revision_v04.py --task TASK | 修订/反馈/保留/快照；只读，不提供写入 CAS/封存服务 |
| build-loop.json + build-scope.json / v0.4 | doc/ci/check_build_v04.py --task TASK | R/AC/范围/合法 TDD/五模式与证据结构 |
| intent.json + design-preview.json + build-manifest.json | doc/ci/check_sdlc_workflow.py --mode intent/design/build --task TASK | 简化旧协议；不能拿 demo.html 代替当前项目 Preview |
| module-contract.json / module-outcome-v1 | doc/ci/check_module_workflow.py | 冻结清单、依赖、锁和观察结构；不认证真实完成 |

命令中的 TASK/FILE 替换为实际记录。旧 CLI 是有真实消费者/反例的兼容适配，保留；纯转发 Skill 名字和文档指针已移除。原始源码/版本/模块名称仅作来源，不是当前可调用的 Skill。

历史记录按其精确 commit 运行，当前源码漂移时不重签旧 HASH 或批准。简化协议、v0.4、v2 和当前 envelope 不混用。真实外部 CI/评审身份、运行/生产、原版未覆盖的 CAS/崩溃场景仍需独立证据；本兼容子集不是原版完整迁移。现行交付政策从 doc/ci/RISK-BASED-GATES.md 读取，不执行旧报告中的 blanket Human 等待。
