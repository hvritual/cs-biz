"""CI discovery bridge; behavior tests are owned by the workflow Skill."""
import importlib.util
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / '.agents/skills/sdlc-workflow/tests/test_workflows.py'
spec = importlib.util.spec_from_file_location('packaged_agent_workflow_tests', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
AgentWorkflowTests = module.AgentWorkflowTests

ROLE_SOURCE = SOURCE.with_name('test_role_journeys.py')
role_spec = importlib.util.spec_from_file_location('packaged_role_journey_tests', ROLE_SOURCE)
role_module = importlib.util.module_from_spec(role_spec)
role_spec.loader.exec_module(role_module)
RoleJourneyTests = role_module.RoleJourneyTests
