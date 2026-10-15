# intent-design-v2 交接索引

这是 [Intent/Design 协议](INTENT-DESIGN-WORKFLOW.md) 的文件引用协议，不是运行配置或新的任务数据库。当前任务目录中的 `design-loop.json` 仅在申请 DESIGN_HANDOFF 时检查；草稿有未决问题时保持 DESIGN_REVIEW，不必伪造批准来使检查通过。

| 字段 | 类型与约束 |
| --- | --- |
| protocol / task_ref / revision | `intent-design-v2` / 权威任务来源 / r001 等轮次 |
| raw | `{path, sha256, source_ref}`；path 相对任务目录，原文不得覆盖 |
| optimized_prompt / intent | 各 `{path, sha256}`，派生提示与 IntentSpec；语义一致性另审 |
| trace | 数组：requirement_id、raw_quote、intent_ref（Intent JSON Pointer，如 `/objective`）、acceptance_ids、design_refs（已封存设计文件名，可带 `#定位`）；机械核对字段/文件存在，定位含义和原始要求完整覆盖由 reviewer 核实 |
| knowledge | 数组：path（相对仓库）、commit（完整 Git commit SHA；tree/blob 拒绝）、sha256、locator、relevance、status、use；检查 Git 原内容，不联网 |
| knowledge.status / use | accepted/proposed/superseded/conflict/documented/current_source/unknown；constraint/option/background/current_fact；constraint 只能 accepted，current_fact 必须当前文件内容一致 |
| conditions / preferences | 非空数组：id、status、blocking（bool）、source_ref；status 为 available/missing/unknown/not_applicable。缺失/未知须 owner/next_action；N/A 须 reason。含义由 source_ref 说明，偏好不自动成为授权 |
| decisions | 数组：id、trigger、question、options（至少两个互斥选项）、recommendation、answer、answer_ref；无待选分支时可空，不能替 Human 虚填答案 |
| frontend_change | bool；必须由真实变更性质审阅，不能用文件名或小 diff 豁免 UI |
| artifacts | solution.md / requirements.md / design.md / journey.md / flow.mmd 的 SHA256 映射；UI 另含 ux-analysis.yaml |
| preview | UI：kind=in_project、root=frontend/apps/console、candidate_sha、route、command、source_assets、reuse_refs、scenarios_ref、production_isolation_ref、browser_evidence（后三者均为 `{path, sha256}`）；非 UI：kind=not_applicable + reason |
| preview.source_assets | 仓库相对源码路径 → SHA256；含实际 Vue 页面，当前文件和 preview candidate 的 Git 内容必须一致；整个 frontend 已跟踪内容与未忽略新增文件也须与候选一致，不能只绑定一张页面或仅填独立 HTML |
| preview.browser_evidence | `{path, sha256}`；JSON 保存 candidate_sha、source_assets、route、scenarios_ref、production_isolation_ref（与 preview 完全相同）、result、scenarios、log（`{path, sha256}`）；引用须与被验证预览一致。静态检查只验证声明绑定，日志和实际浏览器执行另行核实 |
| handoff | owner=executing_model_outside_workflow、allowed_paths、forbidden_paths（规范化仓库相对路径/模式；allowed 必须有具体根，拒绝 `./`、越界、绝对和反斜杠）、acceptance_ids、execution_authority_ref（无则明确 none）、auto_execute=false；模型接手不由该文件授予权限 |
| review | decision=approved、scope=design、revision、record_ref、content_sha256；仅检查声明关联，真实身份和记录须独立回读 |

`content_sha256` 使用 `check_design_workflow.content_digest`：去掉且只去掉顶层 review 后，将完整 JSON 排序键、紧凑分隔、UTF-8、保留 Unicode、拒绝非有限数后计算 SHA256。避免自包含循环；这不认证签名。批准后必须同时核对被审 Git blob 与实际 Human 记录，不能靠重算摘要维持原批准。

任务内路径拒绝越界和符号链接。文件非空、大小有界、JSON 拒绝重复键。脚本不执行 command、handoff 或外部 URL。knowledge 的定位/ADR 状态、raw 完整覆盖、方案适用性、九维 YAML、生产预览隔离、运行日志与审批真伪均有语义/外部核验边界，PASS_STATIC_ONLY 不可升级成业务完成。

源码、测试或引用变化后重新收集证据和 Human 审阅；保留旧轮不覆盖。历史协议兼容工具不能当作此协议的替代检查。
