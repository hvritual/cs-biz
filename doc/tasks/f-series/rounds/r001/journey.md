# r001 资源与后端技术操作旅程

这是非 UI 的技术操作/准入旅程，不是 F3 全部用户屏幕。Console 的登录、企业选择、成员邀请和营销旅程将在对应同版项目 Preview 中补齐，不能用本表豁免。

| 状态 | 角色 / 条件 | 动作 / 结果 | 异常与恢复 / AC |
| --- | --- | --- | --- |
| RES-01 准备 | 开发者；明确非生产、私有资源目录、固定候选镜像 | 校验环境/secret/精确project与数据卷，缺项就拒绝启动 | 不接受production/dev组合、浮动未合格源或公网默认；AC01 |
| RES-02 就绪 | 操作员；同轮操作ID与独立schema账号 | 启动Docker MySQL和IdP，实际SQL/Discovery/JWKS证明可用 | IdP/DB故障不代表业务失败；记录原ID/资源状态，不盲目初始化；AC01/02 |
| RES-03 身份探针 | 测试用户；真实IdP客户端与严格callback | code+PKCE并验证签名/issuer/aud/time/state/nonce | 重放/错verifier/未注册callback拒绝，不泄露Token；AC03 |
| RES-04 持久恢复 | 操作员；已写入的专用标记、既有卷 | 停止/重启自己的容器，读取同一标记/主体 | 不删除开发卷、不给自己别人的project；AC02 |
| AUTH-01 供应切换 | 身份Owner；第二非生产issuer及配置 | 相同应用适配面通过独立issuer资格，外部身份键仍明确 | 不自动合并email/同名sub，不继承业务Owner；AC04 |
| AUTH-02 真实业务准入 | 已认证成员；S1真实Access与获准同版UI | 每标签页独立企业，服务端用当前Function和对应Scope执行营销/CRM | 无菜单不等于无API权；拒绝无副作用，未知按原key读回；AC05–10 |
| OPS-01 交付 | 实施/独立reviewer；本步固定AC和精确源码 | 当前风险门禁→receipt→合并→main回读→同分支下一步骤 | 缺证据/变更语义回相应阶段；生产权限另门；AC11–16 |

本轮只有资源方向获 Human 确认；表中动作均为待实现/待运行，不填运行成功或 UI 已可使用。
