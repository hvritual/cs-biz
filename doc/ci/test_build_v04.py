#!/usr/bin/env python3
import copy
import json
from pathlib import Path
import tempfile
import unittest
from check_build_v04 import check,sha

def write(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False),encoding="utf-8")

def fixture(root):
    (root/"design.md").write_text("# Design\n",encoding="utf-8")
    (root/"plan.md").write_text("# Plan\n",encoding="utf-8")
    scope={"allowed_paths":["frontend/**"],"forbidden_paths":["backend/**"],
           "requirement_ids":["R1"],"acceptance_ids":["AC-R1"]}
    write(root/"build-scope.json",scope)
    digest="a"*64;commit="f"*40
    def phase(code):
        return {"exit_code":code,"command":"python -m unittest","evidence_ref":"runs/sample.log",
                "test_id":"AC-R1","test_hash":digest}
    a={"id":"S01","mode":"tdd","requirement_ids":["R1"],
       "acceptance_ids":["AC-R1"],"status":"complete",
       "cycles":[{"iteration":1,"red":dict(phase(1),runner="isolated_workspace",failure_kind="assertion"),
                  "green":phase(0),"refactor":dict(phase(0),behavior_preserved=True,no_change_reason="no refactor required")}],
       "ci":{"status":"passed","head_commit":commit,"job_ref":"run:123"},"independent_review_ref":"review:123"}
    manifest={"status":"complete","design_sha256":sha(root/"design.md"),
              "plan_sha256":sha(root/"plan.md"),"final_head_commit":commit,
              "changed_files":["frontend/apps/console/view.ts"],"slices":[a]}
    write(root/"build-loop.json",manifest)
    return manifest

class BuildLoopOriginalTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.manifest=fixture(self.root)
    def tearDown(self):self.tmp.cleanup()
    def fail_with(self,text):
        issues,_=check(self.root)
        self.assertTrue(any(text in x for x in issues),issues)
    def test_happy_path_is_static_not_verified(self):
        self.assertEqual(check(self.root)[0],[])
        self.assertTrue(check(self.root)[1])
    def test_invalid_red_infrastructure(self):
        self.manifest["slices"][0]["cycles"][0]["red"]["failure_kind"]="dependency"
        write(self.root/"build-loop.json",self.manifest);self.fail_with("INVALID_RED_REASON")
    def test_no_red(self):
        self.manifest["slices"][0]["cycles"][0]["red"]["exit_code"]=0
        write(self.root/"build-loop.json",self.manifest);self.fail_with("INVALID_RED")
    def test_test_rewritten(self):
        self.manifest["slices"][0]["cycles"][0]["green"]["test_hash"]="b"*64
        write(self.root/"build-loop.json",self.manifest);self.fail_with("TEST_WEAKENED")
    def test_wrong_candidate(self):
        self.manifest["final_head_commit"]="0"*40
        write(self.root/"build-loop.json",self.manifest);self.fail_with("FINAL_SHA_CI_MISMATCH")
    def test_scope_leak(self):
        self.manifest["changed_files"]=["backend/iam/service.go"]
        write(self.root/"build-loop.json",self.manifest);self.fail_with("SCOPE_LEAK")
    def test_stale_design(self):
        (self.root/"design.md").write_text("# Changed",encoding="utf-8")
        self.fail_with("STALE_ARTIFACT")
    def test_missing_acceptance(self):
        self.manifest["slices"][0]["acceptance_ids"]=[]
        write(self.root/"build-loop.json",self.manifest);self.fail_with("UNCOVERED_ACCEPTANCES")
    def test_existing_verified_without_fake_red(self):
        s=self.manifest["slices"][0]
        s.pop("cycles");s["mode"]="existing_verified";s["status"]="complete"
        s["existing_behavior_evidence_ref"]="real observation ref"
        s["changed_files"]=[]
        self.manifest["changed_files"]=[]
        write(self.root/"build-loop.json",self.manifest)
        self.assertEqual(check(self.root)[0],[])
    def test_harness_unfinished(self):
        self.manifest["slices"][0]["mode"]="harness_required"
        self.manifest["slices"][0].pop("cycles")
        write(self.root/"build-loop.json",self.manifest)
        self.fail_with("HARNESS_IS_NOT_COMPLETION")

if __name__=="__main__":unittest.main()
