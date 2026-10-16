"""Behavioral artifact-integrity tests; no fixture authenticates external approval."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

BUNDLE = Path(__file__).resolve().parents[1]
SKILLS = BUNDLE.parent
REPO = SKILLS.parent.parent


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class AgentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='agent-contract-test-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def fixture(self, stage='design', example='complete'):
        package = SKILLS / ('sdlc-' + stage)
        task = self.root / stage
        shutil.copytree(package / 'examples' / example, task)
        return package, task, read(package / 'workflow.json')

    def run_check(self, package, task, ok=True, pattern=None, include=False):
        args = [sys.executable, str(package / 'scripts/check_workflow.py'), '--task', str(task)]
        if include:
            args.append('--include-skill')
        result = subprocess.run(args, cwd=REPO, text=True, capture_output=True, timeout=30)
        self.assertFalse(result.stderr, result.stderr)
        data = json.loads(result.stdout)
        self.assertEqual(result.returncode, 0 if ok else 2, result.stdout)
        self.assertIs(data['execution_granted'], False)
        self.assertEqual(data['authentic_approval'], 'NOT_VERIFIED')
        self.assertEqual(data['runtime'], 'NOT_VERIFIED')
        if pattern:
            self.assertRegex(str(data), pattern)
        return data

    def mutate(self, task, name, fn):
        value = read(task / name)
        fn(value)
        write(task / name, value)

    def refresh(self, task, workflow):
        for step in workflow['steps']:
            path = task / step['output']
            if path.exists():
                data = read(path)
                data['input_sha256'] = {name: digest(task / name) for name in step['inputs']}
                write(path, data)

    def truncate(self, task, workflow, next_id):
        found = False
        for step in workflow['steps']:
            found |= step['id'] == next_id
            if found:
                (task / step['output']).unlink(missing_ok=True)

    def change_asset(self, task, workflow, role, change):
        final = read(task / workflow['handoff'])
        ref = final['assets'][role]
        self.mutate(task, ref['path'], change)
        new = {**ref, 'sha256': digest(task / ref['path'])}
        for step in workflow['steps']:
            p = task / step['output']
            if p.exists():
                data = read(p)
                for key, value in data['assets'].items():
                    if value == ref:
                        data['assets'][key] = new
                write(p, data)
        self.refresh(task, workflow)

    def real_design(self, package, task, workflow, ui=False):
        # A structurally valid v2 packet against an actual immutable repository blob.
        # All approvals/runtime here remain synthetic declarations, never authenticated.
        base = read(task / 'request.json')['contract']['baseline_sha']
        raw = subprocess.check_output(['git', 'show', base + ':AGENTS.md'], cwd=REPO)
        legacy = task / 'legacy'
        legacy.mkdir()
        for name in ('solution.md', 'requirements.md', 'design.md', 'journey.md', 'flow.mmd', 'prompt.md'):
            (legacy / name).write_text('Synthetic contract-validation content only.\n')
        (legacy / 'raw.txt').write_bytes((task / 'raw.txt').read_bytes())
        write(legacy / 'intent.json', {'objective': 'synthetic tenant-scoped operation'})
        def ref(name):
            return {'path': name, 'sha256': digest(legacy / name)}
        contract = read(task / 'request.json')['contract']
        value = {'protocol': 'intent-design-v2', 'task_ref': 'synthetic-test-task', 'revision': 'r001',
                 'raw': {**ref('raw.txt'), 'source_ref': 'fixture://raw'}, 'optimized_prompt': ref('prompt.md'),
                 'intent': ref('intent.json'),
                 'trace': [{'requirement_id': 'R1', 'raw_quote': 'tenant-scoped', 'intent_ref': '/objective',
                            'acceptance_ids': ['AC1'], 'design_refs': ['design.md#synthetic']}],
                 'knowledge': [{'path': 'AGENTS.md', 'commit': base, 'sha256': hashlib.sha256(raw).hexdigest(),
                                'locator': 'whole file', 'relevance': 'repository policy', 'status': 'documented', 'use': 'background'}],
                 'conditions': [{'id': 'C1', 'status': 'available', 'blocking': False, 'source_ref': 'fixture://condition'}],
                 'preferences': [{'id': 'P1', 'status': 'available', 'blocking': False, 'source_ref': 'fixture://preference'}],
                 'decisions': [], 'frontend_change': False,
                 'artifacts': {n: digest(legacy / n) for n in ('solution.md', 'requirements.md', 'design.md', 'journey.md', 'flow.mmd')},
                 'preview': {'kind': 'not_applicable', 'reason': 'backend-only protocol test'},
                 'handoff': {'owner': 'executing_model_outside_workflow', 'allowed_paths': contract['allowed_paths'],
                             'forbidden_paths': contract['forbidden_paths'], 'acceptance_ids': ['AC1'],
                             'execution_authority_ref': 'fixture://not-real-authority', 'auto_execute': False},
                 'review': {'decision': 'approved', 'scope': 'design', 'revision': 'r001', 'record_ref': 'fixture://not-real-review'}}
        if ui:
            root = Path(tempfile.mkdtemp(dir=self.root,prefix='ui-repo-'))
            (root/'AGENTS.md').write_text('Synthetic UI fixture repository policy.\n')
            source = 'frontend/apps/console/src/views/preview/index.vue'
            path=root/source;path.parent.mkdir(parents=True);path.write_text('<template>offline fixture</template>')
            def git(*args):
                return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
            git('init','-q');git('add','.')
            git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','synthetic UI snapshot')
            commit=git('rev-parse','HEAD')
            shutil.move(str(task),str(root/'task'))
            task=root/'task';legacy=task/'legacy'
            value['knowledge'][0].update(commit=commit,sha256=digest(root/'AGENTS.md'))
            value['frontend_change']=True
            (legacy/'ux-analysis.yaml').write_text('synthetic: UX analysis only\n')
            (legacy/'scenarios.md').write_text('Synthetic scenario\n')
            (legacy/'isolation.md').write_text('Synthetic production isolation\n')
            (legacy/'browser.log').write_text('Synthetic observation; NOT actual browser proof\n')
            preview={'kind':'in_project','root':'frontend/apps/console','candidate_sha':commit,
                     'route':'/design/synthetic','command':'fixture command never executed',
                     'source_assets':{source:digest(root/source)},'reuse_refs':[source],
                     'scenarios_ref':ref('scenarios.md'),'production_isolation_ref':ref('isolation.md'),
                     'browser_evidence':{'path':'browser.json'}}
            browser={'candidate_sha':commit,'source_assets':preview['source_assets'],'route':preview['route'],
                     'scenarios_ref':preview['scenarios_ref'],'production_isolation_ref':preview['production_isolation_ref'],
                     'result':'pass','scenarios':['synthetic-only'],'log':ref('browser.log')}
            write(legacy/'browser.json',browser);preview['browser_evidence']=ref('browser.json')
            value['preview']=preview;value['artifacts']['ux-analysis.yaml']=digest(legacy/'ux-analysis.yaml')
        value['review']['content_sha256'] = hashlib.sha256(json.dumps({k:v for k,v in value.items() if k != 'review'}, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
        write(legacy / 'design-loop.json', value)
        replacements = {role: {'path': 'legacy/' + name, 'sha256': digest(legacy / name)}
                        for role, name in [('raw','raw.txt'), ('intent','intent.json'), ('solution','solution.md'),
                                           ('requirements','requirements.md'), ('design','design.md'), ('design_packet','design-loop.json')]}
        if ui:
            replacements.update({role:{'path':'legacy/'+name,'sha256':digest(legacy/name)}
                                 for role,name in [('journey','journey.md'),('flow','flow.mmd'),
                                                   ('ux_analysis','ux-analysis.yaml'),('preview_evidence','browser.json')]})
        names = [workflow['intake_files'][0]] + [s['output'] for s in workflow['steps']]
        for name in names:
            data = read(task / name)
            data['contract']['mode'] = 'real'
            if ui:
                data['contract'].update(frontend_change=True,baseline_sha=commit)
                if data.get('step') in ('ux','preview'):
                    step=next(s for s in workflow['steps'] if s['id']==data['step'])
                    schema=read(package/step['payload_contract'])
                    data['status']='ready';data['payload']={k:'synthetic' for k in schema['required']}
                    data['assets']={role:replacements[role] for role in step['required_assets']}
                if data.get('step')=='handoff':
                    data['assets'].update({k:v for k,v in replacements.items() if k in ('journey','flow','ux_analysis','preview_evidence')})
            for role in list(data['assets']):
                if role in replacements:
                    data['assets'][role] = replacements[role]
            if data.get('stage') == 'design' and data.get('step') == 'handoff':
                data['payload'].update(design_task_ref=value['task_ref'], design_revision=value['revision'],
                                       design_review_ref=value['review']['record_ref'], execution_authority_ref=value['handoff']['execution_authority_ref'])
            step = next((s for s in workflow['steps'] if s['output'] == name), None)
            if step and data['status'] == 'ready':
                for field, role in step.get('payload_asset_refs', {}).items():
                    data['payload'][field] = data['assets'][role]['path']
            write(task / name, data)
        self.refresh(task, workflow)
        return task

    def test_complete_examples_stay_examples(self):
        for stage in ('design', 'build', 'deploy'):
            p,t,w = self.fixture(stage)
            self.assertEqual(self.run_check(p,t)['state'], 'EXAMPLE_ONLY')

    def test_all_blocked_examples_have_recovery(self):
        for stage in ('design', 'build', 'deploy'):
            p,t,w = self.fixture(stage, 'blocked')
            self.assertEqual(self.run_check(p,t)['state'], 'BLOCKED')

    def test_failure_and_unknown_are_never_deployed(self):
        for example, expected in [('failed','rolled_back'), ('unknown','unknown')]:
            p,t,w = self.fixture('deploy', example)
            self.assertEqual(self.run_check(p,t)['reported_outcome'], expected)
            shutil.rmtree(t)

    def test_context_loads_only_current_skill(self):
        p,t,w = self.fixture()
        self.truncate(t,w,'solution')
        result = self.run_check(p,t,include=True)
        ctx = result['context']
        self.assertEqual(ctx['step'], 'solution')
        self.assertIn('name: design-solution', ctx['instructions'])
        self.assertNotIn('name: design-acceptance', json.dumps(result))
        self.assertNotIn('name: build-', json.dumps(result))
        self.assertEqual({x['path'] for x in ctx['inputs']}, {'request.json','design/intent.json'})
        self.assertNotIn('instructions', self.run_check(p,t)['context'])

    def test_optional_false_has_no_skill_context(self):
        p,t,w = self.fixture();self.truncate(t,w,'ux')
        result = self.run_check(p,t,include=True)
        self.assertEqual(result['next_action'], 'RECORD_NOT_APPLICABLE')
        self.assertNotIn('instructions', result['context'])
        self.assertFalse(result['context']['resources'])

    def test_ui_cannot_skip_required_skill(self):
        p,t,w = self.fixture()
        for name in ['request.json'] + [s['output'] for s in w['steps']]:
            self.mutate(t,name,lambda d:d['contract'].update(frontend_change=True))
        self.refresh(t,w);self.run_check(p,t,False,'required capability')

    def test_optional_requires_reason(self):
        p,t,w = self.fixture();self.mutate(t,'design/ux.json',lambda d:d.update(payload={}))
        self.run_check(p,t,False,'explicit reason')

    def test_wrong_task_stage_step(self):
        for field in ('task_id','stage','step'):
            p,t,w = self.fixture();self.mutate(t,'design/solution.json',lambda d:d.update({field:'wrong'}))
            self.run_check(p,t,False,'identity|enum');shutil.rmtree(t)

    def test_stale_input_digest(self):
        p,t,w = self.fixture();self.mutate(t,'design/solution.json',lambda d:d['input_sha256'].update({'request.json':'0'*64}))
        self.run_check(p,t,False,'input binding')

    def test_extra_input_digest(self):
        p,t,w = self.fixture();self.mutate(t,'design/solution.json',lambda d:d['input_sha256'].update({'extra.json':'0'*64}))
        self.run_check(p,t,False,'input binding')

    def test_drifted_asset_bytes(self):
        p,t,w = self.fixture();(t/'raw.txt').write_text('changed')
        self.run_check(p,t,False,'stale artifact')

    def test_symlink_asset(self):
        p,t,w = self.fixture();(t/'raw.txt').unlink();(t/'raw.txt').symlink_to('/etc/hosts')
        self.run_check(p,t,False,'symlink|escapes')

    def test_path_traversal(self):
        p,t,w = self.fixture();self.mutate(t,'request.json',lambda d:d['assets']['raw'].update(path='../raw.txt'))
        self.run_check(p,t,False,'path')

    def test_duplicate_json_key(self):
        p,t,w = self.fixture();(t/'request.json').write_text('{"protocol":"x","protocol":"y"}')
        self.run_check(p,t,False,'duplicate')

    def test_output_after_missing_predecessor(self):
        p,t,w = self.fixture();(t/'design/intent.json').unlink()
        self.run_check(p,t,False,'missing predecessor')

    def test_output_after_blocked_predecessor(self):
        p,t,w = self.fixture();self.mutate(t,'design/intent.json',lambda d:d.update(status='blocked',blockers=[{'owner':'owner','next_action':'repair','evidence_ref':'fixture'}]))
        self.run_check(p,t,False,'blocked/failed')

    def test_blocked_needs_owner_and_recovery(self):
        p,t,w = self.fixture('design','blocked');self.mutate(t,'design/capture.json',lambda d:d.update(blockers=[]))
        self.run_check(p,t,False,'owner and recovery')

    def test_acceptance_freeze_cannot_drift(self):
        p,t,w = self.fixture();self.mutate(t,'design/language.json',lambda d:d['contract'].update(acceptance_ids=['AC2']))
        self.run_check(p,t,False,'acceptance changed')

    def test_final_cannot_replace_producer_asset(self):
        for stage,role,replacement in [('design','acceptance','solution'),('build','review','quality'),('deploy','smoke','execution')]:
            p,t,w = self.fixture(stage)
            self.mutate(t,w['handoff'],lambda d:d['assets'].update({role:d['assets'][replacement]}))
            self.run_check(p,t,False,'producer evidence')

    def test_real_design_packet_passes_static_only(self):
        p,t,w = self.fixture();self.real_design(p,t,w)
        self.assertEqual(self.run_check(p,t)['state'],'HANDOFF_CANDIDATE_STATIC')

    def test_real_design_wrong_packet_filename_rejected(self):
        p,t,w = self.fixture();self.real_design(p,t,w)
        self.mutate(t,w['handoff'],lambda d:d['assets'].update(design_packet=d['assets']['intent']))
        self.run_check(p,t,False,'actual design-loop')

    def test_real_design_packet_raw_source_drift(self):
        p,t,w = self.fixture();self.real_design(p,t,w)
        self.mutate(t,w['handoff'],lambda d:d['payload'].update(design_revision='r002'))
        self.run_check(p,t,False,'task/revision')

    def test_real_ui_packet_preserves_reviewed_assets(self):
        p,t,w=self.fixture();t=self.real_design(p,t,w,ui=True)
        self.assertEqual(self.run_check(p,t)['state'],'HANDOFF_CANDIDATE_STATIC')

    def test_real_ui_cannot_replace_reviewed_ux_or_preview(self):
        for role in ('journey','flow','ux_analysis','preview_evidence'):
            with self.subTest(role=role):
                p,t,w=self.fixture();t=self.real_design(p,t,w,ui=True)
                replacement=t/('unapproved-'+role+'.json');replacement.write_text('{"unapproved":true}')
                new={'path':replacement.name,'sha256':digest(replacement)}
                for step in w['steps']:
                    name=step['output'];data=read(t/name)
                    if role in data['assets']:data['assets'][role]=new
                    if role in step.get('payload_asset_refs',{}).values():
                        for field,r in step['payload_asset_refs'].items():
                            if r==role:data['payload'][field]=new['path']
                    write(t/name,data)
                self.refresh(t,w);self.run_check(p,t,False,'UI artifact drift|Preview evidence drift')
                shutil.rmtree(t.parent)

    def test_build_admission_rejects_expanded_scope(self):
        p,t,w = self.fixture();self.real_design(p,t,w)
        bp = SKILLS/'sdlc-build';bw=read(bp/'workflow.json')
        # Build task receives the exact same Design handoff/assets.
        source=SKILLS/'sdlc-build/examples/complete'
        for s in bw['steps']:
            dest=t/s['output'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/s['output'],dest)
        for f in (source/'assets').iterdir():
            if not (t/'assets'/f.name).exists():shutil.copyfile(f,t/'assets'/f.name)
        frozen=read(t/'design-to-build.json')['contract']
        for name in ['design-to-build.json']+[s['output'] for s in bw['steps']]:
            self.mutate(t,name,lambda d:d.update(contract={**frozen,'allowed_paths':['backend/**','secrets/**']}))
        self.truncate(t,bw,'plan');self.refresh(t,bw)
        self.run_check(bp,t,False,'incoming Design scope')

    def test_build_admission_preserves_reviewed_ui(self):
        for role in (None, 'journey', 'flow', 'ux_analysis', 'preview_evidence', 'missing'):
            with self.subTest(role=role):
                p,t,w=self.fixture();t=self.real_design(p,t,w,ui=True)
                bp=SKILLS/'sdlc-build';bw=read(bp/'workflow.json')
                source=bp/'examples/complete'
                first=bw['steps'][0];data=read(source/first['output'])
                data['contract']=read(t/'design-to-build.json')['contract']
                for a in data['assets'].values():
                    dest=t/a['path'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/a['path'],dest)
                write(t/first['output'],data)
                if role:
                    intake=read(t/'design-to-build.json')
                    if role=='missing':intake['assets'].pop('journey')
                    else:
                        replacement=t/'unreviewed.json';replacement.write_text('{"unreviewed":true}')
                        intake['assets'][role]={'path':replacement.name,'sha256':digest(replacement)}
                    write(t/'design-to-build.json',intake)
                self.refresh(t,bw)
                result=self.run_check(bp,t,role is None,None if role is None else 'UI artifact drift|Preview evidence drift|UI evidence roles missing')
                if role is None:self.assertEqual(result['context']['step'],'plan')
                shutil.rmtree(t.parent)

    def test_build_verify_cannot_drop_ac(self):
        p,t,w=self.fixture('build');self.mutate(t,'build/verify.json',lambda d:d['payload'].update(acceptance_ids=['AC2']))
        self.run_check(p,t,False,'locked acceptance')

    def test_self_review_rejected(self):
        p,t,w=self.fixture('build');self.change_asset(t,w,'review',lambda d:d.update(reviewer=d['implementer']))
        self.run_check(p,t,False,'independent review')

    def test_stale_candidate_review_rejected(self):
        p,t,w=self.fixture('build');self.change_asset(t,w,'review',lambda d:d.update(candidate_sha='c'*40))
        self.run_check(p,t,False,'stale')

    def test_quality_receipt_identity_rejected(self):
        for stage in ('build','deploy'):
            p,t,w=self.fixture(stage)
            if stage=='build':self.change_asset(t,w,'quality',lambda d:d.update(HEAD_SHA='c'*40))
            else:
                self.mutate(t,'build-to-deploy.json',lambda d:d['payload'].update(main_sha='c'*40));self.refresh(t,w)
            self.run_check(p,t,False,'quality')

    def test_build_package_digest_rejected(self):
        p,t,w=self.fixture('build');self.mutate(t,w['handoff'],lambda d:d['payload'].update(package_sha256='0'*64))
        self.run_check(p,t,False,'package digest')

    def test_build_criterion_without_pass_rejected(self):
        p,t,w=self.fixture('build');self.change_asset(t,w,'acceptance_evidence',lambda d:d['results'][0].update(status='unknown'))
        self.run_check(p,t,False,'every frozen acceptance')

    def test_deploy_rejects_incoming_package_mismatch(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'build-to-deploy.json',lambda d:d['payload'].update(package_sha256='0'*64));self.refresh(t,w)
        self.run_check(p,t,False,'package digest')

    def test_deploy_requires_build_evidence_roles(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'build-to-deploy.json',lambda d:d['assets'].pop('review'))
        self.run_check(p,t,False,'missing fields')

    def test_deploy_requires_separate_authority(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy-request.json',lambda d:d.update(deployment_authority_ref='unknown'));self.refresh(t,w)
        self.run_check(p,t,False,'authority missing')

    def test_deploy_request_cannot_select_other_release(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy-request.json',lambda d:d.update(expected_main_sha='c'*40));self.refresh(t,w)
        self.run_check(p,t,False,'another release')

    def test_observation_wrong_package_rejected(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy/observe.json',lambda d:d['payload'].update(package_sha256='0'*64))
        self.run_check(p,t,False,'different release')

    def test_execute_operation_must_match_durable_plan(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy/execute.json',lambda d:d['payload'].update(operation_id='different'))
        self.run_check(p,t,False,'durable release plan')

    def test_plan_operation_must_be_persisted_in_asset(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy/plan.json',lambda d:d['payload'].update(operation_id='different'))
        self.run_check(p,t,False,'not persisted')

    def test_recovery_required_after_unknown(self):
        p,t,w=self.fixture('deploy','unknown');self.mutate(t,'deploy/recover.json',lambda d:d.update(status='not_applicable',payload={'reason':'skip'}))
        self.run_check(p,t,False,'required capability')

    def test_healthy_cannot_trigger_recovery(self):
        p,t,w=self.fixture('deploy');self.mutate(t,'deploy/recover.json',lambda d:d.update(status='ready'))
        self.run_check(p,t,False,'explicit reason')

    def test_rollback_needs_authority(self):
        p,t,w=self.fixture('deploy','failed');self.mutate(t,'deploy-request.json',lambda d:d.update(rollback_authority_ref='none'));self.refresh(t,w)
        self.run_check(p,t,False,'rollback lacks')

    def test_rollback_receipt_cannot_claim_deployed(self):
        p,t,w=self.fixture('deploy','failed');self.mutate(t,w['handoff'],lambda d:d['payload'].update(outcome='deployed'))
        self.run_check(p,t,False,'overstates')

    def test_definition_drift_invalidates_earlier_outputs(self):
        p,t,w=self.fixture()
        copied=self.root/'copied';shutil.copytree(p,copied,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
        for name in ('agents/agent.md','skills/design-solution/SKILL.md','references/method.md','scripts/stage_checks.py'):
            original=(copied/name).read_text();(copied/name).write_text(original+'\n# changed\n')
            self.run_check(copied,t,False,'version drift');(copied/name).write_text(original)

    def test_recovery_state_exit_zero_is_not_completion(self):
        p,t,w=self.fixture('deploy','blocked');data=self.run_check(p,t)
        self.assertEqual(data['state'],'BLOCKED');self.assertEqual(data['contract'],'PASS_STATIC_ONLY')


if __name__ == '__main__':
    unittest.main()
