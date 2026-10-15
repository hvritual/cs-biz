# F1 r001 技术旅程（无 UI）

Actor：开发者/执行模型。对象：当前 cs-biz backend、锁定制品、一次运行的 Trace。非业务用户操作，不存在批量对象选定/导入、空列表、未开通业务页面；没有需要造假的 Screen 或产品 Preview。

| State | 系统动作 / Human 边界 | 结果与恢复 | AC |
| --- | --- | --- | --- |
| S01 输入检查 | 自动核对当前 commit、工具/制品摘要与安装根 | 缺失/过期/漂移即停；恢复固定来源，不选浮动 main | 01 |
| S02 生成/装配 | 自动 generate 两次、check、source/dependency/assembly、编译 | 漂移/缺绑定明确失败；不自修只读检查；改 PB 后重新生成 | 02–03 |
| S03 默认运行 | exporter关闭、JSON stdout、无SLS凭据 | 有效context关联；无context不编造；坏配置拒绝 | 04,06 |
| S04 查询 | 启动loopback栈、实际发请求、读取TraceID并精确查询span | 短暂延迟有界轮询；超时/空span失败，不用旧trace顶替 | 05 |
| S05 故障/退出 | collector不可达，重复Shutdown及超时测试 | 探针可用但导出失败可见；context到期退出，保留日志 | 05–06 |
| S06 交付 | 模型执行候选Full、内容审阅、receipt、合并后回读 | 未合格不合并/关闭；Human仅决定设计/例外/生产风险 | 07–08 |

本轮无可运行 cs-biz Consumer，S01–S06 为待实施验收旅程，不是执行记录。真实 DB/IdP 仍 BLOCKED_F3；Trace UI 查询不替代权限和持久化证明。

