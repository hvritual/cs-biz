#!/usr/bin/env python3
"""Read-only continuation planner. No input, including PASS, grants execution rights."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys

SHA = r'[0-9a-f]{40}'
DIGEST = r'[0-9a-f]{64}'
ISSUE = r'https://github.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/issues/[1-9][0-9]*'
STATES = {'in_progress', 'waiting_dependency', 'waiting_human', 'waiting_full', 'unknown_effect', 'complete'}
EVENTS = {'new_evidence', 'dependency_resolved', 'human_decision', 'candidate_changed'}

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

def nonempty(value):
    return isinstance(value, str) and bool(value.strip())

def path_ok(value):
    if not nonempty(value) or '\\' in value:
        return False
    p = PurePosixPath(value)
    return not p.is_absolute() and all(x not in ('', '.', '..') for x in value.split('/')) and not any(c in value for c in '*?[]\n\r')

def validate_goal(goal):
    require(isinstance(goal, dict), 'goal must be an object')
    require(set(goal) == {'schema_version', 'goal_id', 'authority_ref', 'outcome', 'acceptance', 'invariants', 'scope', 'budget', 'wake_events'}, 'goal fields differ from v1')
    require(goal['schema_version'] == 'goal-v1', 'unsupported goal version')
    require(nonempty(goal['goal_id']) and nonempty(goal['outcome']), 'goal identity/outcome missing')
    require(isinstance(goal['authority_ref'], str) and re.fullmatch(ISSUE, goal['authority_ref']), 'authority must be a GitHub Issue URL')
    ac = goal['acceptance']
    require(isinstance(ac, list) and bool(ac), 'acceptance missing')
    require(all(isinstance(x, dict) and set(x) == {'id', 'result', 'verification'} and all(nonempty(v) for v in x.values()) for x in ac), 'malformed acceptance')
    require(len({x['id'] for x in ac}) == len(ac), 'duplicate acceptance IDs')
    require(isinstance(goal['invariants'], list) and bool(goal['invariants']) and all(nonempty(x) for x in goal['invariants']), 'invariants missing')
    scope = goal['scope']
    require(isinstance(scope, dict) and set(scope) == {'allowed_paths', 'forbidden_paths'}, 'scope malformed')
    for key in scope:
        require(isinstance(scope[key], list) and all(path_ok(x) for x in scope[key]), 'unsafe scope path')
    require(bool(scope['allowed_paths']), 'allowed scope missing')
    b = goal['budget']
    require(isinstance(b, dict) and set(b) == {'max_attempts'}, 'budget malformed')
    require(type(b['max_attempts']) is int and 1 <= b['max_attempts'] <= 20, 'invalid max_attempts')
    require(isinstance(goal['wake_events'], list) and bool(goal['wake_events']) and all(x in EVENTS for x in goal['wake_events']), 'invalid wake policy')
    return goal

def reconcile(goal, checkpoint, current, event_id, event_type):
    validate_goal(goal)
    require(isinstance(checkpoint, dict) and isinstance(current, dict), 'checkpoint/current must be objects')
    require(checkpoint.get('schema_version') == 'resume-v1', 'unsupported resume version')
    require(checkpoint.get('goal_id') == goal['goal_id'], 'goal identity changed')
    require(checkpoint.get('goal_digest') == digest(goal), 'original goal changed: reapproval required')
    require(checkpoint.get('state') in STATES, 'invalid resume state')
    require(nonempty(checkpoint.get('run_id')) and nonempty(checkpoint.get('next_action')), 'resume action/run missing')
    for key in ('candidate_sha', 'design_digest', 'authority_digest'):
        pattern = SHA if key == 'candidate_sha' else DIGEST
        require(isinstance(checkpoint.get(key), str) and re.fullmatch(pattern, checkpoint[key]), 'checkpoint binding missing: ' + key)
        require(isinstance(current.get(key), str) and re.fullmatch(pattern, current[key]), 'current binding missing: ' + key)
    require(nonempty(current.get('environment')) and nonempty(checkpoint.get('environment')), 'environment missing')
    attempt = checkpoint.get('attempt')
    require(type(attempt) is int and attempt >= 0, 'invalid attempt')
    seen = checkpoint.get('processed_event_ids')
    require(isinstance(seen, list) and all(nonempty(x) for x in seen) and len(seen) == len(set(seen)), 'invalid processed events')
    require(nonempty(event_id) and event_type in EVENTS, 'invalid event')
    coverage = checkpoint.get('coverage')
    ids = {x['id'] for x in goal['acceptance']}
    require(isinstance(coverage, dict) and set(coverage) == ids, 'original acceptance coverage lost or expanded')
    for row in coverage.values():
        require(isinstance(row, dict) and row.get('status') in {'unproven', 'blocked', 'evidence_available'}, 'invalid coverage status')
        if row['status'] == 'evidence_available':
            require(isinstance(row.get('candidate_sha'), str) and re.fullmatch(SHA, row['candidate_sha']) and nonempty(row.get('source')), 'evidence binding missing')
    # This is a plan over declared observations. A trusted adapter/reviewer must
    # independently read external authority and evidence before any execution.
    out = {'goal_id': goal['goal_id'], 'goal_digest': digest(goal), 'authorized_to_execute': False,
           'business_complete': False, 'coverage': coverage, 'next_action': checkpoint['next_action']}
    def stop(status, action):
        return dict(out, status=status, next_action=action)
    if event_id in seen:
        return stop('NOOP_DUPLICATE', 'No side effects; inspect existing run if its outcome is unknown')
    if any(current[k] != checkpoint[k] for k in ('candidate_sha', 'design_digest', 'authority_digest', 'environment')):
        return stop('STALE_BINDINGS', 'Reconcile current source, invalidate affected evidence and obtain required approvals')
    if any(r['status'] == 'evidence_available' and r['candidate_sha'] != current['candidate_sha'] for r in coverage.values()):
        return stop('STALE_EVIDENCE', 'Read current-candidate evidence')
    state = checkpoint['state']
    if state == 'unknown_effect':
        return stop('WAITING_RECONCILIATION', 'Read authoritative side effect before any retry')
    if state in {'waiting_human', 'waiting_full'}:
        return stop('WAITING_HUMAN_FULL' if state == 'waiting_full' else 'WAITING_HUMAN', 'Independently authenticate exact-version Human decision; this planner cannot clear the wait')
    if attempt >= goal['budget']['max_attempts']:
        return stop('BUDGET_EXHAUSTED', 'Escalate without resetting attempt across runs')
    if event_type not in goal['wake_events']:
        return stop('NOOP_EVENT', 'Wait for an admitted event')
    if state == 'waiting_dependency':
        return stop('WAITING_DEPENDENCY', 'Read actual dependency state; an event alone does not resolve it')
    if all(row['status'] == 'evidence_available' for row in coverage.values()):
        return stop('NEEDS_TRUSTED_VERIFICATION', 'Independently verify every AC, environment, approval and CI; do not equate evidence references with completion')
    require(state != 'complete', 'false completion: unfinished acceptance')
    return stop('READY_FOR_AUTHORITY_CHECK', 'Authenticate current task/design/plan authority, then route one missing AC through sdlc-workflow')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--goal', type=Path, required=True)
    p.add_argument('--checkpoint', type=Path, required=True)
    p.add_argument('--current', type=Path, required=True)
    p.add_argument('--event-id', required=True)
    p.add_argument('--event-type', choices=sorted(EVENTS), required=True)
    a = p.parse_args()
    try:
        result = reconcile(*(json.loads(x.read_text()) for x in (a.goal, a.checkpoint, a.current)), a.event_id, a.event_type)
    except (ValueError, TypeError, KeyError, OSError) as exc:
        print(json.dumps({'status':'BLOCKED', 'reason':str(exc), 'authorized_to_execute':False})); return 1
    print(json.dumps(result, ensure_ascii=False, indent=2)); return 0

if __name__ == '__main__':
    sys.exit(main())
