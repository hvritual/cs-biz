# cs-biz 检查入口与证据边界

核心 [UX Contract](UX-CONTRACT.md) 与九维模板从固定上游引入。上游 `make b2b-ux-skill-check` / `scripts/check_b2b_ux_skill.py` **没有移植到 cs-biz**，不能宣称该完整 checker 已接入。

本仓库运行：

```sh
python3 doc/ci/check_sdlc_workflow.py --mode structure
python3 doc/ci/check_design_workflow.py --task <task-dir> --repo-root .
python3 -m unittest discover -s doc/ci -p 'test_design_workflow.py' -v
```

这些检查只覆盖方法接线及 intent-design-v2 交接的摘要、引用和状态。UX YAML 结构/九维语义仍需模型与独立 reviewer 按 UX-CONTRACT 审阅；不以一个 ux 文件存在就授予 UX PASS。没有移植上游 YAML checker、语义核验、可信审批或运行期组件。

模型负责预览与实现的实际核实，使用现有 Fast 和适用 Targeted；Full、合并与部署保留各自权限边界。脚本永远不执行交接文档里的命令、不访问引用 URL、不回写批准状态。Human 审阅、API、浏览器与真实任务完成不能互相代替；未知、失败、未运行与不适用要分开。
