# Backend CI — 通用权限内核 V2

当前已存在并执行 `backend/ci/check.sh`（Go 1.23，只有标准库）。从仓库根运行 `bash backend/ci/check.sh` 或 `cd backend && bash ci/check.sh`：

```bash
go test -count=1 ./...
go vet ./...
go test -race -count=1 ./internal/platform/authz/...
```

本切片测试覆盖：Registry 缺失/冲突/非法定义，安全主体类型与成员关系、IAM Grant/Scope 隔离、动态撤权、跨租户、对象范围、权限语义 ALL/ANY、未知 HTTP 路由、未绑定 Handler、伪造头及不可用 Authority 的拒绝。**所有 Authority 均为内存测试 Fake**，目前没有真实数据库、身份服务、事务、API 集成、浏览器或生产验收。

GitHub 工作流 `.github/workflows/backend.yml` 应在相关文件变更时运行同一入口；全局 `doc/ci/check.sh` 将它纳入仓库检查（前端需要预装依赖）。

下一独立阶段 S02 需使用真实认证提供方、数据库和持久权限/成员关系，为同一接口增加 API/DB 权限矩阵、真实撤权与失败无副作用证据。没有这些证据不能宣称 SaaS 权限闭环完成。
