#!/usr/bin/env python3
"""Run the actual loopback Consumer and query its span through Collector/Jaeger."""
import json, os, pathlib, subprocess, sys, time, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
evidence=pathlib.Path(sys.argv[1]).resolve();evidence.mkdir(parents=True,exist_ok=True)
compose=["docker","compose","-f",str(ROOT/"deploy/observability/compose.yaml")]
process=None
try:
    subprocess.run(compose+["up","-d","--wait"],check=True,timeout=120)
    binary=evidence/"runtime-probe"
    subprocess.run(["go","build","-mod=readonly","-o",str(binary),"./cmd/runtime-probe"],cwd=ROOT,check=True)
    env=os.environ.copy()
    env.update(OTEL_TRACES_EXPORTER="otlp",OTEL_METRICS_EXPORTER="none",OTEL_TRACES_SAMPLER="always_on",
               OTEL_SERVICE_NAME="cs-biz-runtime",OTEL_EXPORTER_OTLP_ENDPOINT="http://127.0.0.1:"+os.environ.get("CS_BIZ_COLLECTOR_PORT","4318"),
               OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf",OTEL_EXPORTER_OTLP_TIMEOUT="500",OTEL_BSP_SCHEDULE_DELAY="100",CS_BIZ_SHUTDOWN_TIMEOUT="2s")
    with (evidence/"consumer-stdout.jsonl").open("w") as output, (evidence/"consumer-stderr.log").open("w") as errors:
        process=subprocess.Popen([str(binary)],env=env,stdout=output,stderr=errors)
        receipt=None
        for _ in range(30):
            result=subprocess.run([str(binary),"inspect"],env=env,capture_output=True,text=True,timeout=7)
            if result.returncode==0:
                receipt=json.loads(result.stdout);break
            if process.poll() is not None: raise RuntimeError("Consumer exited before readiness")
            time.sleep(1)
        if not receipt or receipt["status"]!="ready" or len(receipt["trace_id"])!=1: raise RuntimeError("actual Consumer probe failed")
        (evidence/"probe-receipt.json").write_text(json.dumps(receipt,indent=2)+"\n")
        trace_id=receipt["trace_id"][0];span_id=receipt["span_id"][0]
        url="http://127.0.0.1:"+os.environ.get("CS_BIZ_JAEGER_PORT","16686")+"/api/traces/"+trace_id
        matched=False
        for _ in range(30):
            try:
                with urllib.request.urlopen(url,timeout=2) as response: trace=json.load(response)
                for data in trace.get("data") or []:
                    for span in data.get("spans",[]):
                        service=data.get("processes",{}).get(span.get("processID"),{}).get("serviceName")
                        if data.get("traceID")==trace_id and span.get("spanID")==span_id and span.get("operationName")=="runtime.inspect" and service=="cs-biz-runtime": matched=True
                if matched:
                    (evidence/"queried-trace.json").write_text(json.dumps(trace,indent=2)+"\n");break
            except OSError: pass
            time.sleep(1)
        if not matched: raise RuntimeError("no exact Consumer span found by TraceID in local Jaeger")
        subprocess.run(compose+["stop","collector"],check=True,timeout=20)
        unavailable=subprocess.run([str(binary),"inspect"],env=env,capture_output=True,text=True,timeout=7)
        if unavailable.returncode or json.loads(unavailable.stdout)["status"]!="ready": raise RuntimeError("collector outage blocked Consumer")
        process.terminate();process.wait(timeout=8)
    logs=(evidence/"consumer-stdout.jsonl").read_text()
    if trace_id not in logs or "telemetry.flush_failed" not in logs: raise RuntimeError("correlation or explicit export failure missing from stdout")
    print("PASS: actual cs-biz Consumer -> Collector -> Jaeger exact TraceID/span query; outage keeps probe/stdout available")
finally:
    if process is not None and process.poll() is None:
        process.terminate()
        try: process.wait(timeout=8)
        except subprocess.TimeoutExpired: process.kill();process.wait()
    subprocess.run(compose+["logs","--no-color"],stdout=(evidence/"collector-jaeger.log").open("w"),stderr=subprocess.STDOUT,timeout=20)
    subprocess.run(compose+["down","--remove-orphans"],timeout=30,check=True)
