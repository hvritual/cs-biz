# F1：固定 Consumer、生成零漂移与可查询 Trace

## 状态与来源

状态：DESIGN_HANDOFF / IMPLEMENTING，未完成交付。来源：[Issue #12](https://github.com/hvritual/cs-biz/issues/12)，父任务 #10；用户本轮原文“开始完成下一独立任务”，随后于2026-10-16T07:26:29+08:00回复“确认”。基线main `e05569db8332ad395911d53b667830989923019d`。
使用 task-progression、prompt-optimizer、sdlc-design、engineering-language；设计确认后由执行模型使用 sdlc-build 实施、核实和门禁。Skill 不授予审批权。

本轮产物为 [r001 方案](rounds/r001/solution.md)、[需求与验收](rounds/r001/requirements.md)、[实现设计](rounds/r001/design.md)、[技术旅程](rounds/r001/journey.md)、[流程](rounds/r001/flow.mmd)、原文与可追溯索引。完整r001方案A在PR31 / 2f60a1b获真实同版确认，见 [交接](handoffs/r001/HANDOFF.md)；原rounds字节保留。

## 授权与边界

用户要求开始下一独立任务，承接既有推送/合并授权；本轮同版设计已明确确认，执行模型在限定范围实施、验证和交付。没有生产部署、真实客户数据或其他PR合并授权。
允许范围和恢复详见 design.md；F0 封存设计、既有前端与 Authz V2 断言不可改。

## 交付与剩余

实现与本地证据见 [实施记录](delivery/implementation.md)，Collector查询、候选Full/回执、内容审阅及main回读需实际完成才关闭#12；最终状态以PR/Issue真实回执为准。DB/IdP仍由Human在F3前决定，不从F1推定完成。
非 UI：没有业务页面/交互变更，项目 Preview 不适用，不创建独立假 Demo。可视化为本轮技术流程，不冒充可运行界面。
下一动作：完成本候选实际门禁和Trace查询；权限/环境不足明确阻断，不重复要求Human批准普通工程步骤。
