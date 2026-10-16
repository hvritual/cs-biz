"""CI discovery bridge; goal behavior tests belong to the owning Skill."""
import importlib.util
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[2] / '.agents/skills/intent-to-outcome-closure/tests/test_goal.py'
spec = importlib.util.spec_from_file_location('packaged_goal_tests', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
GoalTests = module.GoalTests
