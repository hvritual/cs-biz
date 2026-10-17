# r002 用户旅程与屏幕状态

同版项目入口 /__design/f-series，外层明确设计预览与无真实发送。实际可点击的旅程是供Human评审的模拟，不证明真实IdP/DB/授权。功能状态均由隔离origin下的合成fixture（按用户/企业journal、每标签页企业选择）决定；后端断言另见requirements.md。

| Screen / State | 用户目标与系统动作 | 用户动作、影响与结果/恢复 | AC |
| --- | --- | --- | --- |
| ID-01 / signed_out | 登录组织账号，不在应用输入新密码 | 继续登录→预览标准供应端回调结果；实际实现交真实IdP | AC03/04 |
| ID-02 / no_org、one_org、many_org | 系统查当前active membership，0企业给联系管理员，1企业直接进入，多企业展示选择 | 只选有权企业；未知/失败不回用旧权限；待邀不当活动成员 | AC05 |
| WS-01 / active、switching、denied | 当前标签页企业可见；切换清理旧业务与晚到结果 | 新目标失败显示重试/重新选择，两个标签上下文独立 | AC05/TEN-01 |
| MKT-01 / ready、confirm | 无Console Menu但有营销Function成员打开独立营销入口 | 选择本人活动→核对对象/当前企业/执行影响→明确执行；不借后台菜单授权 | AC07/TR-01 |
| MKT-02 / denied、disabled、unavailable | 被撤权、成员停用或模块关闭 | 显示受控拒绝与联系管理员；不显示成功/不产生效果；拒绝信息不泄漏他人资源 | AC07/13 |
| MKT-03 / unknown、readback、succeeded | 原执行提交但回复丢失 | 保留原排障/操作编号→查询原结果；查询前不可重发；展示同一receipt | AC08/REC-01 |
| IAM-01 / input、selection、review | 管理者粘贴多行目标地址，系统格式校验/规范化/去重 | 重复合并、非法/范围外明确分组、最终数量/角色/范围确认；选定不发送 | AC06/P2/P4 |
| IAM-02 / submitted、partial、unknown | 按逐项状态理解邀请结果 | 已创建≠已收到；未知只查询该条，失败修正后处理；目标、tenant/有效期可见 | AC06 |
| IAM-03 / last_owner、revoked | Owner转交/自降级/停用与动态撤权 | 保留活动Owner；不超过当前可委派范围；冲突刷新上下文再核对 | AC06/REV-01 |
| CRM-01 / read_tenant_update_self | 客户列表和单资源动作展示当前允许范围 | READ不赋予UPDATE；批量预览只选有权对象，确认/逐项结果/未知恢复遵守真实协议 | AC09/10 |
| OBS-01 / error、not_sampled | 安全排障ID可复制，无内部堆栈 | 查询须独立授权；无样本解释可用来源，不把Trace当业务完成 | AC13/14 |
| OPS-01 / release_ready、awaiting_target | 运维审阅固定版本资格与回滚材料 | 生产资格/真实激活单独批准和回读；此页不提供生产发布按钮 | AC15 |

主预览演练登录0/1/N、企业切换失败恢复、Function-only/撤权/模块关闭、营销unknown查询、文本邀请预选/确认/逐项结果、Owner与Scope拒绝。CRM/运维剩余页面结构延用现有Console与本矩阵，正式F4/F6切片需补同版完整场景；本轮不宣称其所有界面已完成Human审阅。

数据都是明确合成fixture。邮箱只接受example.test后缀用于审阅，真实产品的可邀请身份由实际IdP/投递/业务规则校验；该fixture限制不被复制为产品规则。批量不使用模糊选定或跨租户查人；不模拟真实邮件已发送。
