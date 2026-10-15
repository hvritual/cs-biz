#!/usr/bin/env python3
"""Verify the F0 distribution lock and qualify this backend, never the producer fixture."""
import argparse, datetime, hashlib, io, json, os, pathlib, subprocess, sys, tarfile, tempfile, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / ".yunka/consumer-lock.json").read_text())
def sha(data): return hashlib.sha256(data).hexdigest()
def require(condition, message):
    if not condition: raise ValueError(message)
def run(args, **kwargs):
    return subprocess.check_output(args, cwd=ROOT, text=True, **kwargs)
def install(destination, archive=None):
    require(datetime.datetime.now(datetime.timezone.utc) < datetime.datetime.fromisoformat(LOCK["artifact"]["expiresAt"].replace("Z","+00:00")), "fixed candidate artifact expired: requalification required")
    if archive:
        data = pathlib.Path(archive).read_bytes()
    else:
        token = os.environ.get("YUNKA_ARTIFACT_TOKEN", "")
        require(token, "YUNKA_ARTIFACT_TOKEN with Actions read on hvritual/yunka.io is required; no anonymous fallback or rebuild")
        url = "https://api.github.com/repos/" + LOCK["artifact"]["repository"] + "/actions/artifacts/" + str(LOCK["artifact"]["id"]) + "/zip"
        # Redirects must not forward the credential to the artifact blob host.
        class Redirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                result = super().redirect_request(req, fp, code, msg, headers, newurl)
                if result: result.remove_header("Authorization")
                return result
        request = urllib.request.Request(url, headers={"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json"})
        with urllib.request.build_opener(Redirect).open(request, timeout=60) as response: zipped = response.read(30*1024*1024)
        require(sha(zipped) == LOCK["artifact"]["zipSha256"], "artifact ZIP digest mismatch")
        with zipfile.ZipFile(io.BytesIO(zipped)) as source: data=source.read("yunka-linux-amd64.tar.gz")
    require(sha(data) == LOCK["artifact"]["tarSha256"], "CLI tar digest mismatch")
    destination.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as source:
        # Only regular files/directories inside the destination are permitted.
        for member in source.getmembers():
            path=pathlib.PurePosixPath(member.name)
            require(not path.is_absolute() and ".." not in path.parts and (member.isfile() or member.isdir()), "unsafe archive member")
        source.extractall(destination, filter="data")
    manifest_bytes=(destination/"manifest.json").read_bytes()
    require(sha(manifest_bytes)==LOCK["artifact"]["manifestSha256"], "manifest digest mismatch")
    manifest=json.loads(manifest_bytes)
    require(manifest["producerCommit"]==LOCK["producer"]["commit"] and manifest["sdkLock"]==LOCK["sdk"], "producer/SDK identity mismatch")
    require(manifest["requiredGoRoot"]==LOCK["requiredGoRoot"] and manifest["platform"]==LOCK["platform"], "installation identity mismatch")
    for name,digest in manifest["files"].items():
        require(sha((destination/name).read_bytes())==digest, "distribution file digest mismatch: "+name)
    (destination/"bin/yunka").chmod(0o755)
    require(run(["go","env","GOVERSION"]).strip()==LOCK["go"], "Go version differs from approved toolchain")
    require(run(["go","env","GOROOT"]).strip()==LOCK["requiredGoRoot"], "CLI requires the qualified Go installation root")
    require(not os.environ.get("GOROOT"), "GOROOT must be unset; do not mask compiled-in source audit assumptions")
    print("PASS: fixed CLI distribution bytes, identity, expiry and toolchain")

def snapshot():
    ignored={(".yunka","cache"),(".yunka","bin"),("ci","__pycache__")}
    paths=[p for p in ROOT.rglob("*") if p.is_file() and p.relative_to(ROOT).parts[:2] not in ignored]
    return {str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in paths}

def qualify(destination, evidence):
    require(not (ROOT/"go.work").exists(), "Consumer workspace file forbidden")
    os.environ["GOWORK"]="off"
    cli=str(destination/"bin/yunka")
    args=["--root",str(ROOT),"--proto-path",str(destination/"include"),"--full","--format","json"]
    evidence.mkdir(parents=True,exist_ok=True)
    before=snapshot()
    for label in ["generate-first","generate-second","check"]:
        cmd="check" if label=="check" else "generate"
        (evidence/(label+".json")).write_text(run([cli,cmd]+args))
        require(snapshot()==before, label+" changed the committed source/generated file set or bytes")
    graph_output=run(["go","list","-m","-json","all"])
    decoder=json.JSONDecoder();graph=[];rest=graph_output
    while rest.strip():
        item,end=decoder.raw_decode(rest.lstrip());graph.append(item);rest=rest.lstrip()[end:]
    require(not any("Replace" in row for row in graph), "module replacement forbidden")
    for row in LOCK["sdk"]["modules"]:
        selected=next((x for x in graph if x["Path"]==row["path"]),{})
        require(selected.get("Version")==row["version"] and selected.get("Sum")==row["sum"] and selected.get("GoModSum")==row["goModSum"],"SDK graph drift: "+row["path"])
        download=json.loads(run(["go","mod","download","-json",row["path"]+"@"+row["version"]]))
        require(download.get("Origin",{}).get("Hash")==LOCK["sdk"]["sdkSourceCommit"],"SDK source Origin mismatch")
    (evidence/"dependency-graph.json").write_text(graph_output)
    run(["go","mod","verify"])
    # The source auditor deliberately disables network access. A cold CI runner
    # must materialize the locked module sources before that read-only phase.
    run(["go","mod","download"])
    audit_run=subprocess.run([cli,"audit","source","--root",str(ROOT),"--format","agent-json","--timeout","10m"],cwd=ROOT,capture_output=True,text=True)
    (evidence/"source-audit.json").write_text(audit_run.stdout)
    (evidence/"source-audit.stderr.log").write_text(audit_run.stderr)
    require(audit_run.returncode==0,"source audit failed; see source-audit.json and stderr evidence")
    audit=json.loads(audit_run.stdout)
    require(audit.get("status")=="PASS" and audit.get("sourceUnchanged") is True and audit["analysis"]["uncoveredGoFiles"]==0,"source audit incomplete")
    run([cli,"assembly","check","--proto-path",str(destination/"include"),"--code-out","internal","--code-import","github.com/hvritual/cs-biz/backend/internal"])
    require(snapshot()==before,"read-only qualification changed source")
    # Destructive negatives run only in a disposable copy, never the source tree.
    import shutil
    with tempfile.TemporaryDirectory(prefix="cs-biz-negative-") as temporary:
        copy=pathlib.Path(temporary)/"backend";shutil.copytree(ROOT,copy,ignore=shutil.ignore_patterns("evidence","cache","bin"))
        target=copy/"contracts/generated/operation-plans.json";target.write_text("{}\n")
        bad_before=sha(target.read_bytes())
        result=subprocess.run([cli,"check","--root",str(copy),"--proto-path",str(destination/"include"),"--full","--format","json"],capture_output=True,text=True)
        require(result.returncode!=0 and "YUNKA-DX-CONTRACT-002" in result.stdout,"generated drift negative did not reject the expected defect")
        require(sha(target.read_bytes())==bad_before,"failed check repaired generated output")
        (evidence/"drift-rejected.json").write_text(result.stdout)
    print("PASS: actual cs-biz generation twice, read-only check, external dependency/source/assembly and drift rejection")

def main():
    parser=argparse.ArgumentParser();parser.add_argument("mode",choices=["install","check"]);parser.add_argument("--tools",type=pathlib.Path,required=True);parser.add_argument("--archive");parser.add_argument("--evidence",type=pathlib.Path)
    args=parser.parse_args()
    if args.mode=="install": install(args.tools.resolve(),args.archive)
    else: qualify(args.tools.resolve(),args.evidence.resolve())
if __name__=="__main__":
    try: main()
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError) as exc:
        # Never include request headers, signed URLs or environment values.
        print("BLOCKED: Consumer qualification failed ("+type(exc).__name__+"): "+(str(exc) if isinstance(exc,ValueError) else "see bounded command evidence"),file=sys.stderr)
        sys.exit(2)
