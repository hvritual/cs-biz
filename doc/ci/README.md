# 全局与跨端检查

## 当前可执行入口

```sh
python3 doc/ci/check_repository.py
```

Windows：`py -3 doc/ci/check_repository.py`。要求 Python 3.10+，不安装第三方依赖。脚本从自己的位置寻找仓库根，不依赖机器上的固定绝对路径。

检查内容：必备目录、非空说明文件、关键设计与证据文件、JSON 来源记录、Markdown 中本仓库使用的普通相对文件链接。输出非零表示失败。

检查局限：不解析完整 CommonMark，不验证锚点或远程链接，不检查 UI、权限算法、业务数据、API、数据库、依赖、构建、性能或生产环境。它只是 S00 的目录和文档门禁。

## GitHub 自动入口

`.github/workflows/repository.yml` 在 push、PR 或手动触发时调用同一脚本。job 名为 `repository-structure`，只表示结构检查；没有前后端应用时不创建假 build/test 成功项。

GitHub 只自动发现 `.github/workflows` 的工作流；此处存放检查逻辑与本地入口。[来源：GitHub 官方语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)。

## 运行代码加入后的职责

| 范围 | 逻辑位置 | 必须覆盖的实际结果 |
| --- | --- | --- |
| 前端 | `frontend/ci/` | 可复现安装、类型、构建、组件/路由行为 |
| 后端 | `backend/ci/` | 服务测试、数据库集成、授权与数据隔离 |
| 跨端契约 | `doc/ci/` 调度各端入口 | API 结构与生成消费者一致 |
| 用户旅程 | `doc/ci/` 调度真实前后端测试环境 | SAAS-01、幂等恢复、切租户、撤权 |
| 发布验收 | 各端 deploy + 全局调度 | 固定构建、迁移、部署与环境回读 |

S01/S02 引入运行代码时，同步增加对应真实 job。缺少依赖时应失败并给出原因，不能回退成只执行结构检查后宣布功能完成。PR 门禁、主线合并、部署成功分别记录。
