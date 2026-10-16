"""Resource ownership/initialization counterexamples; no mocked runtime PASS."""
from pathlib import Path
import json
import tempfile
import unittest
from types import SimpleNamespace
from contextlib import redirect_stdout
from io import StringIO
from resources import initialize, permission_denied, Resources


class ResourceOwnershipTests(unittest.TestCase):
    def test_failure_diagnostics_redact_runtime_secrets_and_urls(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)/'state'
            initialize(state,'ci')
            resources = Resources(state)
            secret = resources.env['CS_OIDC_ADMIN_PASSWORD']
            resources.compose = lambda *a, **kw: SimpleNamespace(stdout='ERROR password='+secret+' https://example.invalid/?code=sensitive eyJfake.token.value',stderr='')
            output = StringIO()
            with redirect_stdout(output):
                resources.diagnostics()
            self.assertNotIn(secret,output.getvalue())
            self.assertNotIn('sensitive',output.getvalue())
            self.assertNotIn('eyJfake',output.getvalue())

    def test_only_database_permission_errors_prove_isolation(self):
        for code in (1044,1142):
            self.assertTrue(permission_denied(SimpleNamespace(returncode=1,stderr='ERROR '+str(code)+' (42000): denied')))
        for code in (1045,1146,2002,2013):
            self.assertFalse(permission_denied(SimpleNamespace(returncode=1,stderr='ERROR '+str(code)+' (42000): other failure')))
        self.assertFalse(permission_denied(SimpleNamespace(returncode=0,stderr='ERROR 1142 (42000): denied')))

    def test_nonproduction_private_state_and_reuse(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)/'state'
            initialize(state,'development')
            resources = Resources(state)
            self.assertTrue(resources.issuer.startswith('http://127.0.0.1:'))
            self.assertEqual((state/'runtime.env').stat().st_mode & 0o777,0o600)
            original = (state/'runtime.env').read_bytes()
            with self.assertRaises(RuntimeError):
                initialize(state,'development')
            self.assertEqual(original,(state/'runtime.env').read_bytes())
            with self.assertRaises(RuntimeError):
                resources.down(destroy_ci=True)

    def test_invalid_environment_and_unowned_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)/'state'
            with self.assertRaises(RuntimeError):
                initialize(state,'production')
            initialize(state,'ci')
            (state/'owner.json').write_text(json.dumps({'owner':'another-project'}))
            with self.assertRaises(RuntimeError):
                Resources(state)

    def test_symlink_state_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)
            target = parent/'target'
            initialize(target,'ci')
            link = parent/'link'
            link.symlink_to(target,target_is_directory=True)
            with self.assertRaises(RuntimeError):
                initialize(link,'ci')
            with self.assertRaises(RuntimeError):
                Resources(link)
