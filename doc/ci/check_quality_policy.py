#!/usr/bin/env python3
"""Static source checks; actual GitHub results/receipts remain required."""
from pathlib import Path
import sys
import yaml
from check_human_full_policy import AUTO, workflow_triggers


def check(root):
    errors = []
    try:
        q = (root / '.github/workflows/quality.yml').read_text()
        parsed = yaml.load(q, Loader=yaml.BaseLoader)
        if parsed.get('permissions') != {'contents': 'read', 'pull-requests': 'read'}:
            errors.append('UNSAFE_PERMISSIONS')
        def properties(value):
            if isinstance(value, dict):
                if 'continue-on-error' in value: errors.append('CONTINUE_ON_ERROR_FORBIDDEN')
                for child in value.values(): properties(child)
            elif isinstance(value, list):
                for child in value: properties(child)
        properties(parsed)
        jobs = parsed['jobs']
        if set(jobs) != {'classify', 'backend', 'frontend', 'quality-gate'}: errors.append('JOB_SET_CHANGED')
        expected_conditions = {'classify': "github.event_name != 'pull_request' || !github.event.pull_request.draft",
            'backend': "needs.classify.outputs.backend == 'true'", 'frontend': "needs.classify.outputs.frontend == 'true'",
            'quality-gate': "always() && (github.event_name != 'pull_request' || !github.event.pull_request.draft)"}
        for job, condition in expected_conditions.items():
            if jobs[job].get('if') != condition: errors.append('JOB_CONDITION:' + job)
        expected_commands = {
            'backend': ['bash backend/ci/check.sh'],
            'frontend': ['corepack pnpm install --frozen-lockfile --prefer-offline', 'corepack pnpm check:fast',
                         'corepack pnpm build', 'corepack pnpm test:e2e',
                         'python3 doc/ci/check_browser_evidence.py --frontend frontend --head "$HEAD_SHA"']}
        for job, commands in expected_commands.items():
            steps = jobs[job]['steps']
            if steps[0].get('with', {}).get('ref') != '${{ needs.classify.outputs.head }}': errors.append('WRONG_CHECKOUT:' + job)
            for command in commands:
                matches = [s for s in steps if s.get('run', '').strip() == command]
                if len(matches) != 1 or 'if' in matches[0]: errors.append('DISABLED_OR_MISSING_COMMAND:' + command)
        if workflow_triggers(q) != ['pull_request', 'push', 'workflow_dispatch']:
            errors.append('QUALITY_EVENTS')
        required = ['branches: [main]', 'types: [opened, synchronize, reopened, ready_for_review]',
                    "if: github.event_name != 'pull_request' || !github.event.pull_request.draft",
                    'cancel-in-progress: true', 'persist-credentials: false',
                    'fetch-depth: 0', 'github.event.pull_request.head.sha || github.sha',
                    'git show "$base:doc/ci/select_quality.py"', 'tier=full',
                    'python3 doc/ci/check_quality_policy.py', "-p 'test_*.py'",
                    'bash backend/ci/check.sh', 'if: needs.classify.outputs.backend',
                    'if: needs.classify.outputs.frontend', 'hashFiles(\'frontend/pnpm-lock.yaml\')',
                    'corepack pnpm install --frozen-lockfile --prefer-offline',
                    'corepack pnpm check:fast', 'corepack pnpm build', 'corepack pnpm test:e2e',
                    'e2e-web install --with-deps chromium', 'playwright install --with-deps chromium',
                    'include-hidden-files: true', 'frontend/.e2e/report.json',
                    'needs: [classify, backend, frontend]', 'if: always()',
                    "main == e['BASE_SHA']", "pr['head']['sha'] == e['HEAD_SHA']",
                    "e['CLASSIFY_RESULT'] == 'success'", "e['BACKEND_RESULT'] ==", "e['FRONTEND_RESULT'] ==",
                    'quality-receipt-', 'if-no-files-found: error', 'test "$EVENT_NAME"',
                    'python3 doc/ci/check_browser_evidence.py --frontend frontend --head "$HEAD_SHA"']
        for token in required:
            if token not in q: errors.append('QUALITY_MISSING:' + token)
        for token in ('corepack pnpm check:fast', 'corepack pnpm build', 'corepack pnpm test:e2e'):
            if q.count('run: ' + token + '\n') != 1: errors.append('NOT_ONCE:' + token)
        gate = q.split('  quality-gate:', 1)[1]
        if 'actions/checkout' in gate or 'uses: ./' in gate:
            errors.append('RECEIPT_EXECUTES_CANDIDATE')
        for rel in AUTO:
            if workflow_triggers((root / rel).read_text()) != ['workflow_dispatch']:
                errors.append('DUPLICATE_AUTOMATIC_PIPELINE:' + rel)
        for rel in (root / '.github/workflows').glob('*.y*ml'):
            if rel.name not in ('quality.yml', 'frontend-full.yml') and rel.as_posix().endswith(tuple(AUTO)):
                continue
            if rel.name not in ('quality.yml', 'frontend-full.yml') and workflow_triggers(rel.read_text()) != ['workflow_dispatch']:
                errors.append('UNKNOWN_AUTOMATIC_PIPELINE:' + rel.name)
    except (OSError, ValueError, IndexError, KeyError, TypeError, yaml.YAMLError) as exc:
        errors.append('POLICY_UNREADABLE:' + str(exc))
    return errors


if __name__ == '__main__':
    issues = check(Path(__file__).resolve().parents[2])
    print('BLOCKED: ' + repr(issues) if issues else 'PASS_STATIC_ONLY: trusted selection, once-only work, independent exact-SHA receipt')
    sys.exit(2 if issues else 0)
