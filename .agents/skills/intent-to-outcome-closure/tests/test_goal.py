"""Behavior and adversarial checks for goal routing, not product acceptance."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('goal_checker_under_test', PACKAGE / 'scripts/check_goal.py')
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


class GoalTests(unittest.TestCase):
    def fixture(self, kind='operation'):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        task = Path(temp.name) / 'task'; shutil.copytree(PACKAGE / 'examples' / kind, task)
        return task

    def read(self, task, name):
        return json.loads((task / name).read_text())

    def write(self, task, name, data):
        (task / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        return {'path': name, 'sha256': api.digest((task / name).read_bytes())}

    def mutate(self, task, kind, fn):
        goal = self.read(task, 'goal.json'); data = self.read(task, goal['records'][kind]['path'])
        fn(data); goal['records'][kind] = self.write(task, kind + '.json', data)
        self.write(task, 'goal.json', goal)

    def reply(self, task):
        return self.write(task, 'reply.json', {'synthetic': True, 'notice': 'A fixture is not actual Human authority.'})

    def execution(self, task, status='unknown'):
        goal = self.read(task, 'goal.json'); plan = self.read(task, 'operation.json')
        evidence = self.reply(task)
        run = {'basis_sha256': api.basis(goal), 'plan_sha256': goal['records']['operation']['sha256'],
               'operation_id': plan['operation_id'], 'environment': plan['environment'], 'authority_record_ref': evidence,
               'status': status, 'results': [{'id': id_, 'status': 'passed', 'evidence_ref': evidence} for id_ in plan['targets']],
               'proofs': [{'criterion_id': id_, 'environment': plan['environment'], 'observed_at': '2026-10-16T08:00:00+00:00',
                           'evidence_ref': evidence} for id_ in plan['criterion_ids']]}
        goal['records']['execution'] = self.write(task, 'execution.json', run); self.write(task, 'goal.json', goal)

    def decision(self, task):
        return {'id': 'D1', 'kind': 'resource', 'owner': 'Identity Owner', 'facts': ['The current source has no actual identity authority.'],
                'source_ids': ['service'], 'missing': 'Which nonproduction identity source may be used?',
                'options': [{'id': 'existing', 'description': 'Provide existing OIDC environment.', 'tradeoffs': 'Needs access from Owner.'},
                            {'id': 'defer', 'description': 'Defer effective changes.', 'tradeoffs': 'No unsafe activation; value delayed.'}],
                'recommended': 'existing', 'impact': 'Activation cannot proceed until authoritative identity is available.',
                'action_needed': 'Provide issuer/interface and a safe environment, without secrets in Git.', 'response': None}

    def test_incomplete_intent_discovers_before_freezing_acceptance(self):
        result = api.check(self.fixture('explore'))
        self.assertEqual(result['next_action'], 'DISCOVER')
        self.assertFalse(result['execution_granted'])

    def test_software_uses_architecture_then_existing_design(self):
        task = self.fixture('saas'); self.assertEqual(api.check(task)['next_action'], 'ROUTE_SOFTWARE')
        self.assertEqual(api.check(task)['resources'], ['../sdlc-workflow/SKILL.md'])
        goal = self.read(task, 'goal.json'); goal['records'].pop('architecture'); self.write(task, 'goal.json', goal)
        result = api.check(task); self.assertEqual(result['next_action'], 'ARCHITECTURE')
        self.assertEqual(result['resources'], ['../sdlc-design/agents/architecture.md'])

    def test_operation_does_not_route_through_software(self):
        result = api.check(self.fixture()); self.assertEqual(result['next_action'], 'REVIEW_OPERATION')
        self.assertNotIn('ROUTE_SOFTWARE', json.dumps(result))
        self.assertEqual(result['state'], 'EXAMPLE_ONLY')

    def test_operation_candidate_is_not_business_completion(self):
        task = self.fixture(); self.execution(task, 'verified'); result = api.check(task)
        self.assertEqual(result['next_action'], 'VERIFY_OUTCOME_EXTERNALLY')
        self.assertEqual(result['runtime'], 'NOT_VERIFIED'); self.assertFalse(result['execution_granted'])

    def test_unknown_result_requires_readback_never_replay(self):
        task = self.fixture(); self.execution(task)
        goal = self.read(task, 'goal.json'); goal['budget']['attempts_without_progress'] = 2; self.write(task, 'goal.json', goal)
        self.assertEqual(api.check(task)['next_action'], 'READBACK_OPERATION')
        self.assertEqual(self.read(task, 'execution.json')['operation_id'], 'synthetic-operation-001')

    def test_human_receives_prepared_options(self):
        task = self.fixture(); self.mutate(task, 'assessment', lambda d: d['decisions'].append(self.decision(task)))
        # Changed product meaning retires the former plan; do not re-sign it.
        goal = self.read(task, 'goal.json'); goal['records'].pop('operation'); self.write(task, 'goal.json', goal)
        result = api.check(task); self.assertEqual(result['next_action'], 'HUMAN_DECISION')
        self.assertEqual(result['pending_decisions'], ['D1'])

    def test_unprepared_human_request_rejected(self):
        for field in ('options', 'action_needed', 'owner', 'impact', 'facts'):
            with self.subTest(field=field):
                task = self.fixture(); item = self.decision(task); item[field] = [] if field in ('options', 'facts') else ''
                self.mutate(task, 'assessment', lambda d: d['decisions'].append(item))
                with self.assertRaises(ValueError): api.check(task)

    def test_reply_must_choose_current_option_and_preserve_real_record(self):
        task = self.fixture(); item = self.decision(task)
        item['response'] = {'option_id': 'invented', 'record_ref': self.reply(task)}
        self.mutate(task, 'assessment', lambda d: d['decisions'].append(item))
        with self.assertRaisesRegex(ValueError, 'unknown option'): api.check(task)

    def test_missing_channel_is_not_success(self):
        task = self.fixture('explore'); goal = self.read(task, 'goal.json')
        goal['searches'] = [{'channel': 'github', 'query': 'SaaS patterns', 'status': 'unavailable', 'source_ids': [], 'reason': 'No access in this fixture.'}]
        goal['budget']['attempts_without_progress'] = 2; self.write(task, 'goal.json', goal)
        result = api.check(task); self.assertEqual(result['next_action'], 'PREPARE_RESOURCE_DECISION')
        self.assertIn('github', result['missing_channels'])

    def test_channel_cannot_be_filled_with_other_channel_source(self):
        task = self.fixture('saas'); goal = self.read(task, 'goal.json'); goal['searches'][1]['source_ids'] = ['local']; self.write(task, 'goal.json', goal)
        with self.assertRaisesRegex(ValueError, 'channel/source'): api.check(task)

    def test_feedback_invalidates_previously_bound_work(self):
        task = self.fixture(); goal = self.read(task, 'goal.json'); goal['feedback_refs'].append(self.reply(task)); self.write(task, 'goal.json', goal)
        with self.assertRaisesRegex(ValueError, 'feedback drift'): api.check(task)

    def test_live_main_drift_rejected(self):
        with self.assertRaisesRegex(ValueError, 'baseline drift'): api.check(self.fixture(), 'b' * 40)

    def test_proposal_change_invalidates_architecture(self):
        task = self.fixture('saas'); self.mutate(task, 'assessment', lambda d: d.update(impact='Different impact.'))
        with self.assertRaisesRegex(ValueError, 'stale product proposal'): api.check(task)

    def test_derived_work_needs_named_acceptance_obligation(self):
        task = self.fixture(); self.mutate(task, 'assessment', lambda d: d['requirements'][0].update(classification='derived', criterion_ids=[]))
        with self.assertRaises(ValueError): api.check(task)

    def test_inventory_cannot_silently_drop_target(self):
        task = self.fixture(); self.mutate(task, 'operation', lambda d: d.update(targets=['dealer-a']))
        with self.assertRaisesRegex(ValueError, 'denominator'): api.check(task)

    def test_exclusion_requires_decision_evidence(self):
        task = self.fixture(); self.mutate(task, 'operation', lambda d: d.update(targets=['dealer-a'], exclusions=[{'id':'dealer-b','reason':'Not included','decision_ref':{'path':'missing.json','sha256':'0'*64}}]))
        with self.assertRaises(ValueError): api.check(task)

    def test_duplicate_inventory_rejected(self):
        task = self.fixture(); ref = self.write(task, 'inventory.json', {'ids':['dealer-a','dealer-a','dealer-b']})
        self.mutate(task, 'operation', lambda d: d.update(inventory_ref=ref))
        with self.assertRaisesRegex(ValueError, 'unique'): api.check(task)

    def test_readback_must_cover_every_target(self):
        task = self.fixture(); self.execution(task, 'verified'); self.mutate(task, 'execution', lambda d: d['results'].pop())
        with self.assertRaisesRegex(ValueError, 'incomplete operation'): api.check(task)

    def test_other_plan_or_operation_cannot_supply_readback(self):
        for field in ('operation_id', 'environment', 'plan_sha256'):
            task = self.fixture(); self.execution(task); self.mutate(task, 'execution', lambda d: d.update({field:'other'}))
            with self.assertRaisesRegex(ValueError, 'drift'): api.check(task)

    def test_duplicate_key_and_unsafe_path_fail_closed(self):
        task = self.fixture(); (task/'goal.json').write_text('{"protocol":"a","protocol":"b"}')
        with self.assertRaisesRegex(ValueError, 'duplicate'): api.check(task)
        task = self.fixture(); goal = self.read(task, 'goal.json'); goal['raw_ref']['path'] = '../outside'; self.write(task,'goal.json',goal)
        with self.assertRaisesRegex(ValueError, 'escapes'): api.check(task)

    def test_symlinked_parent_is_rejected(self):
        task = self.fixture(); original = task/'sources'; original.rename(task/'real-sources'); original.symlink_to(task/'real-sources', target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlink'): api.check(task)

    def test_reference_commands_are_never_executed(self):
        task = self.fixture(); marker = task/'MUTATED'
        self.mutate(task,'operation',lambda d:d.update(verification='touch '+str(marker), recovery='rm -rf /'))
        self.assertEqual(api.check(task)['next_action'],'REVIEW_OPERATION'); self.assertFalse(marker.exists())

    def test_architecture_decision_returns_its_actual_id_and_goal_resources(self):
        task = self.fixture('saas'); item = self.decision(task); item['source_ids'] = ['local']
        self.mutate(task, 'architecture', lambda d: d['decisions'].append(item))
        result = api.check(task)
        self.assertEqual(result['next_action'], 'HUMAN_DECISION'); self.assertEqual(result['pending_decisions'], ['D1'])
        self.assertEqual(result['role'], 'goal'); self.assertEqual(result['resources'], ['references/goal-coordination.md'])

    def test_software_cannot_claim_operation_receipt(self):
        task = self.fixture('saas'); goal = self.read(task, 'goal.json')
        goal['records']['execution'] = self.write(task, 'execution.json', {'basis_sha256': api.basis(goal)})
        self.write(task, 'goal.json', goal)
        with self.assertRaisesRegex(ValueError, 'software evidence'): api.check(task)

    def test_target_coverage_does_not_replace_criterion_proof(self):
        task = self.fixture(); self.execution(task, 'verified'); self.mutate(task, 'execution', lambda d: d.update(proofs=[]))
        with self.assertRaisesRegex(ValueError, 'incomplete criterion'): api.check(task)

    def test_review_only_goal_cannot_activate_operation(self):
        task = self.fixture(); goal = self.read(task,'goal.json'); goal['requested_boundary'] = 'reviewed_design'
        self.write(task,'goal.json',goal)
        for kind in ('assessment','operation'):
            self.mutate(task,kind,lambda d:d.update(basis_sha256=api.basis(goal)))
        goal = self.read(task,'goal.json'); self.mutate(task,'operation',lambda d:d.update(assessment_sha256=goal['records']['assessment']['sha256']))
        self.execution(task)
        with self.assertRaisesRegex(ValueError, 'completion boundary'): api.check(task)

    def test_not_applicable_cannot_satisfy_required_discovery_channel(self):
        task = self.fixture('explore'); goal = self.read(task, 'goal.json')
        goal['searches'] = [{'channel':'github','query':'SaaS systems','status':'not_applicable','source_ids':[],'reason':'Skip this source.'}]
        self.write(task,'goal.json',goal)
        self.assertIn('github',api.check(task)['missing_channels'])

    def test_empty_authoritative_inventory_is_a_reviewable_noop(self):
        task = self.fixture(); ref = self.write(task,'inventory.json',{'ids':[]})
        self.mutate(task,'operation',lambda d:d.update(inventory_ref=ref,targets=[]))
        self.assertEqual(api.check(task)['next_action'],'REVIEW_OPERATION')
        self.execution(task,'verified')
        self.assertEqual(api.check(task)['next_action'],'VERIFY_OUTCOME_EXTERNALLY')

    def test_operation_environment_cannot_override_acceptance(self):
        task = self.fixture(); self.mutate(task,'operation',lambda d:d.update(environment='production'))
        with self.assertRaisesRegex(ValueError,'acceptance environment'): api.check(task)

    def test_failed_attempt_with_unknown_or_missing_targets_reads_back(self):
        for mutate in (lambda d:d['results'][0].update(status='unknown'), lambda d:d['results'].pop()):
            task=self.fixture(); self.execution(task,'failed'); self.mutate(task,'execution',mutate)
            self.assertEqual(api.check(task)['next_action'],'READBACK_OPERATION')

    def test_nonobject_hashed_stage_is_rejected_without_traceback(self):
        task=self.fixture(); goal=self.read(task,'goal.json'); goal['records']['assessment']=self.write(task,'assessment.json',[])
        self.write(task,'goal.json',goal)
        r=subprocess.run([sys.executable,str(PACKAGE/'scripts/check_goal.py'),'--task',str(task)],capture_output=True,text=True)
        self.assertEqual(r.returncode,2); self.assertEqual(json.loads(r.stdout)['contract'],'FAIL'); self.assertNotIn('Traceback',r.stderr)

    def test_drift_preserves_only_readonly_inflight_identity_hint(self):
        task=self.fixture(); self.execution(task); goal=self.read(task,'goal.json')
        goal['feedback_refs'].append(self.reply(task)); self.write(task,'goal.json',goal)
        for extra in ([],['--live-baseline','b'*40]):
            r=subprocess.run([sys.executable,str(PACKAGE/'scripts/check_goal.py'),'--task',str(task),*extra],capture_output=True,text=True)
            self.assertEqual(r.returncode,2); data=json.loads(r.stdout)
            self.assertFalse(data['execution_granted']); self.assertEqual(data['recovery_hint']['next_action'],'READBACK_OPERATION')
            self.assertEqual(data['recovery_hint']['operation_id'],'synthetic-operation-001')

    def test_drift_hint_rejects_unbound_operation_identity(self):
        task=self.fixture(); self.execution(task); self.mutate(task,'execution',lambda d:d.update(operation_id='other'))
        self.assertIsNone(api.recovery_hint(task))

    def test_portable_checker(self):
        task = self.fixture('explore'); script = task.parent/'check_goal.py'; shutil.copyfile(PACKAGE/'scripts/check_goal.py',script)
        result = subprocess.run([sys.executable,str(script),'--task',str(task)],cwd=task.parent,capture_output=True,text=True,timeout=10)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertEqual(json.loads(result.stdout)['next_action'],'DISCOVER')


if __name__ == '__main__':
    unittest.main()
