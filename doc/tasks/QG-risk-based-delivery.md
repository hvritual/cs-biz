# QG-01：保证质量并减少重复测试时间

来源：Human 2026-10-15 明确要求重新设计项目门禁并合并对应 PR。基线 main `290035681346bc26dce890f89e2f845fb9384f4f`。
本独立治理单元包括已请求的 PR29 E2E 框架接入（`ee5f08f18a23ff7481bbd461b2700a6739e7cb34`）与新统一质量入口，
避免先运行/合并旧门禁再重复验证。未授权产品设计修改、生产部署或 F1 实施；F0 sealed 资产不动。

## 验收

| AC | 结果 | 真实验证 |
| --- | --- | --- |
| Q1 | docs/backend/full 完整 diff、低风险排除不相关栈，未知升级 | 选择器真实 Git 改名/模式/过期 base/混合反例 |
| Q2 | 每个最终候选前端只安装/Fast/build/E2E 各一次，无重复自动工作流 | YAML 语义策略、禁用/continue-on-error/重复构建反例 |
| Q3 | 全部原用例与三尺寸保留，tester-army真实运行 | 新旧报告分别验证、精确 SHA、通过/skip/flake与基线检查 |
| Q4 | 自动资格需独立 job、head/main 回读和真实 CI | quality-gate + 绑定 run/attempt 的 receipt；移动候选拒绝 |
| Q5 | 政策/Skill/模板与执行一致，治理独立审阅 | 原始 diff、Skill 前向验证、Python/Node结构与反例 |
| Q6 | 合并主线实际存在且合并后检查通过 | PR、main commit/tree、main risk CI/receipt |
| Q7 | 如实比较耗时与质量边界 | 旧PR29 Fast62秒/Targeted138秒（两job重复安装/Fast），新同类run逐步耗时；不把删用例说成提速 |

允许改动：测试/CI/门禁脚本、依赖与来源、相关项目文档和现有 Skill。业务实现、已批准方案/AC、历史 sealed F0 目录禁止改动。
完整风险策略见 [RISK-BASED-GATES](../ci/RISK-BASED-GATES.md)。GitHub 实际保护与人工价值/风险决策仍各自保留。
所有最终候选 SHA、实测耗时、报告摘要、独立审阅与修复、合并后回读记录在本单元 PR；本地静态 PASS 不认证 GitHub 结果。
回退使用独立 revert 恢复调度与治理文件，不删除旧测试或改变业务数据。
