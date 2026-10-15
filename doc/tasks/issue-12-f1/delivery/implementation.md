# F1 实施候选与证据边界

批准来源：PR31 / 2f60a1b78b57a74d63c71e8cdbd3e7d8531b340b完整r001，Human于2026-10-16T07:26:29+08:00回复“确认”；handoffs/r001包含真实记录与封装说明。风险T3，执行模式harness_required/preserve；没有把编译失败或环境故障充作TDD RED。

## 实际变更

- backend唯一module升级Go1.26.9，固定四个外部SDK；CLI仍使用F0安全制品与摘要，无replace、无框架源码快照。
- 真正cs-biz typed PB生成OperationPlan/OpenAPI/TS Client、RPC适配器及装配。RPC探针经过生成装配和Yunka唯一Executor；REST无绑定，生成空包不代表HTTP接口。
- 固定Provider包装环境/本地出口、JSON stdout、W3C白名单传播、有界Flush/Shutdown及脱敏导出失败状态；只读探针只监听loopback，deny-all grants防止未来受保护操作获得默认授权。
- 固定Collector/Jaeger镜像digest和本地Compose，真实TraceID查询/故障脚本接入既有backend门禁。quality.yml仅增加必要工具版本/依赖缓存、制品只读token与证据上传，未更改分类器/裁判/前端断言。

## 本地已经取得的证据

真实Go全部unit、vet以及Authz/探针/telemetry race通过。工作区的.git为worktree文件，当前Go误识别/workspace为VCS根，因此本地编译诊断显式-buildvcs=false通过；正式CI保留正常VCS build，不把本地诊断当候选正式build证明。
consumer.py install使用F0固定tar，实际SHA256为8efe0a8bac8f0e5ce9fe941c2077effe6c8c476e6bf8132c6991e1c1f528a2ec，manifest/文件/安装根/expiry已验。consumer.py check实际完成两次generate零漂移、check只读、四模块graph版本/sums/Origin、go mod verify、source audit完整只读、assembly check和临时副本篡改反例拒绝。
govulncheck v1.7.0扫描实际Consumer，结果No vulnerabilities found。局部真实OTLP HTTP接收器测试覆盖exporter开/关、W3C关联、敏感元数据不泄漏、Collector不可达和退出；不能代替Collector/Jaeger真实查询。
故障测试最初继承宿主1%采样率导致没有待导出span，已固定资格测试always_on，未放宽原断言。另保留后台导出失败状态，避免ForceFlush返回值遗漏异步错误。

## 仍须实证，不得标PASS

本会话没有Docker可用，真实Collector/Jaeger查询必须在隔离CI完成。上游artifact匿名下载实际401，CI只读token能否跨仓下载须读真实结果；若无权限，负责方为仓库Owner，补齐限定Actions read的YUNKA_ARTIFACT_TOKEN或另行批准正式不可变分发方式，不能换浮动源或跳过检查。
最终候选Full、准确base/head/tier、所有所选job、独立receipt、内容审阅、授权合并与main门禁均以实际PR回执记录，当前不提前宣布通过/合并/完成。设计静态校验PASS_STATIC_ONLY不认证Human或运行。
真实IAM/DB/租户SQL、业务API、生产部署和其余开放PR不在本轮实现；原DB/IdP验收保留BLOCKED_F3，不用Mock或上游测试抵扣。
