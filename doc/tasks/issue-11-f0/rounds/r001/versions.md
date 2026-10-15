# F0 版本与消费条件矩阵

全部值来自 sources.json；本表是观察/提案，非 go.mod 或消费锁。

| 项目 | cs-biz 当前值 | Yunka 固定源码/已观察发布身份 | 差额与 F1 准入 |
| --- | --- | --- | --- |
| Go | go.mod 1.23.0，无 toolchain 行 | 五模块 go 1.25.0、toolchain go1.25.13 | 固定使用 1.25.13 验证旧 authz；不把最低语言版本与具体工具链混称 |
| protoc | 未声明/未安装资格 | 3.21.12（release 21.12，linux x86_64 摘要在上游锁内） | F1 复制来源/平台/制品摘要，不跨平台套 checksum |
| plugins | 无 Consumer 锁 | protoc-gen-go v1.36.11；go-grpc v1.6.2 | 固定实际二进制与生成输入 |
| framework | 未引入 | module github.com/hvritual/yunka.io/framework；v0.1.0→3de678338a08c0dfa9e65184c9f87e2f4f0089cf | tag 不指向评估 3527488；API/所需能力要独立验证 |
| gateway | 未引入 | module github.com/hvritual/yunka.io/gateway；v0.1.0→eaee9d50bdb0b87c9b6a63a05f10a9f80f131c93 | framework/pkg 的组合不能只凭同名版本推定合格 |
| pkg | 未引入 | module github.com/hvritual/yunka.io/pkg；v0.1.0→94113e9fb9fd021f773efd626dba49489b5b2071 | 被多模块直接依赖，也必须入消费锁 |
| 候选 tag | 未引入 | framework/v0.1.0-c41rc7→be910794324d3a8f918a627648c6f83ed44641cd；gateway 同后缀→e25f33dd1ace88972551859c4af89072ad22132b | prerelease 不自动优于正式版；资格/许可/变化范围须审阅 |
| infras | 未引入 | module github.com/hvritual/yunka.io/infras；评估源码 require framework v0.1.0 | 已观察 tag 列表未见 infras；确切消费版本/源码制品策略未批准 |
| app/CLI | 未引入 | module **yunka.io/app**；app require github.com/hvritual/yunka.io/pkg v0.1.0 | 不能凭仓库路径假定 go install github.com/.../app；锁定构建方式、源码、二进制、hash，consumer 工作区不能掩盖下载问题 |
| workspace | 无 Yunka 工作区 | 上游 go.work use app/framework/gateway/infras/pkg | 上游工作区 build 不等于 GOWORK=off 外部消费者可下载/可编译 |
| source policy | cs-biz 尚无 Yunka policy | biz.json 指向 project / yunka.io 与旧 testSupport import | 按 backend 根和当前 module 路径重新绑定；不能原样复制 |
| 合同源 | 当前 Go V2 registry + 提议文档 | typed PB；旧 authz 文档仍提 @yunka 与 legacy role_permission | 当前新源码/PB options 核对优先；不采旧注释 DSL/旧 IAM 数据权威 |
| 幂等 | 主线只有规则/测试 | ExecutionScope 持久重复抑制；C9.7 明确 response replay 非目标 | Domain 单独定义 receipt/readback，不能默认重试拿原响应 |
| OTel/Log | main 无 Consumer | Provider/OTLP/stdout/TraceAnalyzer 源码存在 | #21/#25 未合并；Consumer 真查询、故障降级与安全仍需当前 SHA 实证 |

**观察范围限制：** 没有执行 go mod download/go build 或比较全部运行 API，不能据此宣称上述正式版不兼容，也不能宣称已可消费。module tag 和评估源码分别封存，后续若改源提交必须重建证据/差异矩阵并重新审阅。
