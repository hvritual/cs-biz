# F1：固定 Consumer、生成零漂移与可查询 Trace

## 状态与来源

状态：DESIGN_REVIEW / NOT_IMPLEMENTED。来源：[Issue #12](https://github.com/hvritual/cs-biz/issues/12)，父任务 #10；用户本轮原文“开始完成下一独立任务”。基线 main `e05569db8332ad395911d53b667830989923019d`。
使用 task-progression、prompt-optimizer、sdlc-design、engineering-language；设计确认后由执行模型使用 sdlc-build 实施、核实和门禁。Skill 不授予审批权。

本轮产物为 [r001 方案](rounds/r001/solution.md)、[需求与验收](rounds/r001/requirements.md)、[实现设计](rounds/r001/design.md)、[技术旅程](rounds/r001/journey.md)、[流程](rounds/r001/flow.mmd)、原文与可追溯索引。未获本轮同版设计确认；不伪造 DESIGN_HANDOFF，不关闭 #12。

## 授权与边界

用户要求开始下一独立任务，承接既有推送/合并授权；不能据此批准模型新拟设计。当前先做 F1 规划/审查，设计确认后在限定范围实施。没有生产部署、真实客户数据或其他 PR 合并授权。
允许范围和恢复详见 design.md；F0 封存设计、既有前端与 Authz V2 断言不可改。

## 交付与剩余

本轮仅设计文档；Go1.26.9 接入、实际 cs-biz 生成、Collector 查询、候选 Full、独立审阅和 main 回读均未执行。DB/IdP 仍由 Human 在 F3 前决定，不从 F1 推定完成。
非 UI：没有业务页面/交互变更，项目 Preview 不适用，不创建独立假 Demo。可视化为本轮技术流程，不冒充可运行界面。
下一动作：Human 确认本轮完整方案后，执行模型实施此 F1 独立切片；若不同意，按明确反馈建立 r002。
