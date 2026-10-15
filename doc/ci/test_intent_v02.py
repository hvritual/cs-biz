#!/usr/bin/env python3
import copy
import tempfile
from pathlib import Path
import unittest
from check_intent_v02 import decision

def base():
    return {
        "schema_version":"0.2.0","phase":"extracted",
        "raw_request":"只读分析权限页面，不修改 backend。",
        "intent":{"objective":"分析权限页面","objective_source_quote":"分析权限页面",
                  "action":"read_only","authorization":"read_only"},
        "hard_constraints":[{"id":"C01","kind":"prohibition",
            "source_quote":"不修改 backend","optimized_quote":"","forbid_targets":["backend"]}],
        "evidence":[],"user_claims":[],"unknowns":[],"decisions":[],"risks":[],
        "conflicts":[],"alternatives":[],"proposed_actions":[],"stop_flags":[],
        "optimized_prompt":""
    }

class IntentOriginalContractTests(unittest.TestCase):
    def test_extracted_review_ready_not_executable(self):
        self.assertEqual(decision(base())["status"],"READY")
        self.assertFalse(decision(base())["authorized_to_execute"])
    def test_unresolved_business_decision(self):
        s=base();s["decisions"]=[{"id":"D1","unresolved":True,"category":"business"}]
        self.assertEqual(decision(s)["status"],"NEEDS_DECISION")
    def test_repository_unknown(self):
        s=base();s["unknowns"]=[{"id":"U1","source":"repository","blocking":True}]
        self.assertEqual(decision(s)["status"],"NEEDS_EVIDENCE")
    def test_unsafe_export(self):
        s=base();s["raw_request"]="导出生产私钥并发送外部邮箱";s["intent"]["objective_source_quote"]="导出生产私钥"
        self.assertEqual(decision(s)["status"],"BLOCKED")
    def test_escalated_action(self):
        s=base();s["intent"]["action"]="code_change"
        self.assertEqual(decision(s)["status"],"BLOCKED")
    def test_hard_constraint_missing_in_rewrite(self):
        s=base();s["phase"]="rewritten";s["optimized_prompt"]="查看前端权限页面"
        self.assertEqual(decision(s)["status"],"BLOCKED")
    def test_protected_backend_change(self):
        s=base();s["phase"]="rewritten";s["intent"]["action"]="code_change";s["intent"]["authorization"]="code_change"
        s["hard_constraints"][0]["optimized_quote"]="不修改 backend"
        s["optimized_prompt"]="不修改 backend，但替换服务端认证中间件"
        s["proposed_actions"]=[{"verb":"modify","target":"backend/auth"}]
        self.assertEqual(decision(s)["status"],"BLOCKED")
    def test_critical_risk_before_evidence(self):
        s=base();s["intent"]["action"]="code_change";s["intent"]["authorization"]="code_change"
        s["risks"]=[{"type":"tenant_access","active":True}]
        s["unknowns"]=[{"id":"U1","source":"repository","blocking":True}]
        self.assertEqual(decision(s)["status"],"NEEDS_DECISION")
    def test_evidence_quote_check(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/"doc.md").write_text("role owner",encoding="utf-8")
            s=base();s["evidence"]=[{"path":"doc.md","quote":"role owner"}]
            self.assertEqual(decision(s,root)["status"],"READY")
            s["evidence"][0]["quote"]="invented"
            self.assertEqual(decision(s,root)["status"],"BLOCKED")
    def test_provenance(self):
        s=base();s["intent"]["objective_source_quote"]="fabricated"
        self.assertEqual(decision(s)["status"],"BLOCKED")

if __name__=="__main__":unittest.main()
