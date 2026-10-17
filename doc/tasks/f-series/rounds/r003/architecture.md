# r003 现实约束与技术组织

本角色分析基于当前main191189ba和候选42ad3d13，来源及SHA在sources.json。现有BasicLayout固定56px header、200/68px flush rail；原设计模式只有六个片段，无法表达完整页面。现有Mock并非BFF/数据库权威，本轮不改变此事实。

复用：已有Vue Router、Pinia工作空间、Element Plus输入/表单/对话框/表格/分页、语言/主题、样式Token、tester-army及旧Playwright。适配：BasicLayout增加可选主导航slot，默认原导航完全保留；设计布局仅在完整审阅路径注入任务导航。路由只接受登记页面ID，未知路径走拒绝页。

隔离：所有领域页面位于src/design/f-series/full，bootstrap仅mode=design动态加载。独立loopback5790保留；私有审阅origin通过design构建期精确URL白名单绑定，不接受通配符/查询参数旁路。production构建树摇排除全部预览。只导出设计产物，不发布业务后端或生产Consumer。

状态：身份/租户/退出继续复用r002单一设计state，领域样例使用隔离审阅源内的单一v5样例数据库，所有页面投影、操作结果与下载按当前账户+tenant授权过滤，草稿按账户+tenant保存；标签页企业选择保持sessionStorage，样例操作记录通过Web Locks读最新/合并/写和storage同步。写操作捕获tenant/subject/context版本，迟到结果不得写到另一个tenant。提交时将执行结局、逐项效果一次持久保存，回执未知只表示读取尚未揭示；查询不重新validate或apply，不因后续版本变化改写历史。原记录、逐项结果和终态不可被新输入或重载覆盖。此机制只证明样例交互，真实DB事务/服务端权限仍是Build义务。

页面手写按领域拆分，不新增万能表单Renderer或另一套Shell。catalog仅维护导航与场景清单；原验收/清单仍需独立人工语义对账，不能由源码自证。

后续实施路线沿原S1–S6：可信身份/Access→营销与身份管理→SQL Scope→受保护执行/Outbox→非生产资格→有授权的生产读回。HTTP/gRPC/Worker/Child/UoW/SQL性能等后台事实保留真实测试；UI只设计它们对用户的结果、受控诊断和恢复入口。
