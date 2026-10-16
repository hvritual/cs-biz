#!/usr/bin/env python3
"""v0.4 Build-loop evidence validator (read-only, not a trusted CI integration).

Supports legacy TDD slices and cs-biz five permitted loop modes.
External CI, reviewer credentials and actual behavior must be verified separately.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def load(path):
    if not path.is_file() or path.stat().st_size>300000:
        raise ValueError("missing/oversized "+path.name)
    data=json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data,dict):raise ValueError("object required")
    return data
def check(task):
    problems=[];warnings=[]
    loop=load(task/"build-loop.json")
    approved=load(task/"build-scope.json")
    for name in ("design.md","plan.md"):
        key=name.replace(".md","_sha256")
        if loop.get(key)!=sha(task/name):
            problems.append("STALE_ARTIFACT:"+name)
    allowed=approved.get("allowed_paths",[]);forbidden=approved.get("forbidden_paths",[])
    if not isinstance(allowed,list) or not allowed or not isinstance(forbidden,list):
        problems.append("INVALID_SCOPE")
    from fnmatch import fnmatchcase
    def matches(path,rule):
        return fnmatchcase(path,rule) or (rule.endswith("/**") and path.startswith(rule[:-3]))
    changed=loop.get("changed_files",[])
    if not isinstance(changed,list) or not all(isinstance(x,str) for x in changed):
        problems.append("INVALID_DIFF")
    else:
        for path in changed:
            if ".." in Path(path).parts or path.startswith("/") or any(matches(path,g) for g in forbidden) or not any(matches(path,g) for g in allowed):
                problems.append("SCOPE_LEAK:"+path)
    requirements=set(approved.get("requirement_ids",[]))
    acceptances=set(approved.get("acceptance_ids",[]))
    if not requirements or not acceptances:problems.append("MISSING_LOCKED_ACCEPTANCE")
    covered_r=set();covered_ac=set();ids=set()
    slices=loop.get("slices",[])
    if not isinstance(slices,list) or not slices:problems.append("NO_SLICES");slices=[]
    for item in slices:
        if not isinstance(item,dict):problems.append("BAD_SLICE");continue
        sid=item.get("id","?")
        if sid in ids:problems.append("DUPLICATE_SLICE:"+str(sid))
        ids.add(sid)
        r=set(item.get("requirement_ids",[]));a=set(item.get("acceptance_ids",[]))
        if not r or not a or r-requirements or a-acceptances:problems.append("UNKNOWN_OR_EMPTY_COVERAGE:"+str(sid))
        covered_r|=r;covered_ac|=a
        mode=item.get("mode","tdd")
        if mode not in ("tdd","preserve","static","existing_verified","harness_required"):
            problems.append("INVALID_MODE:"+str(sid));continue
        if mode=="tdd":
            cycles=item.get("cycles",[])
            if not isinstance(cycles,list) or not cycles:
                problems.append("NO_TDD_CYCLES:"+str(sid));continue
            for number,cycle in enumerate(cycles,1):
                if cycle.get("iteration")!=number:problems.append("NON_SEQUENTIAL:"+str(sid))
                red,green,refactor=(cycle.get(k,{}) for k in ("red","green","refactor"))
                if not all(isinstance(x,dict) for x in (red,green,refactor)):
                    problems.append("MISSING_CYCLE:"+str(sid));continue
                for label,part,expected in (("red",red,False),("green",green,True),("refactor",refactor,True)):
                    code=part.get("exit_code")
                    if type(code) is not int or (code==0)!=expected or not part.get("command") or not part.get("evidence_ref"):
                        problems.append("INVALID_"+label.upper()+":"+str(sid))
                if red.get("runner") not in ("isolated_local","isolated_workspace"):
                    problems.append("RED_SHARED_CI:"+str(sid))
                if red.get("failure_kind") not in ("assertion","contract"):
                    problems.append("INVALID_RED_REASON:"+str(sid))
                if not red.get("test_id") or red.get("test_id")!=green.get("test_id") or green.get("test_id")!=refactor.get("test_id"):
                    problems.append("TEST_ID_CHANGED:"+str(sid))
                if not red.get("test_hash") or red.get("test_hash")!=green.get("test_hash"):
                    problems.append("TEST_WEAKENED:"+str(sid))
                if not refactor.get("behavior_preserved") or not (refactor.get("change_ref") or refactor.get("no_change_reason")):
                    problems.append("REFACTOR_NOT_VERIFIED:"+str(sid))
        elif mode=="preserve":
            if not item.get("baseline_evidence_ref") or not item.get("preservation_evidence_ref"):
                problems.append("PRESERVATION_NOT_VERIFIED:"+str(sid))
        elif mode=="static":
            if not item.get("static_check_evidence_ref"):
                problems.append("STATIC_NOT_VERIFIED:"+str(sid))
        elif mode=="existing_verified":
            if item.get("changed_files") or not item.get("existing_behavior_evidence_ref"):
                problems.append("NOT_EXISTING_VERIFIED:"+str(sid))
        elif mode=="harness_required":
            if item.get("status")=="complete":
                problems.append("HARNESS_IS_NOT_COMPLETION:"+str(sid))
        ci=item.get("ci",{})
        if item.get("status")=="complete":
            if not isinstance(ci,dict) or ci.get("status")!="passed" or not re.fullmatch(r"[0-9a-f]{40}",str(ci.get("head_commit",""))) or not ci.get("job_ref"):
                problems.append("CI_NOT_PROVEN:"+str(sid))
            if not item.get("independent_review_ref"):
                problems.append("REVIEW_NOT_PROVEN:"+str(sid))
            warnings.append(str(sid)+": declared CI/reviewer references require external readback")
    if requirements-covered_r:problems.append("UNCOVERED_REQUIREMENTS")
    if acceptances-covered_ac:problems.append("UNCOVERED_ACCEPTANCES")
    final=loop.get("final_head_commit")
    if loop.get("status")=="complete":
        if not re.fullmatch(r"[0-9a-f]{40}",str(final)):problems.append("NO_FINAL_SHA")
        if any(x.get("status")!="complete" for x in slices):problems.append("INCOMPLETE_SLICE")
        if slices and final!=slices[-1].get("ci",{}).get("head_commit"):
            problems.append("FINAL_SHA_CI_MISMATCH")
    return problems,warnings

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--task",type=Path,required=True)
    args=p.parse_args()
    try:
        issues,warnings=check(args.task.resolve())
        result={"status":"BLOCKED" if issues else "PASS_STATIC_ONLY","issues":issues,
                "warnings":warnings,"external_ci_verified":False,"human_approval_verified":False}
    except (ValueError,TypeError,KeyError,OSError,AttributeError,json.JSONDecodeError) as exc:
        result={"status":"BLOCKED","issues":["INVALID_ARTIFACT:"+str(exc)],
                "external_ci_verified":False,"human_approval_verified":False}
    print(json.dumps(result,ensure_ascii=False))
    return 2 if result["status"]=="BLOCKED" else 0
if __name__=="__main__":sys.exit(main())
