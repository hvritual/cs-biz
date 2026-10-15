# 本地 Trace 栈

仅用于本地/隔离CI。Collector0.153.0与Jaeger2.20.0固定registry manifest digest；宿主仅暴露127.0.0.1:4318/16686，容器内部使用专用compose网络。无SLS、凭据或生产部署。

从仓库根运行docker compose -f backend/deploy/observability/compose.yaml up -d。按 [Consumer说明](../../doc/YUNKA-CONSUMER.md) 导出local.env.example并明确开启OTLP后，使用生成客户端发送请求，以本次TraceID在http://127.0.0.1:16686/search或API查询；空结果不是成功。
自动验收：cd backend后执行python3 ci/trace_query.py /tmp/cs-biz-traces，核对真实service/operation/span ID，停止collector后验证探针/stdout与明确导出失败，再清理容器。报告必须绑定实际cs-biz SHA。
