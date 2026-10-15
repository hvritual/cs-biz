"""Synthetic fixtures test contract rejection; never actual browser/Human evidence."""
import copy
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import check_design_workflow as checker


class DesignWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.task = self.root / 'doc/tasks/fixture'
        self.task.mkdir(parents=True)
        self.source = 'frontend/apps/console/src/views/preview/index.vue'
        for name, value in {self.source: '<template>fixture</template>',
                            'doc/architecture/adr/0001.md': 'accepted: fixture only',
                            'frontend/apps/console/src/shared.ts': 'export const fixture = 1'}.items():
            p = self.root / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(value)
        self.git('init', '-q')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                 'commit', '-qm', 'synthetic preview fixture')
        self.commit = self.git('rev-parse', 'HEAD').strip()
        for name in (*checker.ARTIFACTS, 'ux-analysis.yaml', 'raw.txt', 'prompt.md',
                     'intent.json', 'scenarios.md', 'isolation.md', 'browser.log'):
            (self.task / name).write_text('flowchart TD\nfixture: raw request')
        (self.task / 'intent.json').write_text(json.dumps({'objective': 'fixture: raw request'}))
        assets = {self.source: checker.digest((self.root / self.source).read_bytes())}
        runtime = {'candidate_sha': self.commit, 'source_assets': assets,
                   'route': '/design/fixture', 'result': 'pass', 'scenarios': ['fixture'],
                   'scenarios_ref': self.ref('scenarios.md'),
                   'production_isolation_ref': self.ref('isolation.md'),
                   'log': self.ref('browser.log')}
        (self.task / 'browser.json').write_text(json.dumps(runtime))
        self.data = {
            'protocol': 'intent-design-v2', 'task_ref': 'synthetic-only', 'revision': 'r001',
            'raw': {**self.ref('raw.txt'), 'source_ref': 'fixture://raw'},
            'optimized_prompt': self.ref('prompt.md'), 'intent': self.ref('intent.json'),
            'trace': [{'requirement_id': 'R1', 'raw_quote': 'raw request', 'intent_ref': '/objective',
                       'acceptance_ids': ['AC1'], 'design_refs': ['design.md#fixture']}],
            'knowledge': [{'path': 'doc/architecture/adr/0001.md', 'commit': self.commit,
                           'sha256': checker.digest((self.root / 'doc/architecture/adr/0001.md').read_bytes()),
                           'locator': 'line 1', 'relevance': 'fixture', 'status': 'accepted', 'use': 'constraint'}],
            'conditions': [{'id': 'C1', 'status': 'available', 'blocking': True, 'source_ref': 'fixture'}],
            'preferences': [{'id': 'P1', 'status': 'available', 'blocking': False, 'source_ref': 'fixture'}],
            'decisions': [{'id': 'D1', 'trigger': 'fixture', 'question': 'A or B?',
                           'options': ['A: one', 'B: two'], 'recommendation': 'A: one, fixture reason',
                           'answer': 'A: one', 'answer_ref': 'fixture://human'}],
            'frontend_change': True,
            'artifacts': {n: checker.digest((self.task / n).read_bytes())
                          for n in (*checker.ARTIFACTS, 'ux-analysis.yaml')},
            'preview': {'kind': 'in_project', 'root': 'frontend/apps/console',
                        'candidate_sha': self.commit, 'route': '/design/fixture',
                        'command': 'fixture, never executed by checker', 'source_assets': assets,
                        'reuse_refs': [self.source], 'scenarios_ref': self.ref('scenarios.md'),
                        'production_isolation_ref': self.ref('isolation.md'),
                        'browser_evidence': self.ref('browser.json')},
            'handoff': {'owner': 'executing_model_outside_workflow', 'allowed_paths': [self.source],
                        'forbidden_paths': ['backend/'], 'acceptance_ids': ['AC1'],
                        'execution_authority_ref': 'none: design only', 'auto_execute': False},
            'review': {'decision': 'approved', 'scope': 'design', 'revision': 'r001',
                       'record_ref': 'fixture only, NOT an authentic approval'}
        }

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], text=True)

    def ref(self, name):
        return {'path': name, 'sha256': checker.digest((self.task / name).read_bytes())}

    def save(self, seal=True):
        if seal:
            self.data['review']['content_sha256'] = checker.content_digest(self.data)
        (self.task / 'design-loop.json').write_text(json.dumps(self.data))

    def rejects(self, pattern):
        self.save()
        with self.assertRaisesRegex(ValueError, pattern):
            checker.check(self.task, self.root)

    def test_complete_reference_contract_only(self):
        self.save()
        self.assertEqual(checker.check(self.task, self.root)['protocol'], 'intent-design-v2')

    def test_non_ui_requires_reason(self):
        self.data['frontend_change'] = False
        self.data['handoff']['allowed_paths'] = ['backend/package/']
        self.data['preview'] = {'kind': 'not_applicable', 'reason': 'protocol only'}
        self.save()
        checker.check(self.task, self.root)
        self.data['preview'].pop('reason')
        self.rejects('inapplicability')

    def test_cannot_disguise_frontend_as_non_ui(self):
        self.data['frontend_change'] = False
        self.rejects('contradict')

    def test_raw_change_invalidates_trace_binding(self):
        (self.task / 'raw.txt').write_text('different request')
        self.rejects('stale artifact')

    def test_fabricated_raw_quote(self):
        self.data['trace'][0]['raw_quote'] = 'not present'
        self.rejects('not raw source')

    def test_dropped_acceptance(self):
        self.data['handoff']['acceptance_ids'] = ['AC2']
        self.rejects('drops/adds')

    def test_proposed_or_obsolete_adr_is_not_constraint(self):
        for status in ('proposed', 'superseded', 'conflict', 'unknown'):
            with self.subTest(status=status):
                self.data['knowledge'][0]['status'] = status
                self.rejects('unaccepted ADR')

    def test_cannot_claim_old_doc_as_current_fact(self):
        row = self.data['knowledge'][0]
        row.update(status='current_source', use='current_fact')
        (self.root / row['path']).write_text('changed current source')
        self.rejects('historical source')

    def test_knowledge_digest_mismatch(self):
        self.data['knowledge'][0]['sha256'] = '0' * 64
        self.rejects('knowledge digest')

    def test_blocking_conditions_and_preferences(self):
        for field in ('conditions', 'preferences'):
            for state in ('missing', 'unknown'):
                with self.subTest(field=field, state=state):
                    row = self.data[field][0]
                    old = copy.deepcopy(row)
                    row.update(status=state, blocking=True)
                    self.rejects('unresolved')
                    self.data[field][0] = old

    def test_nonblocking_gap_needs_owner_and_next_step(self):
        self.data['conditions'][0].update(status='missing', blocking=False)
        self.rejects('needs owner')
        self.data['conditions'][0].update(owner='human', next_action='provide test data')
        self.save()
        checker.check(self.task, self.root)

    def test_unanswered_decision(self):
        self.data['decisions'][0]['answer'] = None
        self.rejects('unresolved')

    def test_duplicate_decision(self):
        self.data['decisions'].append(copy.deepcopy(self.data['decisions'][0]))
        self.rejects('duplicate decision')

    def test_solution_is_mandatory(self):
        self.data['artifacts'].pop('solution.md')
        self.rejects('mandatory design pack missing')

    def test_standalone_demo_rejected(self):
        self.data['preview']['kind'] = 'standalone_html'
        self.rejects('in-project')

    def test_preview_without_vue_rejected(self):
        self.data['preview']['source_assets'] = {'demo.html': '0' * 64}
        self.rejects('Vue preview')

    def test_current_preview_source_drift(self):
        (self.root / self.source).write_text('new UI')
        self.rejects('source changed')

    def test_not_committed_preview_source_rejected(self):
        (self.root / self.source).write_text('new UI')
        self.data['preview']['source_assets'][self.source] = checker.digest(b'new UI')
        self.rejects('source changed')

    def test_old_runtime_target_rejected(self):
        path = self.task / 'browser.json'
        runtime = json.loads(path.read_text())
        runtime['candidate_sha'] = '0' * 40
        path.write_text(json.dumps(runtime))
        self.data['preview']['browser_evidence'] = self.ref('browser.json')
        self.rejects('runtime evidence targets stale')

    def test_missing_browser_success_not_pass(self):
        path = self.task / 'browser.json'
        runtime = json.loads(path.read_text())
        runtime['result'] = 'not_run'
        path.write_text(json.dumps(runtime))
        self.data['preview']['browser_evidence'] = self.ref('browser.json')
        self.rejects('not verified')

    def test_scenario_and_isolation_content_sealed(self):
        for name in ('scenarios.md', 'isolation.md'):
            with self.subTest(name=name):
                path = self.task / name
                original = path.read_bytes()
                path.write_text('different')
                self.rejects('stale artifact')
                path.write_bytes(original)

    def test_partial_review_not_handoff(self):
        self.data['review']['decision'] = 'partial'
        self.rejects('complete design review')

    def test_new_revision_cannot_reuse_old_review(self):
        self.data['revision'] = 'r002'
        self.rejects('stale design pack')

    def test_payload_changes_invalidate_review(self):
        self.save()
        self.data['decisions'][0]['recommendation'] = 'a different preference'
        self.save(seal=False)
        with self.assertRaisesRegex(ValueError, 'stale design pack'):
            checker.check(self.task, self.root)

    def test_workflow_cannot_own_execution(self):
        self.data['handoff']['owner'] = 'sdlc-workflow'
        self.rejects('outside design workflow')

    def test_no_auto_execution(self):
        self.data['handoff']['auto_execute'] = True
        self.rejects('cannot dispatch')

    def test_path_and_symlink_escape(self):
        self.data['raw']['path'] = '../../outside'
        self.rejects('escapes')
        outside = self.task / 'inside.txt'
        outside.write_text('secret')
        (self.task / 'alias.txt').symlink_to(outside)
        self.data['raw'] = {'path': 'alias.txt', 'sha256': checker.digest(b'secret'), 'source_ref': 'fixture'}
        self.rejects('symlink')

    def test_noncanonical_handoff_paths_rejected(self):
        for path in ('./frontend/page.vue', 'frontend//page.vue', '/frontend/page.vue',
                     'frontend\\page.vue', '../frontend/page.vue', '**/page.vue'):
            with self.subTest(path=path):
                self.data['handoff']['allowed_paths'] = [path]
                self.data['frontend_change'] = False
                self.rejects('path|scope')

    def test_frontend_directory_requires_preview(self):
        self.data['handoff']['allowed_paths'] = ['frontend']
        self.data['frontend_change'] = False
        self.rejects('contradict')

    def test_git_tree_is_not_commit(self):
        tree = self.git('rev-parse', 'HEAD^{tree}').strip()
        self.data['knowledge'][0]['commit'] = tree
        self.rejects('must identify a commit')
        self.data['knowledge'][0]['commit'] = self.commit
        self.data['preview']['candidate_sha'] = tree
        self.rejects('must identify a commit')

    def test_missing_trace_targets(self):
        self.data['trace'][0]['intent_ref'] = '/not-present'
        self.rejects('intent_ref target missing')
        self.data['trace'][0]['intent_ref'] = '/objective'
        self.data['trace'][0]['design_refs'] = ['missing.md#heading']
        self.rejects('design_ref target missing')

    def test_dependency_change_invalidates_preview(self):
        (self.root / 'frontend/apps/console/src/shared.ts').write_text('export const fixture = 2')
        self.rejects('frontend snapshot changed')

    def test_untracked_frontend_source_invalidates_preview(self):
        (self.root / 'frontend/apps/console/src/new.ts').write_text('export const extra = 1')
        self.rejects('frontend snapshot changed')

    def test_new_scenarios_need_new_runtime_evidence(self):
        (self.task / 'scenarios.md').write_text('new journey obligations')
        self.data['preview']['scenarios_ref'] = self.ref('scenarios.md')
        self.rejects('runtime evidence targets stale')

    def test_historical_background_can_reference_deleted_source(self):
        row = self.data['knowledge'][0]
        row.update(status='superseded', use='background')
        (self.root / row['path']).unlink()
        self.save()
        checker.check(self.task, self.root)

    def test_extra_referenced_design_asset_is_sealed(self):
        (self.task / 'extra-design.md').write_text('reviewed state')
        self.data['artifacts']['extra-design.md'] = self.ref('extra-design.md')['sha256']
        self.data['trace'][0]['design_refs'] = ['extra-design.md#reviewed']
        self.save()
        checker.check(self.task, self.root)
        (self.task / 'extra-design.md').write_text('changed after review')
        with self.assertRaisesRegex(ValueError, 'design pack stale'):
            checker.check(self.task, self.root)

    def test_json_pointer_rejects_invalid_escape(self):
        path = self.task / 'intent.json'
        path.write_text(json.dumps({'a~2': 'invalid escape target'}))
        self.data['intent'] = self.ref('intent.json')
        self.data['trace'][0]['intent_ref'] = '/a~2'
        self.rejects('invalid JSON pointer escape')

    def test_json_pointer_array_index_must_be_canonical(self):
        (self.task / 'intent.json').write_text(json.dumps({'items': ['one', 'two']}))
        self.data['intent'] = self.ref('intent.json')
        self.data['trace'][0]['intent_ref'] = '/items/01'
        self.rejects('intent_ref target missing')

    def test_duplicate_json_keys_rejected(self):
        (self.task / 'design-loop.json').write_text('{"protocol":"one","protocol":"two"}')
        with self.assertRaisesRegex(ValueError, 'duplicate JSON'):
            checker.check(self.task, self.root)

    def test_cli_malformed_inputs_fail_closed(self):
        for value in ({}, [], {'protocol': 'intent-design-v2', 'raw': []}):
            (self.task / 'design-loop.json').write_text(json.dumps(value))
            with redirect_stdout(io.StringIO()):
                self.assertEqual(checker.main(['--task', str(self.task), '--repo-root', str(self.root)]), 2)


if __name__ == '__main__':
    unittest.main()
