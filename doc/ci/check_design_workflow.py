#!/usr/bin/env python3
"""Compatibility entry only; authoritative implementation is inside its Skill."""
from pathlib import Path
import runpy
import sys
_TARGET = Path(__file__).resolve().parents[2] / '.agents/skills/sdlc-design/scripts/check_design_workflow.py'
sys.path.insert(0, str(_TARGET.parent))
_exports = runpy.run_path(str(_TARGET))
globals().update({k: v for k, v in _exports.items() if not k.startswith('__')})
if __name__ == '__main__':
    raise SystemExit(main())
