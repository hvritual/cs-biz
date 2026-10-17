# r003 独立设计复核

结论：源码候选 `1ef0e792e09e7d999071707574d3ac63fd339d9b` 可交Human同版审阅，未发现剩余内容阻断。Reviewer为独立会话 `/root/f_series_design_review`，2026-10-17；本记录转录其实际结论，不代表Human批准。

## 原始义务和修复

独立反查最初指出原SAAS-01-I多角色与#15 assigned/explicit来源缺口；已补真实逐动作角色并集、成员资源指派、角色指定集合、撤销后的当前权限检查与两条连续动作旅程。保留原32页、233声明状态、原R/AC和历史封存；没有通过减少断言或扩大样例能力消除失败。C8账号切换要求显式选择企业，由实际成员授权推导落点，邀请入口保持独立，未发现越权。

## 已直接核验

- [原始浏览器报告](evidence/browser-report.json)：精确C8、dirty=false、50/50 passed，每项一次执行；其中32页入口、12连续旅程、1静态私有origin根入口探针及保留的5项设计/成员回归。
- [Legacy原件](evidence/legacy-results.json)：16 expected、0 unexpected、0 flaky、errors为空，只保留原Mobile skip。
- [独立质量回执](evidence/quality-receipt.json)：repository、main base、PR41 head、tier=full、run38997320547/attempt1与QUALIFIED一致。
- 实际查看正常成员、多角色撤权、assigned/explicit撤销拒绝、built-private-root和不可变原结果回读截图，无新增内容阻断。截图来源与哈希见[索引](evidence/screens.json)。
- 托管同版绑定：22个源码哈希全匹配；Site commit `8eb519b9c9587199d5c0501ae07b98e34790e52d` 的230个dist文件与上传tar一致，额外托管配置及231项清单匹配；本地上传包708037字节、SHA256 `13bb7c8a19178e5bee705570729c844db2140987651f48dec3506f2300184cea`。见[源码/包记录](evidence/site-source-provenance.json)。native另存格式及其hash不冒充本地上传字节。

[下载索引](evidence/artifact-index.json)明确browser/receipt ZIP已由主会话下载并核对API digest，backend/plan只保留元数据；未将其混写为全部ZIP独立下载。各失败候选和C6已通过但被新授权义务替代的事实均保留在[验证记录](validation.md)。

## 审阅边界与后续

233状态入口不等于233条完整动作链；设计样例不证明真实F2–F6/O1业务、BFF/SQL/OIDC/transport/Outbox或生产结果。静态根探针是固定源码离线重建，不是native部署包或实际URL的网络/CSP/认证/重写QA。托管部署成功和源码同版已核验，实际部署URL浏览器QA未执行；没有Human理解耗时/SLO或全界面AA宣称，深色主色链接/状态色保留进一步抽检项。

P1/P2/P4/P7与同版实质设计仍待Human审阅，P6只阻塞对应生产范围。没有Build handoff、业务Issue关闭或合并授权凭证。反馈由Goal回到受影响设计范围，未改变部分继续沿本版证据，不重签旧封存。
