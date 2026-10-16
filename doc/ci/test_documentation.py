"""CI discovery bridge; the workflow Skill owns document-routing behavior tests."""
import importlib.util
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / '.agents/skills/sdlc-workflow/tests/test_docs.py'
spec = importlib.util.spec_from_file_location('owned_documentation_tests',SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
DocumentationTests = module.DocumentationTests
