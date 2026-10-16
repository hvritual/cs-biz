"""Counterexamples for parent-goal continuity; synthetic data is never authority."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('continuity_goal', PACKAGE/'scripts/check_goal.py')
api = importlib.util.module_from_spec(spec); spec.loader.exec_module(api)


class ContinuityTests(unittest.TestCase):
    def write(self, name, data):
        (self.task/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
        return {'path': name, 'sha256': api.digest((self.task/name).read_bytes())}

    def setUp(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        self.task = Path(temp.name)/'task'; shutil.copytree(PACKAGE/'examples/saas', self.task)
        self.goal = json.loads((self.task/'goal.json').read_text())
        self.goal['raw_ref'] = self.write('raw.txt', 'SYNTHETIC ONLY: implement nonproduction OIDC login and tenant-bound single-use invitations; integrate main after real verification. Invitation expiry needs a separate product decision. This fixture grants no actual authority.\n')
        self.goal['requested_boundary'] = 'integrated_main'
        self.assessment = json.loads((self.task/'assessment.json').read_text())
        self.assessment['basis_sha256'] = api.basis(self.goal)
        self.assessment['requirements'][0]['rationale'] = 'An enabled member must log in through the chosen IdP and access only its tenant.'
        self.assessment['criteria'][0].update(given='An enabled member of tenant A and a real nonproduction IdP.',
            when='The member completes code+PKCE login and selects tenant A.',
            then='The session endpoint identifies the member and tenant A; the protected API accepts its granted action.',
            negative='A cross-tenant request or revoked membership is denied by the server.',
            recovery='A lost login reply is reconciled through session readback without duplicate accounts.')
        requirement = copy.deepcopy(self.assessment['requirements'][0]); requirement.update(id='R2', criterion_ids=['AC2'])
        requirement['rationale'] = 'Tenant invitations must create only the intended membership and cannot be reused.'
        criterion = copy.deepcopy(self.assessment['criteria'][0]); criterion.update(id='AC2',
            given='A tenant-bound invitation and an explicitly approved expiry policy.',
            when='Its intended identity accepts it within the approved validity window.',
            then='Exactly one intended tenant membership is created and the invitation is consumed.',
            negative='Replay, wrong identity and acceptance outside the approved window are denied.',
            recovery='A lost acceptance reply reads the existing membership without consuming again.')
        self.assessment['requirements'].append(requirement); self.assessment['criteria'].append(criterion)
        self.architecture = json.loads((self.task/'architecture.json').read_text())
        self.architecture['basis_sha256'] = api.basis(self.goal)
        self.evidence = self.write('synthetic-evidence.json', {'notice': 'SYNTHETIC_ONLY: not real evidence or approval'})
        def node(key, kind, req, ac, deps):
            return {'id': key, 'task_id':key, 'kind': kind, 'requirement_ids': [req], 'criterion_ids': [ac],
                    'depends_on': deps, 'stage': 'build', 'task_ref': 'fixture://'+key,
                    'outcome': 'Observable synthetic result for '+key,
                    'omission_impact': 'Without this work the named original criterion cannot be fulfilled.', 'admission_ref': None}
        self.record = {'protocol': 'goal-coordination-v1', 'basis_sha256': api.basis(self.goal), 'goal_id': self.goal['goal_id'],
                       'assessment_sha256': '', 'work_items': [node('database','prerequisite','R1','AC1',[]),
                       node('login','outcome','R1','AC1',['database']), node('invitation','outcome','R2','AC2',[])],
                       'observations': [], 'decision_scopes': [], 'business_proofs': [], 'last_event': None, 'reconciliation_ref': None}
        for node_ in self.record['work_items']:
            key = node_['id']
            node_['admission_ref'] = self.write(key+'-admission.json', {
                'goal_id': self.goal['goal_id'], 'basis_sha256': api.basis(self.goal), 'work_id': key,
                'definition_sha256': self.definition(node_), 'decision': 'approved',
                'stage_intake_ref': self.write(key+'-intake.json', {'task_id':key,'contract':{
                    'requirement_ids':node_['requirement_ids'],'acceptance_ids':node_['criterion_ids'],
                    'completion_boundary':self.goal['requested_boundary']}}),
                'authority_ref': self.evidence, 'review_ref': self.evidence})
            self.record['observations'].append({'work_id': key, 'state': 'pending', 'candidate_ref': None,
                'return_ref': None, 'readback_ref': None, 'blocker': None, 'attempts_without_progress': 0})

    def definition(self, node):
        return api.digest({k:v for k,v in node.items() if k != 'admission_ref'})

    def save(self, reconcile=True):
        self.goal['records']['assessment'] = self.write('assessment.json', self.assessment)
        self.architecture['assessment_sha256'] = self.goal['records']['assessment']['sha256']
        self.goal['records']['architecture'] = self.write('architecture.json', self.architecture)
        self.record['assessment_sha256'] = self.goal['records']['assessment']['sha256']
        if reconcile and self.record['last_event']:
            pending = sorted(d['id'] for d in self.assessment['decisions']+self.architecture['decisions'] if d['response'] is None)
            self.record['reconciliation_ref'] = self.write('reconciliation.json', {'goal_id': self.goal['goal_id'],
                'event_sha256': self.record['last_event']['record_ref']['sha256'],
                'observation_sha256': api.digest({'observations':self.record['observations'],'proofs':self.record['business_proofs'],'pending':pending}),
                'definition_sha256':api.digest({n['id']:self.definition(n) for n in self.record['work_items']}), 'readback_ref': self.evidence})
        self.goal['records']['coordination'] = self.write('coordination.json', self.record)
        self.write('goal.json', self.goal)

    def observed(self, key):
        return next(o for o in self.record['observations'] if o['work_id'] == key)

    def complete(self, key, status='completed', state='completed'):
        node = next(n for n in self.record['work_items'] if n['id'] == key)
        ref = self.write(key+'-return.json', {'protocol':'goal-stage-return-v1', 'goal_id':self.goal['goal_id'],
            'basis_sha256':api.basis(self.goal), 'work_id':key, 'candidate_ref':'fixture://existing-'+key, 'definition_sha256':self.definition(node),
            'stage':'build','status':status,'evidence_refs':[self.evidence],'review_ref':self.evidence})
        self.observed(key).update(state=state, candidate_ref='fixture://existing-'+key, return_ref=ref, readback_ref=self.evidence)
        self.record['last_event'] = {'kind':'stage_return','record_ref':ref}

    def decision(self, key='D-invite', work='invitation'):
        self.assessment['decisions'].append({'id':key,'kind':'business','owner':'Product owner',
            'facts':['Invitation expiry has no accepted value.'],'source_ids':['local'], 'missing':'Expiry policy',
            'options':[{'id':'short','description':'24-hour single-use invitation','tradeoffs':'More resends'},
                       {'id':'long','description':'72-hour single-use invitation','tradeoffs':'Longer exposure'}],
            'recommended':'short','impact':'Only invitation acceptance semantics are undefined.',
            'action_needed':'Choose invitation expiry.','response':None})
        self.record['decision_scopes'].append({'decision_id':key,'work_ids':[work], 'reason':'Only this behavior consumes the undecided policy.'})

    def proof(self, ac, key):
        self.record['business_proofs'].append({'criterion_id':ac,'work_id':key,'result':'PROVEN',
            'baseline_sha':self.goal['baseline_sha'],'environment':'synthetic-only','evidence_ref':self.evidence,'review_ref':self.evidence})

    def test_prerequisite_completion_selects_business_successor_not_goal_done(self):
        self.complete('database'); self.save(); result = api.check(self.task)
        self.assertEqual(result['next_action'],'ROUTE_STAGE'); self.assertEqual(result['coordination']['selected_work'],'login')
        self.assertEqual(result['coordination']['progress']['business_proven'],[])
        self.assertEqual(result['coordination']['progress']['prerequisites_satisfied'],['database'])
        self.assertFalse(result['coordination']['goal_complete']); self.assertFalse(result['execution_granted'])

    def test_scoped_pending_decision_does_not_pause_independent_work(self):
        self.decision(); self.save(); result = api.check(self.task)
        self.assertEqual(result['next_action'],'ROUTE_STAGE'); self.assertEqual(result['coordination']['selected_work'],'database')
        self.assertEqual(set(result['coordination']['blocked_work']),{'invitation'})

    def test_blocker_propagates_to_descendants_only(self):
        self.decision(work='database'); self.save(); result = api.check(self.task)
        self.assertEqual(result['coordination']['selected_work'],'invitation')
        self.assertEqual(set(result['coordination']['blocked_work']),{'database','login'})

    def test_all_remaining_work_blocked_returns_prepared_decision(self):
        self.decision(); self.record['decision_scopes'][0]['work_ids'] = ['database','invitation']; self.save()
        result = api.check(self.task); self.assertEqual(result['next_action'],'HUMAN_DECISION')
        self.assertEqual(result['coordination']['ready_work'],[])

    def test_missing_impact_scope_cannot_assume_independence(self):
        self.decision(); self.record['decision_scopes'] = []; self.save()
        with self.assertRaisesRegex(ValueError,'impact missing'): api.check(self.task)

    def test_partial_admission_never_admits_the_other_task(self):
        self.record['work_items'][0]['admission_ref'] = None
        self.decision(); self.save(); self.assertEqual(api.check(self.task)['next_action'],'ADMIT_WORK_ITEM')

    def test_changed_task_cannot_reuse_old_admission(self):
        self.record['work_items'][0]['outcome'] = 'A different business promise'; self.save()
        with self.assertRaisesRegex(ValueError,'admission binding drift'): api.check(self.task)

    def test_cumulative_stall_budget_cannot_reset_when_splitting_tasks(self):
        self.goal['budget']['attempts_without_progress'] = 2; self.save()
        with self.assertRaisesRegex(ValueError,'cumulative stall'): api.check(self.task)
        self.observed('database')['attempts_without_progress'] = 2; self.save()
        self.assertEqual(api.check(self.task)['coordination']['selected_work'],'invitation')

    def test_stage_intake_cannot_drop_parent_acceptance(self):
        node = self.record['work_items'][0]
        admission = json.loads((self.task/node['admission_ref']['path']).read_text())
        admission['stage_intake_ref'] = self.write('wrong-intake.json', {'task_id':'database','contract':{
            'requirement_ids':['R1'],'acceptance_ids':['OTHER'],'completion_boundary':'integrated_main'}})
        node['admission_ref'] = self.write('database-admission.json',admission); self.save()
        with self.assertRaisesRegex(ValueError,'lost original acceptance'): api.check(self.task)

    def test_cannot_drop_required_work_or_use_only_prerequisites(self):
        for mutation in (lambda: self.record['work_items'].pop(),
                         lambda: self.record['work_items'][1].update(kind='prerequisite')):
            with self.subTest():
                original = copy.deepcopy(self.record); mutation(); self.save()
                with self.assertRaises(ValueError): api.check(self.task)
                self.record = original

    def test_unknown_result_is_read_back_before_other_work_even_after_stall(self):
        self.complete('database',status='unknown',state='unknown'); self.observed('database')['attempts_without_progress'] = 2
        self.save(); result = api.check(self.task)
        self.assertEqual(result['next_action'],'READBACK_STAGE_RESULT')
        self.assertEqual(result['coordination']['selected_work'],'database')

    def test_stage_return_and_changed_observation_require_reconciliation(self):
        self.complete('database'); self.save(reconcile=False)
        self.assertEqual(api.check(self.task)['next_action'],'RECONCILE_GOAL')
        self.save(); self.assertEqual(api.check(self.task)['next_action'],'ROUTE_STAGE')
        self.observed('invitation')['attempts_without_progress'] = 1; self.save(reconcile=False)
        self.assertEqual(api.check(self.task)['next_action'],'RECONCILE_GOAL')

    def test_active_blocked_candidate_must_be_suspended_before_switch(self):
        self.observed('database').update(state='active',candidate_ref='fixture://retain-pr')
        self.decision(work='database'); self.record['last_event'] = {'kind':'resume','record_ref':self.evidence}; self.save()
        self.assertEqual(api.check(self.task)['next_action'],'SUSPEND_WORK_ITEM')
        self.observed('database')['state'] = 'suspended'; self.save()
        self.assertEqual(api.check(self.task)['coordination']['selected_work'],'invitation')

    def test_two_active_candidates_rejected(self):
        for key in ('database','invitation'):
            self.observed(key).update(state='active',candidate_ref='fixture://'+key)
        self.record['last_event'] = {'kind':'resume','record_ref':self.evidence}; self.save()
        with self.assertRaisesRegex(ValueError,'more than one active'): api.check(self.task)

    def test_active_work_with_unfinished_dependency_is_suspended(self):
        self.observed('login').update(state='active',candidate_ref='fixture://existing-login')
        self.record['last_event'] = {'kind':'resume','record_ref':self.evidence}; self.save()
        result = api.check(self.task)
        self.assertEqual(result['next_action'],'SUSPEND_WORK_ITEM')
        self.assertIn('unfinished_dependency',result['coordination']['blocked_work']['login'])

    def test_failed_or_blocked_return_cannot_be_resumed_without_recovery(self):
        for status in ('failed','blocked'):
            self.complete('database',status=status,state='active'); self.save()
            with self.assertRaisesRegex(ValueError,'recovery blocker'): api.check(self.task)

    def test_bound_recovery_resumes_existing_candidate_without_erasing_failure(self):
        self.complete('database',status='blocked',state='active')
        observed = self.observed('database'); node = self.record['work_items'][0]
        recovery = {'goal_id':self.goal['goal_id'],'basis_sha256':api.basis(self.goal),'work_id':'database',
            'candidate_ref':observed['candidate_ref'],
            'definition_sha256':self.definition(node),'return_sha256':observed['return_ref']['sha256'],
            'decision':'resume','evidence_refs':[self.evidence]}
        observed['recovery_ref'] = self.write('recovery.json',recovery); self.save()
        self.assertEqual(api.check(self.task)['next_action'],'RESUME_STAGE')
        self.assertEqual(observed['candidate_ref'],'fixture://existing-database')
        self.assertEqual(json.loads((self.task/observed['return_ref']['path']).read_text())['status'],'blocked')
        observed['candidate_ref'] = 'fixture://replacement-pr'; self.save()
        with self.assertRaisesRegex(ValueError,'original blocked return|binding drift'): api.check(self.task)
        observed['candidate_ref'] = 'fixture://existing-database'
        recovery['return_sha256'] = '0'*64; observed['recovery_ref'] = self.write('recovery.json',recovery); self.save()
        with self.assertRaisesRegex(ValueError,'original blocked return'): api.check(self.task)

    def test_stage_units_may_share_canonical_task_without_redefining_stage(self):
        # A Design and Build unit can keep the same real stage task_id while
        # retaining different graph identities and definition/result bindings.
        node = self.record['work_items'][0]; node['task_id'] = 'shared-task'
        admission = json.loads((self.task/node['admission_ref']['path']).read_text())
        admission['definition_sha256'] = self.definition(node)
        admission['stage_intake_ref'] = self.write('shared-intake.json', {'task_id':'shared-task','contract':{
            'requirement_ids':['R1'],'acceptance_ids':['AC1'],'completion_boundary':'integrated_main'}})
        node['admission_ref'] = self.write('database-admission.json',admission); self.save()
        self.assertEqual(api.check(self.task)['coordination']['task_id'],'shared-task')

    def test_intake_cannot_expand_parent_to_deployment(self):
        node = self.record['work_items'][0]
        admission = json.loads((self.task/node['admission_ref']['path']).read_text())
        admission['stage_intake_ref'] = self.write('wrong-boundary.json', {'task_id':'database','contract':{
            'requirement_ids':['R1'],'acceptance_ids':['AC1'],'completion_boundary':'deployed'}})
        node['admission_ref'] = self.write('database-admission.json',admission); self.save()
        with self.assertRaisesRegex(ValueError,'exceeds parent'): api.check(self.task)

    def test_higher_stage_outside_parent_boundary_cannot_be_admitted(self):
        node = self.record['work_items'][0]; node['stage'] = 'deploy'
        admission = json.loads((self.task/node['admission_ref']['path']).read_text()); admission['definition_sha256'] = self.definition(node)
        node['admission_ref'] = self.write('database-admission.json',admission); self.save()
        with self.assertRaisesRegex(ValueError,'exceeds parent'): api.check(self.task)

    def test_all_stages_complete_without_business_proof_still_unproven(self):
        for key in ('database','login','invitation'): self.complete(key)
        self.save(); self.assertEqual(api.check(self.task)['next_action'],'VERIFY_BUSINESS_OUTCOME')
        self.proof('AC1','login'); self.proof('AC2','invitation'); self.save()
        result = api.check(self.task); self.assertEqual(result['next_action'],'REVIEW_GOAL_CLOSURE')
        self.assertFalse(result['coordination']['goal_complete']); self.assertEqual(result['runtime'],'NOT_VERIFIED')

    def test_prerequisite_evidence_cannot_prove_business_and_environment_must_match(self):
        self.complete('database'); self.proof('AC1','database'); self.save()
        with self.assertRaisesRegex(ValueError,'prerequisite'): api.check(self.task)
        self.record['business_proofs'] = []; self.complete('login'); self.proof('AC1','login')
        self.record['business_proofs'][0]['environment'] = 'production'; self.save()
        with self.assertRaisesRegex(ValueError,'not current'): api.check(self.task)

    def test_completed_work_needs_review_readback_and_stage_binding(self):
        self.complete('database'); self.observed('database')['readback_ref'] = None; self.save()
        with self.assertRaisesRegex(ValueError,'readback'): api.check(self.task)

    def test_cyclic_work_rejected(self):
        self.record['work_items'][0]['depends_on'] = ['login']; self.save()
        with self.assertRaisesRegex(ValueError,'cyclic'): api.check(self.task)

    def test_stop_dominates_completed_work_and_live_drift(self):
        self.complete('database'); self.save()
        self.goal['records']['control'] = self.write('control.json', {'basis_sha256':api.basis(self.goal),
            'goal_id':self.goal['goal_id'],'state':'stopped','record_ref':self.evidence})
        self.write('goal.json',self.goal)
        result = api.check(self.task,'b'*40)
        self.assertEqual(result['state'],'STOPPED'); self.assertEqual(result['next_action'],'NO_ACTION')
