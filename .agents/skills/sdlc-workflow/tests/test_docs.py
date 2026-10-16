"""Fault injection for the live document map; no approval or semantic truth claims."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parents[1] / 'scripts/check_docs.py'
spec = importlib.util.spec_from_file_location('project_document_map', SOURCE)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class DocumentationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='docs-map-test-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        names = checker.documents(ROOT)
        names.update({checker.CONFIG,'frontend/package.json','doc/ci/check.sh'})
        names.update('.agents/skills/sdlc-'+s+'/workflow.json' for s in checker.STAGES)
        # Use the real document graph but only copy its declared files/targets.
        # Opaque source targets are read-only fixture bytes, never executed.
        for name in sorted(names):
            self.copy(ROOT/name)
        for name in checker.documents(ROOT):
            body = checker.FENCE.sub('',(ROOT/name).read_text())
            for match in checker.LINK.finditer(body):
                url = urlsplit(match.group(1).strip('<>'))
                if not url.scheme and not url.netloc and url.path:
                    target = ((ROOT/name).parent/unquote(url.path)).resolve()
                    if target.is_relative_to(ROOT):
                        self.copy(target)
        result=checker.check(self.root)
        self.assertEqual(result['issues'],[],result)

    def copy(self, source):
        destination = self.root/source.relative_to(ROOT)
        if source.is_dir():
            destination.mkdir(parents=True,exist_ok=True)
        else:
            destination.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(source,destination)

    def check_rejects(self, marker):
        result=checker.check(self.root)
        self.assertEqual(result['contract'],'FAIL',result)
        self.assertTrue(any(marker in error for error in result['issues']),result)
        self.assertIs(result['execution_granted'],False)

    def test_actual_map_is_reachable_without_preloading_history(self):
        result=checker.check(self.root)
        self.assertEqual(result['documents'],result['reachable'])
        self.assertEqual(result['public_skills'],5)
        self.assertEqual(result['capabilities'],22)
        self.assertEqual(result['semantic_freshness'],'NOT_VERIFIED')
        self.assertNotIn('doc/tasks/issue-11-f0/handoffs/r005/design.md',checker.documents(self.root))

    def test_broken_current_link_is_rejected(self):
        path=self.root/'doc/README.md'
        path.write_text(path.read_text()+'\n[missing](does-not-exist.md)\n')
        self.check_rejects('BROKEN_LINK')

    def test_new_unowned_document_is_rejected(self):
        (self.root/'doc/unowned.md').write_text('Unlinked new guidance')
        self.check_rejects('UNREACHABLE_DOCUMENT')

    def test_disconnected_document_cycle_is_rejected(self):
        (self.root/'doc/a.md').write_text('[b](b.md)')
        (self.root/'doc/b.md').write_text('[a](a.md)')
        self.check_rejects('UNREACHABLE_DOCUMENT')

    def test_empty_navigation_entry_is_rejected(self):
        (self.root/'doc/README.md').write_text('')
        self.check_rejects('EMPTY_DOCUMENT')

    def test_reintroduced_dispatch_alias_is_rejected(self):
        path=self.root/'.agents/skills/prompt-optimizer/SKILL.md'
        path.parent.mkdir();path.write_text('---\nname: prompt-optimizer\ndescription: forward only\n---\n')
        self.check_rejects('RETIRED_ENTRY_PRESENT')

    def test_live_reference_to_retired_document_is_rejected(self):
        path=self.root/'doc/README.md'
        path.write_text(path.read_text()+'\nRead `doc/workflow/project-profile.md` before work.\n')
        self.check_rejects('ACTIVE_RETIRED_REFERENCE')

    def test_historical_reference_is_not_a_live_instruction(self):
        path=self.root/'doc/tasks/fixture/handoffs/r001/old.md'
        path.parent.mkdir(parents=True);path.write_text('Historical doc/workflow/project-profile.md at old commit')
        self.assertEqual(checker.check(self.root)['issues'],[])

    def test_unregistered_internal_capability_is_rejected(self):
        path=self.root/'.agents/skills/sdlc-build/skills/orphan/SKILL.md'
        path.parent.mkdir();path.write_text('---\nname: orphan\ndescription: unregistered\n---\n')
        self.check_rejects('UNOWNED_OR_MISSING_CAPABILITY')

    def test_workflow_resource_deletion_is_rejected(self):
        (self.root/'.agents/skills/sdlc-build/references/admission.md').unlink()
        self.check_rejects('BROKEN_WORKFLOW_RESOURCE')

    def test_frontend_command_change_requires_document_map_review(self):
        path=self.root/'frontend/package.json';data=json.loads(path.read_text())
        data['scripts']['check']='pnpm check:full';path.write_text(json.dumps(data))
        self.check_rejects('COMMAND_DRIFT')

    def test_root_fast_cannot_silently_lose_backend(self):
        path=self.root/'doc/ci/check.sh'
        path.write_text(path.read_text().replace('bash "$root/backend/ci/check.sh"','true'))
        self.check_rejects('COMMAND_DRIFT')

    def test_risk_level_definition_cannot_be_lost_during_cleanup(self):
        path=self.root/'.agents/skills/sdlc-build/references/admission.md'
        path.write_text(path.read_text().replace('- T3 backend capability: tenant/auth, invariants, concurrency, failure/observable effects.',''))
        self.check_rejects('BUILD_RISK_DEFINITION_MISSING')

    def test_risk_floor_cannot_be_lost_during_cleanup(self):
        path=self.root/'.agents/skills/sdlc-build/references/admission.md'
        path.write_text(path.read_text().replace('cannot be classed below T3','may use a convenient lower class'))
        self.check_rejects('BUILD_RISK_DEFINITION_MISSING')

    def test_replacement_cannot_disappear(self):
        (self.root/'.agents/skills/sdlc-design/references/design-handoff-v2.md').unlink()
        self.check_rejects('MISSING_REPLACEMENT')


if __name__ == '__main__':
    unittest.main()
