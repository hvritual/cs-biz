"""Synthetic module fixtures; no product approval, remote CI or runtime claim."""
from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
import copy
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import check_module_workflow as c


class ModuleWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.task = self.root / 'doc/tasks/synthetic'
        self.task.mkdir(parents=True)
        self.path = self.task / 'module-contract.json'
        self.source = 'doc/tasks/synthetic/design.md'
        (self.root / self.source).write_text('Synthetic design: A → B → integrated journey\n# Tests\n')
        (self.root / 'AGENTS.md').write_text('synthetic fixture only')
        self.git('init', '-q')
        self.commit('fixture source')
        self.base = self.git('rev-parse', 'HEAD').strip()
        self.body = c.digest(b'synthetic issue body')
        self.now = datetime(2026, 10, 16, tzinfo=timezone.utc)
        criteria = []
        for name in ('AC1', 'AC2', 'AC3'):
            criteria.append({'id': name, 'source_ref': self.source + '#journey',
                             'given': 'tenant operator in tenant A', 'when': 'perform approved action',
                             'then': 'one persisted result readable by the same operator',
                             'negative': 'tenant B cannot read the result',
                             'recovery': 'refresh returns same result without duplicate write',
                             'invariants': ['tenant A data stays isolated'],
                             'verification': {'kind': 'integration' if name == 'AC3' else 'runtime',
                                              'environment': 'synthetic-test',
                                              'procedure_ref': self.source + '#Tests',
                                              'expected': 'one result, zero duplicates'}})
        self.data = {
            'protocol': 'module-outcome-v1', 'module_ref': 'fixture://module', 'revision': 'r001',
            'boundary': 'integrated_main', 'boundary_environment': 'synthetic-test', 'inventory_ref': 'fixture://full-inventory',
            'inventory_numbers': [101, 102, 103, 104],
            'exclusions': [{'number': 104, 'reason': 'different approved module', 'decision_ref': 'fixture://scope'}],
            'sources': [{'path': self.source, 'commit': self.base,
                         'sha256': c.digest((self.root / self.source).read_bytes())}],
            'requirements': [{'id': 'R1', 'source_ref': self.source + '#journey',
                              'acceptance_ids': ['AC1', 'AC2', 'AC3']}],
            'criteria': criteria, 'integration_acceptance_ids': ['AC3'],
            'issues': [self.issue(101, 'AC1'), self.issue(102, 'AC2', [101]), self.issue(103, 'AC3', [102])],
            'resources': [], 'unresolved_decisions': [],
            'authority': {'record_ref': 'fixture://authority', 'issue_numbers': [101, 102, 103],
                          'actions': ['implement', 'repository_write', 'merge']},
            'budget': {'policy_ref': 'fixture://existing-budget', 'max_attempts_without_progress': 2},
            'review': {'decision': 'approved', 'record_ref': 'fixture://not-authenticated-review'}
        }
        self.save()
        self.commit('fixture frozen contract')
        self.lock = self.git('rev-parse', 'HEAD').strip()
        self.observation = {
            'protocol': 'module-observation-v1', 'contract_sha256': c.content_digest(self.data),
            'main_sha': self.lock, 'observed_at': self.now.isoformat(),
            'inventory_ref': 'fixture://live-inventory', 'inventory_numbers': [101, 102, 103, 104],
            'issues': [{'number': n, 'body_sha256': self.body, 'state': 'open', 'delivery': 'pending',
                        'attempts_without_progress': 0, 'blocker': None} for n in (101, 102, 103)],
            'resources': [], 'proofs': []}

    def issue(self, number, ac, deps=None):
        return {'number': number, 'task_ref': f'fixture://issue/{number}', 'body_sha256': self.body,
                'acceptance_ids': [ac], 'depends_on': deps or [], 'prerequisites': [],
                'allowed_paths': ['backend/internal/module/**'], 'forbidden_paths': ['frontend/**']}

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], text=True)

    def commit(self, message):
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message)

    def save(self, seal=True):
        if seal:
            self.data['review']['content_sha256'] = c.content_digest(self.data)
        self.path.write_text(json.dumps(self.data))

    def validate(self):
        self.save()
        return c.contract(self.path, self.root)

    def plan(self):
        self.validate()
        self.observation['contract_sha256'] = c.content_digest(self.data)
        return c.plan(self.data, self.observation, self.root, self.lock, self.now)

    def integrate(self, index):
        self.observation['issues'][index].update(delivery='integrated', merge_sha=self.lock,
            pr_ref='fixture://pr', quality_ref='fixture://quality', independent_review_ref='fixture://review',
            main_readback_ref='fixture://main')
        path = self.task / f'proof-{index}.log'
        path.write_text('synthetic raw artifact; NOT real runtime evidence')
        criterion = self.data['criteria'][index]
        self.observation['proofs'].append({'acceptance_id': criterion['id'], 'result': 'PROVEN',
            'commit': self.lock, 'kind': criterion['verification']['kind'], 'environment': 'synthetic-test',
            'method_ref': 'fixture://method', 'independent_review_ref': 'fixture://review',
            'artifact': {'path': path.relative_to(self.root).as_posix(), 'sha256': c.digest(path.read_bytes())}})

    def test_valid_contract_and_dependency_order(self):
        self.assertEqual(c.contract(self.path, self.root)['revision'], 'r001')
        self.assertEqual(self.plan()['next_action']['issue'], 101)
        self.integrate(0)
        self.assertEqual(self.plan()['next_action']['issue'], 102)
        self.integrate(1)
        self.assertEqual(self.plan()['next_action']['issue'], 103)
        self.integrate(2)
        result = self.plan()
        self.assertEqual(result['state'], 'CLOSURE_CANDIDATE_STATIC')
        self.assertEqual(result['coverage'], {'total': 3, 'declared_proven': 3})

    def test_contract_negative_controls(self):
        changes = [
            ('inventory', lambda d: d['inventory_numbers'].append(105), 'inventory'),
            ('duplicate', lambda d: d['issues'].append(copy.deepcopy(d['issues'][0])), 'duplicate'),
            ('cycle', lambda d: d['issues'][0]['depends_on'].append(103), 'cyclic'),
            ('self-dep', lambda d: d['issues'][0]['depends_on'].append(101), 'dependency'),
            ('external-dep', lambda d: d['issues'][0]['depends_on'].append(999), 'dependency'),
            ('orphan-ac', lambda d: d['requirements'][0].update(acceptance_ids=['AC1']), 'coverage'),
            ('missing-issue-ac', lambda d: d['issues'][2].update(acceptance_ids=['AC2']), 'orphan'),
            ('unresolved', lambda d: d.update(unresolved_decisions=['pricing']), 'resolve'),
            ('vague', lambda d: d['criteria'][0].update(then='TBD'), 'unresolved'),
            ('no-negative', lambda d: d['criteria'][0].update(negative=''), 'negative'),
            ('no-recovery', lambda d: d['criteria'][0].update(recovery=''), 'recovery'),
            ('bad-source', lambda d: d['criteria'][0].update(source_ref='missing.md#x'), 'source'),
            ('unit-as-integration', lambda d: d['criteria'][2]['verification'].update(kind='static'), 'integration'),
            ('no-integration', lambda d: d.update(integration_acceptance_ids=[]), 'reference'),
            ('scope-escape', lambda d: d['issues'][0].update(allowed_paths=['../outside']), 'path'),
            ('unbound-resource', lambda d: d['issues'][0].update(prerequisites=['DB']), 'prerequisite'),
            ('expanded-authority', lambda d: d['authority']['issue_numbers'].append(999), 'authority'),
            ('budget', lambda d: d['budget'].update(max_attempts_without_progress=3), 'budget'),
        ]
        original = copy.deepcopy(self.data)
        for name, change, pattern in changes:
            with self.subTest(name=name):
                self.data = copy.deepcopy(original)
                change(self.data)
                with self.assertRaisesRegex(ValueError, pattern):
                    self.validate()

    def test_stale_source_or_review_cannot_freeze(self):
        self.data['review']['content_sha256'] = '0' * 64
        self.save(seal=False)
        with self.assertRaisesRegex(ValueError, 'review'):
            c.contract(self.path, self.root)
        self.save()
        (self.root / self.source).write_text('changed accepted meaning')
        with self.assertRaisesRegex(ValueError, 'source changed'):
            c.contract(self.path, self.root)

    def test_substantive_unknown_outcome_is_valid_acceptance(self):
        self.data['criteria'][0]['negative'] = 'If the upstream result is unknown, retain the operation ID and do not submit a duplicate write.'
        self.data['criteria'][0]['recovery'] = 'Read the authoritative operation by ID after an unknown outcome; submit only after a confirmed absence.'
        self.validate()
        for placeholder in ('unknown', 'TBD', '待定'):
            self.data['criteria'][0]['then'] = placeholder
            with self.assertRaisesRegex(ValueError, 'unresolved field: then'):
                self.validate()
    def test_noncommit_source_rejected(self):
        self.data['sources'][0]['commit'] = self.git('rev-parse', 'HEAD^{tree}').strip()
        with self.assertRaisesRegex(ValueError, 'commit'):
            self.validate()

    def test_closed_without_delivery_does_not_unblock_dependant(self):
        self.observation['issues'][0]['state'] = 'closed'
        result = self.plan()
        self.assertEqual(result['state'], 'BLOCKED')
        self.assertEqual(result['coverage']['total'], 3)
        self.assertIn(101, result['blockers'])

    def test_independent_branch_can_continue_and_resume(self):
        self.data['issues'][2]['depends_on'] = []
        self.observation['issues'][0]['blocker'] = {'owner': 'API owner', 'next_action': 'provide test account', 'evidence_ref': 'fixture://block'}
        self.observation['issues'][2]['delivery'] = 'active'
        result = self.plan()
        self.assertEqual(result['next_action'], {'kind': 'RESUME_ISSUE', 'issue': 103})
        self.assertEqual(result['coverage']['total'], 3)

    def test_stall_and_authority_are_not_skipped(self):
        self.observation['issues'][0]['attempts_without_progress'] = 2
        self.assertEqual(self.plan()['state'], 'BLOCKED')
        self.observation['issues'][0]['attempts_without_progress'] = 0
        self.data['authority']['issue_numbers'] = [102, 103]
        self.assertEqual(self.plan()['blockers'][101]['owner'], 'Human')

    def test_resource_block_and_recovery(self):
        self.data['resources'] = [{'id': 'DB', 'owner': 'DB owner', 'recovery_action': 'prepare test DB', 'source_ref': self.source + '#resources'}]
        self.data['issues'][0]['prerequisites'] = ['DB']
        self.observation['resources'] = [{'id': 'DB', 'state': 'blocked', 'evidence_ref': 'fixture://db'}]
        self.assertEqual(self.plan()['state'], 'BLOCKED')
        self.observation['resources'][0]['state'] = 'available'
        self.assertEqual(self.plan()['next_action']['issue'], 101)

    def test_integrated_resource_block_prevents_closure(self):
        self.test_resource_block_and_recovery()
        for n in range(3):
            self.integrate(n)
        self.observation['resources'][0]['state'] = 'blocked'
        result = self.plan()
        self.assertEqual(result['state'], 'BLOCKED')
        self.assertEqual(result['blockers'][101]['owner'], ['DB owner'])

    def test_named_boundary_requires_its_direct_method_and_environment(self):
        for boundary in ('physical', 'operational', 'deployed'):
            with self.subTest(boundary=boundary):
                self.data['boundary'] = boundary
                with self.assertRaisesRegex(ValueError, 'boundary lacks'):
                    self.validate()
                self.data['criteria'][2]['verification']['kind'] = c.BOUNDARY_KIND[boundary]
                self.validate()
                self.data['criteria'][2]['verification']['kind'] = 'integration'
        self.data['boundary'] = 'integrated_main'
        self.data['boundary_environment'] = 'different-environment'
        with self.assertRaisesRegex(ValueError, 'boundary lacks'):
            self.validate()

    def test_active_blocked_candidate_is_suspended_before_independent_admission(self):
        self.data['issues'][2]['depends_on'] = []
        row = self.observation['issues'][0]
        row.update(delivery='active', blocker={'owner': 'API owner', 'next_action': 'restore', 'evidence_ref': 'fixture://blocked'})
        self.assertEqual(self.plan()['next_action'], {'kind': 'SUSPEND_ISSUE', 'issue': 101, 'then_reconcile': True})
        row.update(delivery='suspended', candidate_ref='fixture://existing-pr')
        self.assertEqual(self.plan()['next_action'], {'kind': 'ADMIT_ISSUE', 'issue': 103})
        self.integrate(2)
        row.update(blocker=None)
        self.assertEqual(self.plan()['next_action'], {'kind': 'RESUME_ISSUE', 'issue': 101})

    def test_closed_active_rows_still_count_and_require_suspension(self):
        self.data['issues'][2]['depends_on'] = []
        self.observation['issues'][0].update(state='closed', delivery='active')
        self.observation['issues'][2]['delivery'] = 'active'
        with self.assertRaisesRegex(ValueError, 'one active'):
            self.plan()
        self.observation['issues'][2]['delivery'] = 'pending'
        self.assertEqual(self.plan()['next_action']['kind'], 'SUSPEND_ISSUE')

    def test_resource_block_propagates_through_integrated_dependency(self):
        self.test_resource_block_and_recovery()
        self.integrate(0)
        self.integrate(1)
        self.observation['resources'][0]['state'] = 'blocked'
        result = self.plan()
        self.assertEqual(result['state'], 'BLOCKED')
        self.assertEqual(set(result['blockers']), {101, 102, 103})

    def test_suspended_candidate_resumes_before_lower_numbered_new_issue(self):
        self.data['issues'][2]['depends_on'] = []
        self.observation['issues'][2].update(delivery='suspended', candidate_ref='fixture://existing-pr-103')
        self.assertEqual(self.plan()['next_action'], {'kind': 'RESUME_ISSUE', 'issue': 103})

    def test_live_main_source_drift_detected_from_old_checkout(self):
        self.git('checkout', '-qb', 'new-main')
        (self.root / self.source).write_text('changed acceptance on live main')
        self.commit('design changed on live main')
        newer = self.git('rev-parse', 'HEAD').strip()
        self.git('checkout', '--detach', self.lock)
        self.observation['main_sha'] = newer
        self.validate()
        self.observation['contract_sha256'] = c.content_digest(self.data)
        with self.assertRaisesRegex(ValueError, 'source drift on live main'):
            c.plan(self.data, self.observation, self.root, newer, self.now)

    def test_drift_negative_controls(self):
        changes = [
            ('main', lambda o: o.update(main_sha='0' * 40), 'main changed'),
            ('inventory', lambda o: o['inventory_numbers'].append(999), 'inventory drift'),
            ('body', lambda o: o['issues'][0].update(body_sha256='0' * 64), 'body drift'),
            ('time', lambda o: o.update(observed_at=(self.now - timedelta(minutes=16)).isoformat()), 'stale'),
            ('future', lambda o: o.update(observed_at=(self.now + timedelta(minutes=1)).isoformat()), 'future'),
            ('missing-row', lambda o: o['issues'].pop(), 'missing/extra'),
            ('multi-active', lambda o: [r.update(delivery='active') for r in o['issues']], 'one active'),
        ]
        original = copy.deepcopy(self.observation)
        for name, change, pattern in changes:
            with self.subTest(name=name):
                self.observation = copy.deepcopy(original)
                change(self.observation)
                with self.assertRaisesRegex(ValueError, pattern):
                    self.plan()

    def test_missing_module_proof_requests_verification(self):
        for n in range(3):
            self.integrate(n)
        self.observation['proofs'].pop()
        result = self.plan()
        self.assertEqual(result['state'], 'EVIDENCE_REQUIRED')
        self.assertEqual(result['remaining_acceptance_ids'], ['AC3'])

    def test_wrong_or_stale_proof_rejected(self):
        self.integrate(0)
        original = copy.deepcopy(self.observation['proofs'][0])
        for key, value in [('commit', self.base), ('kind', 'static'), ('environment', 'production')]:
            with self.subTest(key=key):
                self.observation['proofs'][0] = {**original, key: value}
                with self.assertRaisesRegex(ValueError, 'wrong-boundary'):
                    self.plan()
        self.observation['proofs'][0] = original
        self.observation['proofs'][0]['artifact']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'stale artifact'):
            self.plan()

    def test_unmerged_delivery_rejected(self):
        self.git('checkout', '-qb', 'side')
        (self.root / 'side.txt').write_text('not integrated')
        self.commit('side commit')
        side = self.git('rev-parse', 'HEAD').strip()
        self.integrate(0)
        self.observation['issues'][0]['merge_sha'] = side
        with self.assertRaisesRegex(ValueError, 'not integrated'):
            self.plan()

    def test_json_duplicates_and_symlinks_rejected(self):
        self.path.write_text('{"protocol":"one","protocol":"two"}')
        with self.assertRaisesRegex(ValueError, 'duplicate JSON'):
            c.contract(self.path, self.root)
        self.path.unlink()
        self.path.symlink_to(self.root / self.source)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            c.contract(self.path, self.root)

    def test_cli_static_never_grants_authority_or_runtime(self):
        out = io.StringIO()
        with redirect_stdout(out):
            result = c.main(['--repo-root', str(self.root), '--contract', str(self.path)])
        data = json.loads(out.getvalue())
        self.assertEqual(result, 0)
        self.assertEqual(data['contract'], 'PASS_STATIC_ONLY')
        self.assertFalse(data['execution_granted'])
        self.assertEqual(data['runtime'], 'NOT_VERIFIED')
        self.assertEqual(data['authentic_approval'], 'NOT_VERIFIED')

    def test_cli_contract_relative_to_explicit_repo_root(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(c.main(['--repo-root', str(self.root), '--contract', 'doc/tasks/synthetic/module-contract.json']), 0)
        self.observation['observed_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        obs = self.task / 'observation.json'
        obs.write_text(json.dumps(self.observation))
        with redirect_stdout(io.StringIO()) as out:
            self.assertEqual(c.main(['--repo-root', str(self.root), '--contract', 'doc/tasks/synthetic/module-contract.json',
                                     '--observations', str(obs), '--locked-commit', self.lock, '--main-sha', self.lock]), 0)
        result = json.loads(out.getvalue())
        self.assertEqual(result['next_action'], {'kind': 'ADMIT_ISSUE', 'issue': 101})
        self.assertFalse(result['execution_granted'])

    def test_cli_requires_locked_commit_and_rejects_changed_lock(self):
        obs = self.task / 'observation.json'
        obs.write_text(json.dumps(self.observation))
        args = ['--repo-root', str(self.root), '--contract', str(self.path), '--observations', str(obs)]
        with redirect_stdout(io.StringIO()):
            self.assertEqual(c.main(args), 2)
        self.data['criteria'][0]['then'] = 'silently reduced result'
        self.save()
        with redirect_stdout(io.StringIO()) as out:
            self.assertEqual(c.main(args + ['--locked-commit', self.lock, '--main-sha', self.lock]), 2)
        self.assertIn('changed since approved', out.getvalue())


if __name__ == '__main__':
    unittest.main()
