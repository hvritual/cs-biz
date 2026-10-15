# F0 r005 固定输入与使用条件

cs-biz main 仍为 da5494d03c362ab873465c1793e7aba7e4e3a7cc，backend/go.mod go1.23.0 未在 F0 改动。以下为 F1 待消费的固定外部输入，不是本项目已接入事实。完整机器记录见 [producer-record.json](producer-record.json)。原始 tag/评估差额保留 r001。

| 项目 | 固定值 / 边界 |
| --- | --- |
| SDK source | bc7c0e1dd6b4e815951130c7acfbf60371445453；独立安全主线已接受且实际下载 Origin 相同 |
| CLI producer | 3e46ec4d51b9c31bd9f687bb4f773b314cd57451；tree 097a1c9e471e065700425dcfc059877e787361f3；已非强制快进整合main；独立main门禁见本轮资格记录 |
| Go | 精确 Go1.26.9；x/net v0.60.0 要求语言 go1.26.0，Human已批准该兼容条件 |
| protoc | libprotoc3.21.12 / release21.12；Linux x86_64 archive SHA256 3a4c1e5f2516c639d3079b1586e703fc7bcfa2136d58bda24d1d54f949c315e8 |
| plugins/scanner | protoc-gen-go v1.36.11；protoc-gen-go-grpc v1.6.2；govulncheck v1.7.0 + 当前数据库，无压制 |
| 平台与安装根 | linux/amd64；Go 必须位于 /opt/hostedtoolcache/go/1.26.9/x64，bin置PATH首位，GOROOT不设置；不承诺任意路径可移植 |
| CLI身份 | yunka.io/app；版本 0.0.0-dev+3e46ec4d51b9；有clean VCS/build info；包含proto输入和SDK锁 |
| 文件来源 | module zip/go.mod sums 与manifest10项文件摘要已独立核验；无SDK源码快照或local replace |
| 许可 | 根LICENSE/COPYING/NOTICE清单为空，不编造授权条款；第三方Go模块许可随其实际分发保留 |
| 后续Consumer | 按backend根/实际module重新绑定source/dependency policy；生成物只读，不能复制旧biz policy路径 |
| F1剩余资格 | 旧Authz兼容、真正cs-biz生成/装配二次零漂移、源码/依赖审计、build/test/vet与当前SHA证据；不拿上游夹具抵扣 |

| SDK module | 外部version | zip Sum | GoModSum |
| --- | --- | --- | --- |
| pkg | `v0.1.1-0.20261015114616-bc7c0e1dd6b4` | `h1:P0LA7djSxLu5SHXhpDK1ZdDisKwZkqg+TJ/QdTMRfHY=` | `h1:TIdo3jxP61ZD0Ufb/3iE79dYJ+Ei01ZtqiCbAC5l3Zk=` |
| framework | `v0.1.1-0.20261015114616-bc7c0e1dd6b4` | `h1:If6azFUDuiin4fSBL7krJxgF1a+AyfuXKUSbUzkYUqc=` | `h1:ttZKb+PA8ox9GC86K4nbNIaUZdXYSEKOc7YtrokYdqI=` |
| gateway | `v0.1.1-0.20261015114616-bc7c0e1dd6b4` | `h1:AzdGbdqQVYUuVmW2xyh0WL0moqZEye/ZkQ3ic03TDwI=` | `h1:bJRMgHz5Nj6SSNZLHEiXdVOwaa05MBL/gI3Gwqx68IY=` |
| infras | `v0.0.0-20261015114616-bc7c0e1dd6b4` | `h1:NNV0VGd9FPnlqAIGdIR1chL7bofV2V1TNt+yIX82E8w=` | `h1:GbQWBjfd8IRCYaEWfDxP4ZanwJmzpNZnelGg+s41YR0=` |

## 实际候选制品

实际main run 38734324861 / artifact 11971414833；到期2026-11-14T12:26:20Z。
ZIP SHA256 5aece1d69b7708dfede53406d634dbc03aafb234ebe71d3df7f8a911b4ae69fd。
tar SHA256 8efe0a8bac8f0e5ce9fe941c2077effe6c8c476e6bf8132c6991e1c1f528a2ec。
manifest SHA256 fe327f37ab873f8e73931aa34767cc49690dc841ad538dfe076f3df44875a6fa。

这是可到期的CI候选，不是正式tag/release。到期、源/工具链/字节变化须重新核验，禁止漂移安装。原Go1.25.13 artifact仍为历史SECURITY_UNQUALIFIED，不能复用其安全结论。最终整合与main资格见本轮 qualification.md。

最终PR与独立main构建的tar/manifest及10项文件摘要完全相同；ZIP容器摘要分别保留在机器记录，不混用。
