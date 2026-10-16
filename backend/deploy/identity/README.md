# 非生产 MySQL / OIDC 资源

本包仅搭建真实非生产资源，不是 BFF/IAM、签名校验器、生产登录或 SaaS 租户实现。Keycloak realm/role 不授权业务；生产保留标准 OIDC Discovery/JWKS/code+PKCE 的供应端适配边界，具体应用适配由 F3 完成，不依赖 Keycloak Admin API。

从仓库根运行（Python 3、Docker Compose v2；端口在初始化时选择并持久保存）：

```sh
python3 backend/deploy/identity/resources.py init --state .artifacts/identity --environment development
python3 backend/deploy/identity/resources.py up --state .artifacts/identity
python3 backend/deploy/identity/resources.py verify --state .artifacts/identity
python3 backend/deploy/identity/resources.py down --state .artifacts/identity
```

`init` 不覆盖已有状态；`up` 复用状态；`verify` 会创建合成测试主体/标记并重启自己的 MySQL/IdP，**仅在允许中断的测试资源执行**。`down` 保留数据卷，不提供删除开发卷快捷命令。CI 使用唯一项目名/私有目录，仅删除自己生成的 CI 卷，其他卷不受影响。端口检查有并发竞争的可能，启动冲突直接失败；不自动接管已有端口/容器。

状态目录 0700、凭据文件 0600。仅生成非生产随机密码，不在 Git/终端/artifact 输出凭据。数据库和管理入口仅绑定 127.0.0.1；不要在公网上发布 `start-dev`、测试 realm 或资源管理凭据。多人云端接入需要另外明确 TLS/受控入口，不假设 loopback URL 能从其他电脑访问。

使用固定 registry digest：Docker Library MySQL 8.4.11、Keycloak 26.8.1。版本观察/来源差异见 [r001 方案](../../../doc/tasks/f-series/rounds/r001/solution.md)；本资源验证不是镜像漏洞/生产安全资格，F6 不因其通过而关闭。实施前后的实际镜像 ID、拉取/运行结果与 CI 原件保留在对应 PR。MySQL/IdP schema 分开，应用账号只获得 cs_biz 权限；管理 bootstrap 的 password grant 仅用于测试控制面，资源 probe 客户端禁用 password grant，实际测试走 code+S256 PKCE。

验证覆盖实际 SQL、业务账号不能读取 IdP schema、Discovery/JWKS、真实登录 code+PKCE、code replay/错误 verifier 拒绝，以及重启后的 SQL/主体读回。探针只检查供应端签发输出，**不是应用 Token 验证实现**；BFF 的签名/audience/时间/nonce 校验、CSRF、Session、会话期限/退出、邀请/恢复、第二 issuer、生产接入资格仍属后续 F3，不能用本包替代。

资源探针的 CookieJar 仅对本项目精确的 `http://127.0.0.1:<初始化端口>` 发送 Secure Cookie，仍遵守域/路径限制；其他 HTTP 地址及端口不适用。这用于兼容固定版本 Keycloak 的 [loopback secure-context 判定](https://github.com/keycloak/keycloak/blob/26.8.1/services/src/main/java/org/keycloak/utils/SecureContextResolver.java) 与 [Cookie 设置](https://github.com/keycloak/keycloak/blob/26.8.1/services/src/main/java/org/keycloak/cookie/DefaultCookieProvider.java)，不是应用 Cookie 策略，也不授权生产使用 HTTP。

配置移往生产必须另建部署 profile：HTTPS issuer/callback、受控 origins、TLS/secret 管理、禁止测试 bootstrap/realm/账号、外部 `(issuer,subject)` 账户显式链接/迁移。没有生产目标或批准时不发布、不把配置占位当生产能力。
