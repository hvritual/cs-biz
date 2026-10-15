import json
from pathlib import Path
import unittest
from sdlc_issue_intake import intake

class IntakeTests(unittest.TestCase):
    def setUp(self):
        self.input=json.loads((Path(__file__).resolve().parents[1]/'workflow/examples/issue-input.json').read_text())
    def event(self):return {'repository':{'full_name':'hvritual/cs-biz'},'issue':{'number':1,'state':'open','body':'### SDLC input\n\n```json\n'+json.dumps(self.input)+'\n```\n'}}
    def test_original_protocol_and_no_dispatch(self):
        r=intake(self.event(),'hvritual/cs-biz');self.assertEqual(r['status'],'INTAKE_VALIDATED');self.assertFalse(r['codex_dispatched']);self.assertFalse(r['authorized_to_execute'])
    def test_duplicate_delivery_has_same_key(self):
        self.assertEqual(intake(self.event(),'hvritual/cs-biz')['idempotency_key'],intake(self.event(),'hvritual/cs-biz')['idempotency_key'])
    def test_edit_changes_key(self):
        old=intake(self.event(),'hvritual/cs-biz')['idempotency_key'];self.input['goal']['outcome']='revised goal'
        self.assertNotEqual(old,intake(self.event(),'hvritual/cs-biz')['idempotency_key'])
    def test_other_issue_cannot_supply_authority(self):
        self.input['goal']['authority_ref']='https://github.com/hvritual/cs-biz/issues/2'
        with self.assertRaisesRegex(ValueError,'authority'):intake(self.event(),'hvritual/cs-biz')
    def test_other_repository(self):
        with self.assertRaisesRegex(ValueError,'repository'):intake(self.event(),'hvritual/biz')
    def test_shell_payload_stays_data(self):
        self.input['goal']['outcome']='$(touch /tmp/never-execute); `id`'
        self.assertEqual(intake(self.event(),'hvritual/cs-biz')['input']['goal']['outcome'],self.input['goal']['outcome'])
    def test_non_original_intent_rejected(self):
        self.input['intent_spec']={'approved':True}
        self.assertEqual(intake(self.event(),'hvritual/cs-biz')['intent_verdict']['status'],'BLOCKED')
    def test_evidence_not_falsely_ready(self):
        self.input['intent_spec']['evidence']=[{'path':'README.md','quote':'anything'}]
        self.assertEqual(intake(self.event(),'hvritual/cs-biz')['status'],'NEEDS_INTENT_REVIEW')
    def test_duplicate_json_sections_rejected(self):
        e=self.event();e['issue']['body']+='\n### SDLC input'
        with self.assertRaises(ValueError):intake(e,'hvritual/cs-biz')
    def test_pull_request_rejected(self):
        e=self.event();e['issue']['pull_request']={}
        with self.assertRaises(ValueError):intake(e,'hvritual/cs-biz')
    def test_non_object_intent_rows_blocked(self):
        for section in ('hard_constraints', 'evidence', 'unknowns', 'decisions', 'risks', 'conflicts', 'alternatives', 'proposed_actions'):
            with self.subTest(section=section):
                self.setUp();self.input['intent_spec'][section]=[None]
                with self.assertRaisesRegex(ValueError,'malformed intent section'):intake(self.event(),'hvritual/cs-biz')
    def test_malformed_event_containers_blocked(self):
        for key in ('issue','repository'):
            e=self.event();e[key]=None
            with self.assertRaises(ValueError):intake(e,'hvritual/cs-biz')
    def test_malformed_json(self):
        e=self.event();e['issue']['body']='### SDLC input\n```json\n{}\n```'
        with self.assertRaises(ValueError):intake(e,'hvritual/cs-biz')

if __name__=='__main__':unittest.main()
