"""CI discovery bridge; behavior tests are owned by the workflow Skill."""
import importlib.util
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / '.agents/skills/sdlc-workflow/tests/test_workflows.py'
spec = importlib.util.spec_from_file_location('packaged_agent_workflow_tests', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
AgentWorkflowTests = module.AgentWorkflowTests
