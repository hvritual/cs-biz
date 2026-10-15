#!/usr/bin/env python3
"""Read-only revision validator compatible with v0.4 controlled-revisions-v1 artifacts.

No authorizations, actual UI behavior, CI results, or human identity are certified.
Never writes to the task. Python 3.11 stdlib only.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys

MAX_FILE = 1_000_000

class Fault(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message
        super().__init__(message)

def must(ok, code, msg):
    if not ok: raise Fault(code, msg)

def pairs(pairs):
    result = {}
    for key, value in pairs:
        must(key not in result, "INVALID_JSON", "duplicate JSON key "+key)
        result[key] = value
    return result

def canonical(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False,
                      sort_keys=True, separators=(",", ":")).encode()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def safe(root, name):
    must(isinstance(name, str) and bool(name) and not any(c in name for c in ("\\",":","\x00")),
         "INVALID_PATH", "invalid relative name")
    parts = PurePosixPath(name)
    must(not parts.is_absolute() and ".." not in parts.parts and not name.startswith("~"),
         "INVALID_PATH", "path escapes task: "+name)
    dest = root
    for part in parts.parts:
        dest = dest / part
        must(not dest.is_symlink(), "INVALID_PATH", "symlink: "+name)
    must(dest.resolve().is_relative_to(root.resolve()), "INVALID_PATH", "escaped path: "+name)
    return dest

def read(root, name):
    dest = safe(root, name)
    must(dest.is_file() and dest.stat().st_size <= MAX_FILE, "MISSING", "missing or large: "+name)
    return dest.read_bytes()

def digest(root, name): return sha(read(root, name))

def load(root, name):
    value = json.loads(read(root, name).decode("utf-8"), object_pairs_hook=pairs,
                       parse_constant=lambda x: (_ for _ in ()).throw(ValueError("nonfinite "+x)))
    must(isinstance(value, dict), "INVALID_JSON", "object required: "+name)
    return value

def value_at(value, pointer):
    must(isinstance(pointer,str) and (pointer == "" or pointer.startswith("/")),
         "INVALID_CONTRACT", "invalid pointer")
    for part in pointer.split("/")[1:]:
        import re
        must(re.search(r"~(?![01])", part) is None,"INVALID_CONTRACT","invalid escape")
        part = part.replace("~1","/").replace("~0","~")
        if isinstance(value,list):
            must(part.isdecimal(),"INVALID_CONTRACT","array index required")
            value=value[int(part)]
        else: value=value[part]
    return value

def selected(root, round_id, rule):
    prefix="rounds/"+round_id+"/"
    path=prefix+rule["path"]
    kind=rule["kind"]
    if kind=="file_exact": return read(root,path)
    if kind in ("json_equal","json_value"):
        return canonical(value_at(load(root,path),rule["pointer"]))
    if kind=="text_equal":
        text=read(root,path).decode("utf-8")
        start,end=rule["start"],rule["end"]
        must(text.count(start)==1 and text.count(end)==1,"INVALID_CONTRACT","fragment markers not unique")
        i=text.index(start); j=text.index(end,i)+len(end)
        return text[i:j].encode()
    if kind=="contains": return rule["expected"].encode() in read(root,path)
    raise Fault("NEEDS_EVIDENCE","manual observation requires external reviewer evidence")

def validate(root):
    pending=[]
    idx=load(root,"design-revisions.json")
    must(idx.get("profile")=="controlled-revisions-v1","INVALID_INDEX","unexpected revision profile")
    intent_ref=idx.get("intent_ref")
    must(idx.get("intent_sha256")==digest(root,intent_ref),"STALE_INTENT","intent changed")
    rows=idx.get("rounds")
    must(isinstance(rows,list) and bool(rows),"INVALID_INDEX","no rounds")
    ids=[r.get("round_id") for r in rows]
    must(len(set(ids))==len(ids),"INVALID_INDEX","duplicate rounds")
    must(idx.get("current_round")==ids[-1],"INVALID_INDEX","incorrect current round")
    must([p.name for p in safe(root,"rounds").iterdir() if p.is_dir()] and
         set(p.name for p in safe(root,"rounds").iterdir() if p.is_dir())==set(ids),
         "BROKEN_HISTORY","orphan or missing round")
    events={}; prev=None
    raw=read(root,"feedback.jsonl")
    must(not raw or raw.endswith(b"\n"),"BROKEN_HISTORY","partial feedback line")
    for line in raw.splitlines():
        event=json.loads(line.decode("utf-8"),object_pairs_hook=pairs)
        body={k:v for k,v in event.items() if k!="event_sha256"}
        must(sha(canonical(body))==event.get("event_sha256") and event.get("previous_sha256")==prev,
             "BROKEN_HISTORY","feedback hash chain")
        prev=event["event_sha256"]
        must(event.get("id") not in events,"BROKEN_HISTORY","repeated feedback ID")
        events[event["id"]]=event
    if not raw:
        must(idx.get("ledger_sha256") in (None,sha(b"")),"BROKEN_HISTORY","bad empty ledger")
    else: must(idx.get("ledger_sha256")==sha(raw),"BROKEN_HISTORY","index ledger mismatch")
    baseline=None; earlier_contracts=[]; earlier_snapshots={}
    for row in rows:
        rid=row["round_id"]
        sname=f"rounds/{rid}/snapshot.json"
        must(digest(root,sname)==row["snapshot_sha256"],"BROKEN_HISTORY","snapshot changed "+rid)
        snap=load(root,sname)
        must(snap.get("round_id")==rid and snap.get("intent_sha256")==idx["intent_sha256"],
             "BROKEN_HISTORY","snapshot identity changed")
        if earlier_snapshots:
            parent=snap.get("parent")
            previous_id=ids[ids.index(rid)-1]
            must(parent=={"round_id":previous_id,"snapshot_sha256":earlier_snapshots[previous_id]},
                 "STALE_BASE","parent mismatch "+rid)
        else:
            must(snap.get("parent") is None,"STALE_BASE","initial parent not null")
        contract_ref=snap["contract_ref"]
        must(digest(root,contract_ref)==snap["contract_sha256"],"BROKEN_HISTORY","contract changed "+rid)
        contract=load(root,contract_ref)
        must(contract.get("intent_sha256")==idx["intent_sha256"],"STALE_INTENT","contract wrong intent")
        files=snap.get("files",{})
        must(isinstance(files,dict) and files,"BROKEN_HISTORY","no sealed files")
        actual={}
        for f,h in files.items():
            actual[f]=digest(root,f"rounds/{rid}/{f}")
            must(actual[f]==h,"BROKEN_HISTORY","sealed asset changed "+rid+"/"+f)
        actual_paths=set()
        for p in safe(root,f"rounds/{rid}").rglob("*"):
            must(not p.is_symlink(),"INVALID_PATH","symlink in snapshot")
            if p.is_file() and p.name!="snapshot.json":
                actual_paths.add(p.relative_to(safe(root,f"rounds/{rid}")).as_posix())
        must(actual_paths==set(files),"BROKEN_HISTORY","untracked snapshot asset "+rid)
        if baseline is None:
            must(contract.get("mode")=="baseline","INVALID_CONTRACT","initial contract not baseline")
            baseline=(rid,contract)
        else:
            must(contract.get("mode")=="revision","INVALID_CONTRACT","noninitial baseline")
            previous_id=ids[ids.index(rid)-1]
            must(contract.get("base")==snap["parent"],"STALE_BASE","contract base mismatch")
            before=load(root,f"rounds/{previous_id}/snapshot.json")
            changed={f for f in set(before["files"])|set(files)
                     if before["files"].get(f)!=files.get(f)}
            allowed=contract.get("allowed_paths",[])
            must(isinstance(allowed,list) and len(allowed)==len(set(allowed)),
                 "INVALID_CONTRACT","bad allowed paths")
            must(changed.issubset(set(allowed)),"SCOPE_LEAK","unexpected file changes: "+str(changed-set(allowed)))
            must(set(contract.get("impact",{}))==set(allowed),"INVALID_CONTRACT","impact not explained for allowed paths")
            for fid in contract.get("feedback_ids",[]):
                must(fid in events and snap.get("feedback_hashes",{}).get(fid)==events[fid]["event_sha256"],
                     "BROKEN_HISTORY","missing feedback binding "+fid)
                event=events[fid]
                must(event.get("base_round")==previous_id and
                     event.get("base_snapshot_sha256")==earlier_snapshots[previous_id],
                     "NEEDS_REBASE","feedback for stale base "+fid)
            original_pres={x["id"]:x for x in baseline[1].get("preservations",[])}
            inherited={x["id"]:x for x in contract.get("preservations",[])}
            must(all(inherited.get(k)==v for k,v in original_pres.items()),
                 "SCOPE_LEAK","baseline protections weakened")
        # Compare every inherited preservation with original anchor, not just previous round.
        for rule in contract.get("preservations",[]):
            if rule["kind"]=="manual":
                pending.append(f"{rid}:{rule['id']} manual observation")
                continue
            if rule["id"] in {p["id"] for p in baseline[1].get("preservations",[])}:
                expected=selected(root,baseline[0],rule)
                actual_value=selected(root,rid,rule)
                must(expected==actual_value,"PRESERVATION_FAILED",rid+":"+rule["id"])
        for prev_contract in earlier_contracts+[contract]:
            for rule in prev_contract.get("acceptance",[]):
                if rule["kind"]=="manual":
                    pending.append(f"{rid}:{rule['id']} manual acceptance")
                elif rule["kind"]=="contains":
                    must(selected(root,rid,rule),"ACCEPTANCE_FAILED",rid+":"+rule["id"])
                elif rule["kind"]=="json_value":
                    must(value_at(load(root,f"rounds/{rid}/{rule['path']}"),rule["pointer"])==rule["expected"],
                         "ACCEPTANCE_FAILED",rid+":"+rule["id"])
                else:
                    raise Fault("INVALID_CONTRACT","invalid acceptance type")
        earlier_contracts.append(contract)
        earlier_snapshots[rid]=row["snapshot_sha256"]
    return pending

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--task",required=True,type=Path)
    ap.add_argument("--require-accepted",action="store_true")
    args=ap.parse_args()
    try:
        pending=validate(args.task.resolve())
        if args.require_accepted:
            raise Fault("NEEDS_EXTERNAL_APPROVAL","Static hashes cannot authenticate Human approval")
        print(json.dumps({"status":"PASS_STATIC_ONLY" if not pending else "NEEDS_EVIDENCE",
            "pending":pending,"human_authenticated":False,"visual_automation":False,
            "interaction_automation":False},ensure_ascii=False))
        return 0 if not pending else 2
    except (Fault,KeyError,ValueError,IndexError,TypeError,UnicodeDecodeError,OSError) as exc:
        code=exc.code if isinstance(exc,Fault) else "INVALID_ARTIFACT"
        print(json.dumps({"status":"BLOCKED","code":code,"detail":str(exc),
                          "human_authenticated":False},ensure_ascii=False))
        return 2

if __name__=="__main__": sys.exit(main())
