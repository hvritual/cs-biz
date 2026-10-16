#!/usr/bin/env python3
"""Generic read-only artifact workflow checker. Identical copies ship with each stage.

Uses the documented JSON Schema subset in contracts; rejects unsupported keywords.
Never runs artifact commands, chooses a model, grants authority or writes task state.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys

from artifact_io import asset, digest, read_json, relative, require, scope_path

KEYWORDS = {'$schema', 'title', 'description', 'type', 'const', 'enum', 'required',
            'properties', 'additionalProperties', 'items', 'minItems', 'minLength',
            'uniqueItems', 'pattern', 'anyOf'}
TYPES = {'object': dict, 'array': list, 'string': str, 'integer': int,
         'boolean': bool, 'null': type(None)}


def schema_check(schema, value, location='$'):
    require(isinstance(schema, dict) and not schema.keys() - KEYWORDS,
            'unsupported schema keyword: ' + location)
    if 'anyOf' in schema:
        errors = []
        for alternative in schema['anyOf']:
            try:
                schema_check(alternative, value, location)
                break
            except ValueError as exc:
                errors.append(str(exc))
        else:
            raise ValueError('no schema alternative: ' + location + ': ' + '; '.join(errors))
    if 'type' in schema:
        require(schema['type'] in TYPES, 'unsupported schema type')
        require(type(value) is TYPES[schema['type']], 'wrong type: ' + location)
    if 'const' in schema:
        require(type(value) is type(schema['const']) and value == schema['const'],
                'wrong constant: ' + location)
    if 'enum' in schema:
        require(any(type(value) is type(x) and value == x for x in schema['enum']),
                'invalid enum: ' + location)
    if isinstance(value, str):
        require(len(value.strip()) >= schema.get('minLength', 0), 'empty field: ' + location)
        require('pattern' not in schema or re.search(schema['pattern'], value),
                'pattern mismatch: ' + location)
    if isinstance(value, dict):
        require(not set(schema.get('required', [])) - value.keys(), 'missing fields: ' + location)
        properties = schema.get('properties', {})
        if schema.get('additionalProperties') is False:
            require(not value.keys() - properties.keys(), 'unknown fields: ' + location)
        for key, item in value.items():
            rule = properties.get(key, schema.get('additionalProperties', {}))
            if isinstance(rule, dict):
                schema_check(rule, item, location + '/' + key)
    if isinstance(value, list):
        require(len(value) >= schema.get('minItems', 0), 'empty list: ' + location)
        if schema.get('uniqueItems'):
            enc = [json.dumps(x, sort_keys=True, allow_nan=False) for x in value]
            require(len(set(enc)) == len(enc), 'duplicate items: ' + location)
        for index, item in enumerate(value):
            schema_check(schema.get('items', {}), item, location + '/' + str(index))


def pointer(data, value):
    require(isinstance(value, str) and value.startswith('/'), 'invalid JSON pointer')
    for token in value[1:].split('/'):
        require(not re.search(r'~(?![01])', token), 'invalid pointer escape')
        token = token.replace('~1', '/').replace('~0', '~')
        require(isinstance(data, dict) and token in data, 'pointer target missing: ' + value)
        data = data[token]
    return data


def package(root):
    root = root.resolve()
    workflow = read_json(relative(root, 'workflow.json'))
    require(workflow.get('protocol') == 'sdlc-workflow-v1', 'wrong workflow protocol')
    require(workflow.get('stage') in {'design', 'build', 'deploy'}, 'unknown stage')
    for name in ('agent', 'agent_instructions', 'intake_contract', 'artifact_contract', 'handoff_contract'):
        relative(root, workflow[name])
    steps = workflow.get('steps')
    require(isinstance(steps, list) and steps, 'workflow steps missing')
    ids, outputs, skills, producers = set(), set(), set(), {}
    relative(root, 'scripts/stage_checks.py')
    prior_files = set(workflow['intake_files'])
    for name in prior_files:
        scope_path(name, glob_root=False)
    for step in steps:
        require(isinstance(step.get('id'), str) and re.fullmatch('[a-z][a-z0-9-]*', step['id'])
                and step['id'] not in ids, 'invalid/duplicate step')
        require(step['skill'] not in skills, 'one capability per step; duplicate Skill mapping')
        skill = relative(root, step['skill'])
        require(skill.name == 'SKILL.md' and skill.parent.parent == root / 'skills',
                'capability must live inside this workflow Skill')
        text = skill.read_text(encoding='utf-8')
        require(re.search(r'(?m)^name: ' + re.escape(skill.parent.name) + r'\s*$', text),
                'Skill name/directory mismatch')
        require(all(section in text for section in ('## Responsibility', '## Inputs', '## Output', '## Boundary')),
                'capability lacks single-function contract')
        require(len(step.get('needs', [])) == len(set(step.get('needs', []))) and
                set(step.get('needs', [])) <= ids, 'unknown/cyclic/unordered/duplicate step dependency')
        require(set(step.get('inputs', [])) <= prior_files, 'input has no prior producer')
        expected_inputs = set(workflow['intake_files']) | {producers[n] for n in step['needs']}
        require(set(step['inputs']) == expected_inputs and len(step['inputs']) == len(expected_inputs),
                'step inputs must bind intake and every declared predecessor')
        scope_path(step['output'], glob_root=False)
        require(step['output'] not in outputs and step['output'] not in workflow['intake_files'],
                'duplicate/overwritten artifact output')
        for name in step.get('resources', []):
            relative(root, name)
        relative(root, step['payload_contract'])
        if 'when' in step:
            require(step['when']['file'] in step['inputs'], 'condition input not explicitly bound')
            require(set(step['when']) in ({'file', 'pointer', 'is'}, {'file', 'pointer', 'in'}),
                    'invalid condition contract')
        ids.add(step['id']); outputs.add(step['output']); skills.add(step['skill'])
        producers[step['id']] = step['output']
        prior_files.add(step['output'])
    require(workflow['handoff'] == steps[-1]['output'], 'handoff must be final output')
    consumed = {name for step in steps for name in step['inputs']} - set(workflow['intake_files'])
    require(consumed == outputs - {workflow['handoff']}, 'unconsumed capability output')
    require(workflow['consumer'] == {'design': 'build', 'build': 'deploy', 'deploy': 'closure'}[workflow['stage']],
            'invalid handoff recipient')
    return workflow


def condition(task, step):
    rule = step.get('when')
    if not rule:
        return True
    value = pointer(read_json(relative(task, rule['file'])), rule['pointer'])
    if 'is' in rule:
        return type(value) is type(rule['is']) and value == rule['is']
    return any(type(value) is type(x) and value == x for x in rule['in'])


def context(root, task, workflow, step, applicable, include_skill):
    # Output only this capability and its explicit inputs/resources, not the whole catalog.
    value = {'step': step['id'], 'skill': step['skill'], 'output': step['output'],
             'definition_sha256': definition_digest(root, workflow, step),
             'applicable': applicable, 'payload_contract': step['payload_contract'],
             'inputs': [{'path': name, 'sha256': digest(relative(task, name).read_bytes())}
                        for name in step['inputs']],
             'resources': step.get('resources', []) if applicable else []}
    if include_skill and applicable:
        value['instructions'] = relative(root, step['skill']).read_text(encoding='utf-8')
    return value


def definition_digest(root, workflow, step):
    names = {'workflow.json', 'SKILL.md', workflow['agent'], workflow['agent_instructions'],
             workflow['intake_contract'], workflow['artifact_contract'], workflow['handoff_contract'],
             step['skill'], step['payload_contract'], *step.get('resources', [])}
    names.update(p.relative_to(root).as_posix() for p in (root / 'scripts').glob('*.py'))
    bound = {name: digest(relative(root, name).read_bytes()) for name in sorted(names)}
    return digest(json.dumps(bound, sort_keys=True, separators=(',', ':')).encode())


def validate_artifact(root, task, workflow, step, intake, completed):
    data = read_json(relative(task, step['output']))
    schema_check(read_json(relative(root, workflow['artifact_contract'])), data)
    require(data['task_id'] == intake['task_id'] and data['stage'] == workflow['stage']
            and data['step'] == step['id'], 'wrong task/stage/step identity')
    require(data['definition_sha256'] == definition_digest(root, workflow, step),
            'workflow/Agent/Skill/contract/resource version drift')
    expected = {name: digest(relative(task, name).read_bytes()) for name in step['inputs']}
    require(data['input_sha256'] == expected, 'stale/missing/extra artifact input binding')
    base_contract = intake['contract']
    if workflow['stage'] == 'design':
        require(all(data['contract'].get(k) == v for k, v in base_contract.items()),
                'design changed frozen request boundary')
    else:
        require(data['contract'] == base_contract, 'acceptance/scope/version drift across stages')
    applicable = condition(task, step)
    if not applicable:
        require(data['status'] == 'not_applicable' and isinstance(data['payload'].get('reason'), str)
                and bool(data['payload']['reason'].strip()),
                'inapplicable step needs explicit reason and status')
    else:
        require(data['status'] != 'not_applicable', 'required capability cannot be skipped')
    for item in data['assets'].values():
        asset(task, item)
    if data['status'] in {'blocked', 'failed'}:
        require(bool(data['blockers']), 'blocked/failed artifact needs owner and recovery')
    else:
        require(not data['blockers'], 'ready/inapplicable artifact has unresolved blockers')
    if data['status'] == 'ready':
        schema_check(read_json(relative(root, step['payload_contract'])), data['payload'])
        require(set(step.get('required_assets', [])) <= data['assets'].keys(), 'required evidence asset missing')
        for field, role in step.get('payload_asset_refs', {}).items():
            require(data['payload'][field] == data['assets'][role]['path'], 'payload/asset reference mismatch')
    if step['output'] == workflow['handoff'] and data['status'] == 'ready':
        schema_check(read_json(relative(root, workflow['handoff_contract'])), data)
        require(data['payload']['consumer'] == workflow['consumer'], 'wrong downstream consumer')
        if 'inherit_contract_from' in workflow:
            require(data['contract'] == completed[workflow['inherit_contract_from']]['contract'],
                    'handoff differs from frozen acceptance artifact')
        for previous in completed.values():
            for role, item in previous['assets'].items():
                require(data['assets'].get(role) == item,
                        'handoff replaced/dropped producer evidence: ' + role)
    # Stage-specific read-only semantics live inside this workflow package.
    hook = root / 'scripts/stage_checks.py'
    spec = importlib.util.spec_from_file_location('stage_checks_' + workflow['stage'], hook)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.check(workflow, step, data, intake, task, completed)
    return data


def inspect(root, task, include_skill=False):
    workflow = package(root)
    task = task.absolute()  # Preserve symlink identity until relative() checks each artifact.
    intake = read_json(relative(task, workflow['intake_files'][0]))
    schema_check(read_json(relative(root, workflow['intake_contract'])), intake)
    for field in ('allowed_paths', 'forbidden_paths'):
        for value in intake['contract'][field]:
            scope_path(value, glob_root=False)
    for item in intake.get('assets', {}).values():
        asset(task, item)
    for filename in workflow['intake_files'][1:]:
        relative(task, filename)
    completed = {}
    for index, step in enumerate(workflow['steps']):
        path = task / step['output']
        if not path.exists() and not path.is_symlink():
            require(not any((task / s['output']).exists() or (task / s['output']).is_symlink()
                            for s in workflow['steps'][index + 1:]), 'output exists after missing predecessor')
            applicable = condition(task, step)
            return {'state': 'READY_FOR_STEP_STATIC',
                    'next_action': 'INVOKE_SKILL' if applicable else 'RECORD_NOT_APPLICABLE',
                    'context': context(root, task, workflow, step, applicable, include_skill)}
        data = validate_artifact(root, task, workflow, step, intake, completed)
        completed[step['id']] = data
        if data['status'] in {'blocked', 'failed'}:
            require(not any((task / s['output']).exists() or (task / s['output']).is_symlink()
                            for s in workflow['steps'][index + 1:]),
                    'downstream output exists after blocked/failed artifact')
            return {'state': 'BLOCKED', 'step': step['id'], 'blockers': data['blockers'],
                    'coordinator_return': coordinator_return(workflow, intake, step['output'], 'blocked')}
    outcome = completed[workflow['steps'][-1]['id']]['payload'].get('outcome')
    state = 'HANDOFF_CANDIDATE_STATIC'
    if workflow['stage'] == 'deploy' and outcome != 'deployed':
        state = 'ROLLED_BACK' if outcome == 'rolled_back' else 'OUTCOME_UNPROVEN'
    return {'state': 'EXAMPLE_ONLY' if intake['contract']['mode'] == 'example' else state,
            'reported_outcome': outcome,
            'handoff': workflow['handoff'], 'consumer': workflow['consumer'],
            'coordinator_return': coordinator_return(workflow, intake, workflow['handoff'], state),
            'handoff_sha256': digest(relative(task, workflow['handoff']).read_bytes())}


def coordinator_return(workflow, intake, result_ref, result):
    # The downstream consumer names a data format, not permission to dispatch
    # it. Goal must reconcile the parent contract and actual result first.
    contract = intake['contract']
    return {'owner': 'goal', 'next_action': 'RECONCILE_GOAL', 'task_id': intake['task_id'],
            'stage': workflow['stage'], 'stage_result': result, 'result_ref': result_ref,
            'completion_boundary': contract['completion_boundary'],
            'requirement_ids': contract.get('requirement_ids', []),
            'acceptance_ids': contract.get('acceptance_ids', []), 'goal_complete': False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workflow-root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--task', type=Path)
    parser.add_argument('--structure', action='store_true')
    parser.add_argument('--include-skill', action='store_true')
    args = parser.parse_args(argv)
    result = {'authentic_approval': 'NOT_VERIFIED', 'runtime': 'NOT_VERIFIED',
              'execution_granted': False}
    try:
        root = args.workflow_root.resolve()
        if args.structure:
            workflow = package(root)
            result.update(state='PACKAGE_VALID_STATIC', stage=workflow['stage'])
        else:
            require(args.task is not None, '--task or --structure required')
            result.update(inspect(root, args.task, args.include_skill))
        result['contract'] = 'PASS_STATIC_ONLY'
    except (ValueError, OSError, KeyError, TypeError, AttributeError, RecursionError,
            ImportError, subprocess.SubprocessError) as exc:
        result.update(contract='FAIL', issues=[str(exc)])
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 2 if result['contract'] == 'FAIL' else 0


if __name__ == '__main__':
    raise SystemExit(main())
