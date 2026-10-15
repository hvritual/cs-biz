#!/usr/bin/env python3
"""IntentSpec v0.2 read-only decision verifier, compatible subset, not semantic oracle."""
from pathlib import Path
import argparse,json,re,sys

REQUIRED={"schema_version":str,"phase":str,"raw_request":str,"intent":dict,
    "hard_constraints":list,"evidence":list,"unknowns":list,"decisions":list,
    "risks":list,"conflicts":list,"alternatives":list,"proposed_actions":list,
    "stop_flags":list,"optimized_prompt":str,"user_claims":list}
RANK={"read_only":0,"draft_only":1,"code_change":2,"external_action":3}
VERB={"inspect":0,"design":1,"modify":2,"create":2,"delete":3,"deploy":3,"export":3}
RISK={"tenant_access","money_movement","production_deployment",
      "destructive_data","security_exception","irreversible_operation"}
def decision(spec,repo=None):
    reasons=[];warnings=[]
    def out(status,rule,issues=()):
        return {"status":status,"reason":rule,"issues":list(issues),
                "warnings":warnings,"semantic_verified":False,"authorized_to_execute":False}
    if not isinstance(spec,dict):
        return out("BLOCKED","INVALID_SPEC")
    for key,kind in REQUIRED.items():
        if not isinstance(spec.get(key),kind):
            reasons.append("missing or malformed "+key)
    if reasons:return out("BLOCKED","INVALID_SPEC",reasons)
    if spec["phase"] not in ("extracted","rewritten"):
        return out("BLOCKED","INVALID_PHASE")
    raw=spec["raw_request"];intent=spec["intent"];phase=spec["phase"]
    objective=intent.get("objective","")
    quote=intent.get("objective_source_quote","")
    if not isinstance(objective,str) or not objective.strip() or not isinstance(quote,str) or quote not in raw or not quote:
        return out("BLOCKED","INTENT_PROVENANCE")
    action,authorization=intent.get("action"),intent.get("authorization")
    if action not in ("read_only","design","code_change","external_action") or authorization not in RANK:
        return out("BLOCKED","INVALID_ACTION")
    if phase=="extracted" and spec["optimized_prompt"]:
        return out("BLOCKED","PREMATURE_REWRITE")
    if phase=="rewritten" and not spec["optimized_prompt"].strip():
        return out("BLOCKED","MISSING_REWRITE")
    protected=set()
    for row in spec["hard_constraints"]:
        if not isinstance(row,dict) or not row.get("source_quote") or row["source_quote"] not in raw:
            return out("BLOCKED","CONSTRAINT_NOT_GROUNDED")
        if phase=="rewritten" and row.get("optimized_quote","") not in spec["optimized_prompt"]:
            return out("BLOCKED","CONSTRAINT_DROPPED")
        if phase=="extracted" and row.get("optimized_quote"):
            return out("BLOCKED","PREMATURE_REWRITE")
        if row.get("kind") in ("prohibition","scope","authorization"):
            protected.update(str(x).lower() for x in row.get("forbid_targets",[]))
    for section in ("hard_constraints","decisions","unknowns","conflicts"):
        ids=[x.get("id") for x in spec[section] if isinstance(x,dict)]
        if len(ids)!=len(set(ids)):
            return out("BLOCKED","DUPLICATE_IDS")
    for row in spec["evidence"]:
        if not isinstance(row,dict) or not row.get("path") or not row.get("quote"):
            return out("BLOCKED","BAD_EVIDENCE")
        if repo:
            from pathlib import PurePosixPath
            name=row["path"];path=PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts or "\\" in name:
                return out("BLOCKED","BAD_EVIDENCE_PATH")
            cursor=Path(repo).resolve()
            for part in path.parts:
                cursor=cursor/part
                if cursor.is_symlink():return out("BLOCKED","BAD_EVIDENCE_PATH")
            if not cursor.is_file() or not cursor.resolve().is_relative_to(Path(repo).resolve()):
                return out("BLOCKED","MISSING_EVIDENCE")
            if cursor.stat().st_size>200000 or row["quote"] not in cursor.read_text(encoding="utf-8"):
                return out("BLOCKED","EVIDENCE_QUOTE_MISMATCH")
        else:
            return out("NEEDS_EVIDENCE","EVIDENCE_ROOT_NOT_GIVEN")
    if spec["stop_flags"] or re.search(r"(私钥|密码|secret|private.key).{0,25}(发送|导出|邮箱|external)",raw,re.I):
        return out("BLOCKED","UNSAFE_EXPORT")
    if RANK[action.replace("design","draft_only")] > RANK[authorization]:
        return out("BLOCKED","AUTHORIZATION_ESCALATION")
    for row in spec["proposed_actions"]:
        if not isinstance(row,dict) or row.get("verb") not in VERB:
            return out("BLOCKED","INVALID_PROPOSED_ACTION")
        if VERB[row["verb"]]>RANK[authorization]:
            return out("BLOCKED","ACTION_ESCALATION")
        if row["verb"] not in ("inspect","design") and any(x in str(row.get("target","")).lower() for x in protected):
            return out("BLOCKED","PROTECTED_TARGET")
    if phase=="rewritten" and action in ("code_change","external_action") and not spec["proposed_actions"]:
        return out("BLOCKED","MISSING_ACTION_DECLARATION")
    if phase=="rewritten" and protected and any("backend" in t for t in protected):
        if re.search(r"(替换服务端|改动后端|调整服务器|modify.backend|change.backend)",spec["optimized_prompt"],re.I):
            return out("BLOCKED","SEMANTIC_SCOPE_CONFLICT")
    if any(x.get("blocking") and x.get("kind") in ("hard_constraint","user_instructions") for x in spec["conflicts"]):
        return out("BLOCKED","HARD_CONSTRAINT_CONFLICT")
    if action in ("code_change","external_action") and (
        action=="external_action" or
        any(x.get("active") and x.get("type") in RISK for x in spec["risks"]) or
        re.search(r"(跨租户|自动退款|全量.?(OTA|升级)|生产.*删除)",raw,re.I)):
        return out("NEEDS_DECISION","HIGH_IMPACT")
    if any(x.get("blocking") and x.get("kind") in ("policy","capability") for x in spec["conflicts"]):
        return out("NEEDS_DECISION","POLICY_CONFLICT")
    if any(x.get("blocking") and x.get("source")=="repository" for x in spec["unknowns"]):
        return out("NEEDS_EVIDENCE","REPOSITORY_UNKNOWN")
    if any(x.get("blocking") and x.get("source")=="human" for x in spec["unknowns"]) or any(
        x.get("unresolved") for x in spec["decisions"]) or sum(1 for a in spec["alternatives"] if a.get("material"))>1:
        return out("NEEDS_DECISION","MATERIAL_AMBIGUITY")
    warnings.append("READY only means draft ready for Human review; omitted semantic risks are not ruled out.")
    return out("READY","PREFLIGHT_ONLY" if phase=="extracted" else "READY_FOR_REVIEW")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("spec",type=Path)
    ap.add_argument("--repo-root",type=Path)
    args=ap.parse_args()
    try:
        must=args.spec.stat().st_size<=1000000
        s=json.loads(args.spec.read_text(encoding="utf-8")) if must else None
        result=decision(s,args.repo_root)
    except (ValueError,OSError,UnicodeError,KeyError,TypeError) as err:
        result={"status":"BLOCKED","reason":"INVALID_INPUT","issues":[str(err)]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 2 if result["status"]=="BLOCKED" else 0
if __name__=="__main__":sys.exit(main())
