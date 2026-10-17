# r003 验证记录

已通过的完整源码候选：`1ef0e792e09e7d999071707574d3ac63fd339d9b`，自动 Full [run 38997320547 attempt 1](https://github.com/hvritual/cs-biz/actions/runs/38997320547)。独立质量门原始 [receipt](evidence/quality-receipt.json) 验证 repository、main base、PR41 head、tier=full、run/attempt 和 QUALIFIED。

实际结果：50 个 tester-army 用例通过（原4个设计旅程、新32个页面场景入口检查、新12个连续动作旅程、1个私有origin静态入口启动验证及既有成员用例），没有新增skip或重试；保留Playwright 16通过和原有Mobile 1 skip；Fast47个unit通过。原始 [报告](evidence/browser-report.json)、[旧框架报告](evidence/legacy-results.json)、[截图索引](evidence/screens.json) 和 [下载来源](evidence/artifact-index.json) 已绑定。

覆盖分层：32页各自normal截图及末态截图，233个声明场景入口/反馈渲染；12条连续动作包括不可变原结果、邀请接受、最后Owner/委派、首次Owner及失效恢复、自然过期重发、无Menu有Function、当前权限导出、文本批量部分结果、三尺寸英文深色、真实双标签页隔离/重载/读回/退出。另含多角色撤销及assigned/explicit撤销的两条连续动作。不能把233入口等同233条动作链，也不能把设计样例填为原业务R/AC已经通过。

失败保留：C1 run38991136752被后续候选取代，不能判通过，见[C1](evidence/C1-superseded.json)。C2 run38991665568实际43通过/4失败，legacy未运行，见[C2](evidence/C2-failed.json)。修复可见控件点击、提前权限重定向后的返回路径，以及新标签的实际企业选择；没有force、减少断言、skip或改变门禁。C3 run38992397225实际45通过/2失败，见[C3](evidence/C3-failed.json)；继续修正模块嵌套标签与会话按钮歧义，并按截图修复深色选择框对比度。C4 run38993407385实际45通过/2失败，见[C4](evidence/C4-failed.json)，业务动作通过而截图浮层及主题过渡测量失败。C5仅修正可见浮层收起与颜色稳定等待，保留零浮层、4.5对比度阈值与全部业务断言，Console源码与C4一致；C5 run38994621180实际46通过/1失败，见[C5](evidence/C5-failed.json)：深色与全部三尺寸通过，连续选择同名选项时全局定位同时匹配过渡中的两个列表。C6用当前combobox的aria-controls绑定listbox并等待关闭，新增展开与语义断言，保留全部业务及视觉断言。C6 run38995323733实际47个tester-army、16个legacy、47个unit及独立Full质量门均通过，见[C6已通过但被替代的证据](evidence/C6-qualified-superseded.json)；不能用该版证明后续新增设计。两次增量均经独立审查；C6旧授权设计仍缺真实多角色和assigned/explicit可审阅来源；完整反查发现后补齐授权模型、成员/角色页面与两条新连续旅程，原32页/233声明状态和全部旧断言保留。C7 run38996417089实际47通过/2失败，legacy未运行，见[C7](evidence/C7-failed.json)：两个新增旅程切换账号后缺少真实选择企业动作；C8补齐显式企业选择、由真实成员授权推导落点，并保留受邀入口，不注入会话或授权。当前候选重跑全部50路径（含额外静态构建根入口验证）。

私有设计界面与同版代码映射见[托管记录](evidence/site-hosting.json)。托管由native成功状态验证；受managed环境control-browser不可用限制，没有冒充托管URL本身的浏览器QA。实际浏览器证明来自现有仓库CI，不创建新框架或替换旧测试。私有origin根入口探针将固定源码重新构建，离线拦截所有请求后验证入口、登录、显式企业选择及客户页；不是native托管包本体测试，也没有证明实际部署URL的网络、CSP、认证或重写行为。

本轮没有真实BFF/SQL/Domain/OIDC/transport/Outbox/外部投递或生产效果证明，没有Human理解耗时/SLO实测；深色主色链接的可访问性仍需进一步抽检，对比度自动断言只覆盖指定选择框，不宣称全界面AA。S0真实资源验证仍独立保留；F2–F6/O1业务验收未完成。Human同版设计和P1/P2/P4/P7仍待审，P6只阻塞对应生产范围。源码与测试资产hash在[Preview](preview-evidence.json)；后续仅证据文档提交保持这些字节，当前PR精确head的质量状态以Checks为准。
