#!/usr/bin/env python3
"""Validate untrusted Issue data; emit a handoff artifact, never dispatch Codex."""
import argparse
import json
from pathlib import Path
import re
import sys
from check_goal_resume import validate_goal, digest, require
from check_intent_v02 import decision

MARKER = '### SDLC input'

def intake(event, repository):
    require(isinstance(event, dict), 'event must be an object')
    require(isinstance(event.get('repository'), dict) and event['repository'].get('full_name') == repository, 'repository mismatch')
    issue = event.get('issue', {})
    require(isinstance(issue, dict) and 'pull_request' not in issue and issue.get('state') == 'open', 'not an open Issue')
    number = issue.get('number')
    require(type(number) is int and number > 0, 'invalid issue number')
    body = issue.get('body') or ''
    require(isinstance(body, str) and len(body.encode()) <= 60000, 'invalid/oversized issue body')
    require(body.count(MARKER) == 1, 'SDLC input section missing or duplicated')
    section = body.split(MARKER, 1)[1]
    match = re.fullmatch(r'\s*```json\s*\n(.*?)\n```\s*', section, re.S)
    require(match is not None, 'expected exactly one fenced JSON object after SDLC input')
    data = json.loads(match[1])
    require(isinstance(data, dict) and set(data) == {'goal', 'intent_spec'}, 'expected goal and original intent_spec')
    goal = validate_goal(data['goal'])
    require(goal['authority_ref'] == f'https://github.com/{repository}/issues/{number}', 'goal authority does not match event Issue')
    spec = data['intent_spec']
    require(isinstance(spec, dict), 'intent_spec must be an object')
    for key in ('hard_constraints', 'evidence', 'unknowns', 'decisions', 'risks', 'conflicts', 'alternatives', 'proposed_actions'):
        rows = spec.get(key, [])
        require(isinstance(rows, list) and all(isinstance(row, dict) for row in rows), 'malformed intent section: ' + key)
    verdict = decision(spec)
    # Source paths in original evidence require a separate repository-root check;
    # do not promote NEEDS_EVIDENCE to READY.
    return {'status':'INTAKE_VALIDATED' if verdict['status'] == 'READY' else 'NEEDS_INTENT_REVIEW',
            'intent_verdict':verdict, 'authority_ref':goal['authority_ref'],
            'goal_digest':digest(goal), 'input_digest':digest(data),
            'idempotency_key':f'{repository}:issue:{number}:{digest(data)}',
            'authorized_to_execute':False, 'codex_dispatched':False,
            'next_action':'Open or resume Codex with this Issue URL; enter sdlc-workflow and authenticate source authority',
            'input':data}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--event',type=Path,required=True)
    p.add_argument('--repository',required=True)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    try:
        result=intake(json.loads(a.event.read_text()),a.repository)
    except (ValueError,TypeError,KeyError,OSError) as exc:
        print(json.dumps({'status':'BLOCKED','reason':str(exc),'codex_dispatched':False}));return 1
    a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='input'},ensure_ascii=False))
    return 1 if result['intent_verdict']['status']=='BLOCKED' else 0

if __name__=='__main__':sys.exit(main())
