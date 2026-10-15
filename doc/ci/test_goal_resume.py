import copy
import json
from pathlib import Path
import unittest
from check_goal_resume import reconcile, digest, validate_goal

EXAMPLES=Path(__file__).resolve().parents[1]/'workflow/examples'
def load(name):return json.loads((EXAMPLES/(name+'.json')).read_text())

class ContinuationTests(unittest.TestCase):
    def setUp(self):self.g=load('goal');self.c=load('checkpoint');self.now=load('current')
    def run_plan(self,event='new_evidence',eid='event-1'):
        return reconcile(self.g,self.c,self.now,eid,event)
    def test_fresh_session_restores_original_goal(self):
        r=self.run_plan();self.assertEqual(r['status'],'READY_FOR_AUTHORITY_CHECK');self.assertFalse(r['authorized_to_execute'])
    def test_no_input_claim_is_business_completion(self):
        self.assertFalse(self.run_plan()['business_complete'])
    def test_partial_acceptance_cannot_disappear(self):
        self.c['coverage']={}
        with self.assertRaisesRegex(ValueError,'coverage'):self.run_plan()
    def test_goal_change_requires_reapproval(self):
        self.g['acceptance'][0]['result']='read only UI'
        with self.assertRaisesRegex(ValueError,'original goal changed'):self.run_plan()
    def test_sha_drift(self):
        self.now['candidate_sha']='d'*40
        self.assertEqual(self.run_plan()['status'],'STALE_BINDINGS')
    def test_design_drift(self):
        self.now['design_digest']='d'*64
        self.assertEqual(self.run_plan()['status'],'STALE_BINDINGS')
    def test_authority_drift(self):
        self.now['authority_digest']='d'*64
        self.assertEqual(self.run_plan()['status'],'STALE_BINDINGS')
    def test_environment_drift(self):
        self.now['environment']='production'
        self.assertEqual(self.run_plan()['status'],'STALE_BINDINGS')
    def test_duplicate_event_is_noop(self):
        self.c['processed_event_ids']=['event-1']
        self.assertEqual(self.run_plan()['status'],'NOOP_DUPLICATE')
    def test_full_wait_survives_human_decision_event(self):
        self.c['state']='waiting_full'
        self.assertEqual(self.run_plan('human_decision')['status'],'WAITING_HUMAN_FULL')
    def test_human_wait_cannot_self_approve(self):
        self.c['state']='waiting_human';self.c['approved']=True
        self.assertEqual(self.run_plan('human_decision')['status'],'WAITING_HUMAN')
    def test_unknown_effect_prevents_retry(self):
        self.c['state']='unknown_effect'
        self.assertEqual(self.run_plan()['status'],'WAITING_RECONCILIATION')
    def test_new_run_does_not_reset_budget(self):
        self.c['attempt']=2;self.c['run_id']='new-run'
        self.assertEqual(self.run_plan()['status'],'BUDGET_EXHAUSTED')
    def test_dependency_event_is_not_resolution(self):
        self.c['state']='waiting_dependency'
        self.assertEqual(self.run_plan('dependency_resolved')['status'],'WAITING_DEPENDENCY')
    def test_evidence_reference_not_proof(self):
        self.c['state']='complete';self.c['coverage']['AC-01']={'status':'evidence_available','source':'agent-wrote-pass','candidate_sha':self.now['candidate_sha']}
        self.assertEqual(self.run_plan()['status'],'NEEDS_TRUSTED_VERIFICATION')
    def test_old_evidence(self):
        self.c['coverage']['AC-01']={'status':'evidence_available','source':'run/1','candidate_sha':'e'*40}
        self.assertEqual(self.run_plan()['status'],'STALE_EVIDENCE')
    def test_false_complete(self):
        self.c['state']='complete'
        with self.assertRaisesRegex(ValueError,'false completion'):self.run_plan()
    def test_unsafe_paths(self):
        for path in ('../backend','/etc/passwd','backend/../frontend','backend/**','backend\\auth','./backend'):
            with self.subTest(path=path):
                g=copy.deepcopy(self.g);g['scope']['allowed_paths']=[path]
                with self.assertRaisesRegex(ValueError,'unsafe scope'):validate_goal(g)
    def test_duplicate_ac(self):
        self.g['acceptance']*=2
        with self.assertRaisesRegex(ValueError,'duplicate'):validate_goal(self.g)
    def test_unadmitted_event_sleeps(self):
        self.g['wake_events']=['human_decision'];self.c['goal_digest']=digest(self.g)
        self.assertEqual(self.run_plan()['status'],'NOOP_EVENT')
    def test_boolean_attempt_rejected(self):
        self.c['attempt']=True
        with self.assertRaisesRegex(ValueError,'attempt'):self.run_plan()

if __name__=='__main__':unittest.main()
