# S00 验证记录

验证日期：2026-10-12，Asia/Shanghai。运行环境 Python 3.12.14。验证对象为本次准备提交的 S00 文件内容；其最终 GitHub commit/tree 由 PR 的实际 head 和交付说明关联。

## 本地执行结果

命令：在仓库根执行 `python3 doc/ci/check_repository.py`。

```text
PASS: 18 required directories, 28 required files, 54 relative file links
Scope: S00 structure and documentation only; no application/runtime validation.
```

额外执行两个受控反例，随后恢复原文件并重新通过：

| 反例 | 实际结果 | 判定 |
| --- | --- | --- |
| 临时移走 `frontend/deploy/README.md` | exit 1；报告缺失 required file 与引用该文件的 broken link | 正确拒绝 |
| README 临时增加指向不存在文件的相对链接 | exit 1；报告 broken or out-of-repository link | 正确拒绝 |
| 恢复全部原文件 | exit 0；18/28/54 检查通过 | 恢复后通过 |

该检查只验证必备路径、文件、来源 JSON 与受支持的相对文件链接，不证明研究判断或业务语义正确。

## 独立评审与修复

两名研究复核分别确认 Vben 与 Pure/Soybean 部分的来源事实无阻断性错误。独立架构评审初次发现两项 P1，均已修复并完成回读：

| 发现 | 修复 | 复审 |
| --- | --- | --- |
| 幂等摘要误入唯一键，可能绕过参数冲突；首回执丢失恢复不明确 | 摘要单独比较；平台/租户作用域区分；首次预存键恢复；并发唯一记录与原子/恢复边界；结果读取重新鉴权 | 关闭 |
| 合并角色可能把全量读取范围套用到局部写权限 | 动作与数据范围绑定；前端扁平权限仅投影；架构、后端与旅程 I 组反例同步 | 关闭 |

评审还修正了后端命令的措辞，明确 Go 是当前建议。最终评审在 S00 范围内无剩余 P0/P1。结构检查在修复后再次通过。

## 已核验与未实施的边界

范围仅为目录骨架、设计、来源及本地结构门禁。前端依赖导入、业务 API、数据库、权限运行、浏览器与部署均未实施。研究候选没有安装和运行验证。

GitHub 分支/tree 回读、自动检查与 PR 状态在实际结果产生后记录于 PR 和交付说明。这里的本地通过不能替代 hosted CI 或合并证明。设计 PR 保留可评审状态；本次没有部署或真实数据迁移。
