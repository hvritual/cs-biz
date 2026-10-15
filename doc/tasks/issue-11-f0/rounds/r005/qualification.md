# F0 r005：已合格上游输入与本项目准入

D1=A与安全工具链决定分别来自r002/r004，原始反馈和摘要见 [raw-followups](raw-followups.json)。原r001–r004保持原字节，不重选D1/Go，不把这些部分批准当作完整设计批准。

## 已完成的上游前置

独立安全 [PR #245](https://github.com/hvritual/yunka.io/pull/245) 接受源 bc7c0e1dd6b4e815951130c7acfbf60371445453，tree 4e3ae46845f96f520ef913bc956f6a5f458ff144，候选和独立main六项门禁均通过。Go1.26.9 / x/net v0.60.0修复已复现的可达漏洞，依赖明确要求语言go1.26.0；protoc/plugins/scanner不变，无扫描压制。

分发 [PR #243](https://github.com/hvritual/yunka.io/pull/243) 从该安全源刷新四模块外部version/Origin/zip与go.mod sums，修复CLI独立编译与打包消费。最终main为3e46ec4d51b9c31bd9f687bb4f773b314cd57451，tree 097a1c9e471e065700425dcfc059877e787361f3；两次非强制快进与实际GitHub合并/ref/tree回读均已完成。安全前置 [#244](https://github.com/hvritual/yunka.io/issues/244) 已在全验收后关闭completed。

| 门禁 | 精确最终候选 PASS | 独立 actual-main PASS |
| --- | --- | --- |
| CI/生成/依赖/确定性 | 38733182312 | 38734324854 |
| Production/真实MySQL8.4/clean | 38733182848 | 38734324856 |
| 分支基线 | 38733182871 | 38734324867 |
| 类型资格 | 38733182502 | 38734324821 |
| 源码完整性 | 38733182313 | 38734324808 |
| 模板资格 | 38733182394 | 38734324809 |
| 打包CLI/独立消费 | 38733182696 | 38734324861 |

actual-main Production job116419639964的真实集成和干净工作树已回读。没有把候选运行称作main运行；外部评审按Yunka当前规则未执行/不要求，不将自动化当独立批准。

## 实际制品与独立消费

[版本矩阵](versions.md) 和 [机器记录](producer-record.json) 绑定实际main artifact11971414833、到期时间、ZIP/tar/manifest、10项文件摘要、41条实际命令与六次隔离安全扫描。PR与main打包tar/manifest/files完全相同；ZIP摘要分别保留。实际下载的最终CLI在声明Go根下通过version/只读check/audit；完整二次生成零漂移、build/test/vet/security和生成漂移拒绝以精确远端41条回执为证。先前实现制品的本地完整消费证据单独保留，不伪装成重复执行的最终本地结果。

SDK源和CLI producer是不同、明确锁定的字段；无仓库内SDK快照、宿主机replace或浮动main。CLI仅linux/amd64，要求Go位于/opt/hostedtoolcache/go/1.26.9/x64、bin置PATH首位、GOROOT未设置。制品为有到期日的已合格CI构建，不是正式tag/release；根许可证清单为空，不编造授权。

旧Go1.25.13的九项可达finding、失败run、旧功能候选及源码fixture归属失败都保留在r003/上游证据中，不改成成功。当前扫描零可达，仍保留仅模块层未被调用的advisory提示。#234/#188仍开放，不从此夹具推断完整框架/业务资格。

## cs-biz当前边界与下一动作

主线仍为da5494d03c362ab873465c1793e7aba7e4e3a7cc；#7/#8/#18的固定head和未合并状态已重新回读。当前PR仅设计/证据文档，未接入Yunka Runtime、未改前端/后端/CI，也未部署。原始R1–R8/AC-01–08、三权/幂等/Trace/负例和全部后续Issue完整保留。

上游资格不能抵扣本项目F1的旧Authz+新框架兼容、真实生成/装配二次零漂移、source/dependency、build/test/vet和当前候选证据。D2/D3、Session/邀请/恢复、legacy group、生产诊断资源在原影响阶段由Owner补齐。无UI变更，Preview/UX不适用，技术图不冒充产品demo。

**当前为DESIGN_REVIEW / WAITING_DESIGN_CONFIRMATION。下一动作：Human审阅本r005完整方案及精确内容摘要，按F0-S01~S06/R/AC反馈或确认。** 没有完整批准不写DESIGN_HANDOFF；当前SHA的独立审阅/Full决定与交付门禁仍分别保留，#26豁免不延用；模型不触发Full、不开始F1、不关闭#11。
