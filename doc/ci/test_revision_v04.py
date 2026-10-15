#!/usr/bin/env python3
"""Synthetic v0.4 fixture: passes the static proof and fails controlled mutations."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import check_revision_v04 as gate

def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gate.canonical(value)+b"\n")

def store(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data,encoding="utf-8")

def h(data): return hashlib.sha256(data).hexdigest()

def fixture(root):
    store(root/"intent.md","Accepted intent: member drawer\n")
    model={"roles":["owner","member"],"panel":"modal"}
    assets={"preview/demo.html":"<main>Members</main>",
            "preview/model.json":gate.canonical(model).decode(),
            "preview/flow.mmd":"flowchart TD\nA-->B\n"}
    c1={"schema_version":"0.1.0","id":"C001","mode":"baseline","base":None,
        "intent_sha256":h((root/"intent.md").read_bytes()),"feedback_ids":[],
        "target_ids":[],"allowed_paths":list(assets),"impact":{k:"initial" for k in assets},
        "preservations":[{"id":"P_roles","kind":"json_equal","path":"preview/model.json",
                          "pointer":"/roles","statement":"Keep roles"}],
        "acceptance":[{"id":"A0","kind":"contains","path":"preview/demo.html",
                       "expected":"Members","feedback_id":None,"statement":"Members exists"}]}
    dump(root/"contracts/C001.json",c1)
    def snap(rid,contract,parent,af,feedback_hashes):
        folder=root/"rounds"/rid
        for name,text in af.items():store(folder/name,text)
        files={name:h((folder/name).read_bytes()) for name in af}
        val={"schema_version":"0.1.0","round_id":rid,"intent_sha256":h((root/"intent.md").read_bytes()),
             "contract_ref":"contracts/"+contract+".json","contract_sha256":h((root/"contracts"/(contract+".json")).read_bytes()),
             "parent":parent,"feedback_hashes":feedback_hashes,"files":files}
        dump(folder/"snapshot.json",val)
        return h((folder/"snapshot.json").read_bytes())
    a=snap("r001","C001",None,assets,{})
    raw={"id":"F01","base_round":"r001","base_snapshot_sha256":a,
         "previous_sha256":None,"target_ids":["invite-panel"],
         "source":{"actor_type":"human","quote":"drawer"}}
    raw["event_sha256"]=h(gate.canonical(raw))
    store(root/"feedback.jsonl",gate.canonical(raw).decode()+"\n")
    c2=copy.deepcopy(c1)
    c2.update(id="C002",mode="revision",base={"round_id":"r001","snapshot_sha256":a},
              feedback_ids=["F01"],target_ids=["invite-panel"],
              allowed_paths=["preview/model.json"],impact={"preview/model.json":"change modal to drawer"},
              acceptance=[{"id":"A-F01","kind":"json_value","path":"preview/model.json",
                           "pointer":"/panel","expected":"drawer","feedback_id":"F01",
                           "statement":"Panel is drawer"}])
    dump(root/"contracts/C002.json",c2)
    modified=dict(assets)
    modified["preview/model.json"]=gate.canonical({"roles":["owner","member"],"panel":"drawer"}).decode()
    b=snap("r002","C002",{"round_id":"r001","snapshot_sha256":a},modified,{"F01":raw["event_sha256"]})
    idx={"profile":"controlled-revisions-v1","schema_version":"0.1.0",
         "intent_ref":"intent.md","intent_sha256":h((root/"intent.md").read_bytes()),
         "ledger_sha256":h((root/"feedback.jsonl").read_bytes()),"current_round":"r002",
         "rounds":[{"round_id":"r001","snapshot_sha256":a},{"round_id":"r002","snapshot_sha256":b}],
         "evidence":{}}
    dump(root/"design-revisions.json",idx)
    return idx

class RevisionGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)
        fixture(self.root)
    def tearDown(self): self.tmp.cleanup()
    def err(self,code):
        with self.assertRaises(gate.Fault) as ctx:gate.validate(self.root)
        self.assertEqual(ctx.exception.code,code)
    def test_valid_scoped_round(self):
        self.assertEqual(gate.validate(self.root),[])
    def test_asset_tampering(self):
        store(self.root/"rounds/r001/preview/flow.mmd","changed")
        self.err("BROKEN_HISTORY")
    def test_feedback_tampering(self):
        store(self.root/"feedback.jsonl",'{"unexpected":true}\n')
        self.err("BROKEN_HISTORY")
    def test_intent_binding(self):
        store(self.root/"intent.md","different intent")
        self.err("STALE_INTENT")
    def test_orphan_round(self):
        store(self.root/"rounds/r003/snapshot.json","{}")
        self.err("BROKEN_HISTORY")
    def test_out_of_scope_change(self):
        p=self.root/"rounds/r002/preview/flow.mmd"
        store(p,"flowchart LR")
        snap=self.root/"rounds/r002/snapshot.json"
        data=gate.load(self.root,"rounds/r002/snapshot.json")
        data["files"]["preview/flow.mmd"]=h(p.read_bytes())
        dump(snap,data)
        idx=gate.load(self.root,"design-revisions.json")
        idx["rounds"][1]["snapshot_sha256"]=h(snap.read_bytes())
        dump(self.root/"design-revisions.json",idx)
        self.err("SCOPE_LEAK")
    def test_protection_weakening(self):
        c=self.root/"contracts/C002.json"
        data=gate.load(self.root,"contracts/C002.json")
        data["preservations"]=[]
        dump(c,data)
        snap=self.root/"rounds/r002/snapshot.json"
        current=gate.load(self.root,"rounds/r002/snapshot.json")
        current["contract_sha256"]=h(c.read_bytes())
        dump(snap,current)
        idx=gate.load(self.root,"design-revisions.json")
        idx["rounds"][1]["snapshot_sha256"]=h(snap.read_bytes())
        dump(self.root/"design-revisions.json",idx)
        self.err("SCOPE_LEAK")
    def test_reject_path_traversal(self):
        with self.assertRaises(gate.Fault):gate.safe(self.root,"../../etc/passwd")
    def test_reject_duplicate_json_keys(self):
        store(self.root/"rounds/r001/snapshot.json",'{"a":1,"a":2}')
        self.err("BROKEN_HISTORY")
    def test_manual_requires_external_evidence(self):
        c=self.root/"contracts/C002.json"
        data=gate.load(self.root,"contracts/C002.json")
        data["preservations"].append({"id":"P_cancel","kind":"manual","statement":"Cancel does not submit"})
        dump(c,data)
        snap=self.root/"rounds/r002/snapshot.json"
        current=gate.load(self.root,"rounds/r002/snapshot.json")
        current["contract_sha256"]=h(c.read_bytes())
        dump(snap,current)
        idx=gate.load(self.root,"design-revisions.json")
        idx["rounds"][1]["snapshot_sha256"]=h(snap.read_bytes())
        dump(self.root/"design-revisions.json",idx)
        self.assertTrue(any("manual" in s for s in gate.validate(self.root)))

if __name__=="__main__":unittest.main()
