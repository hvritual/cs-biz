#!/usr/bin/env python3
"""Generate explicit synthetic goal examples, never external proof or authority."""
from pathlib import Path
import copy
import json
from check_goal import basis, digest

PACKAGE = Path(__file__).resolve().parents[1]


def write(root, name, data):
    target = root / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(data if isinstance(data, str) else json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    return {'path': name, 'sha256': digest(target.read_bytes())}


def example(root, kind):
    raw = write(root, 'raw.txt', 'SYNTHETIC ONLY: ' + ('使用 Yunka 建立通用基础 SaaS，请先调查并给出可审阅选择。' if kind != 'operation' else '给全部经销商开通已有营销功能，准备变更后交我审核。') + '\n')
    goal = {'protocol': 'goal-progress-v1', 'goal_id': 'synthetic-' + kind, 'revision': 'r001', 'mode': 'example',
            'baseline_sha': 'a' * 40, 'raw_ref': raw, 'feedback_refs': [],
            'authority_ref': 'example://not-authenticated-Human-intent', 'requested_boundary': 'operational',
            'required_channels': ['service'] if kind == 'operation' else ['local', 'github'],
            'sources': [], 'searches': [], 'budget': {'policy_ref': 'example://cumulative-budget',
                'max_without_progress': 2, 'attempts_without_progress': 0}, 'records': {}}
    if kind == 'explore':
        write(root, 'goal.json', goal)
        return
    for channel in goal['required_channels']:
        ref = write(root, 'sources/' + channel + '.txt', 'SYNTHETIC source, not actual ' + channel + ' retrieval or deployed capability.\n')
        goal['sources'].append({'id': channel, 'channel': channel, 'locator': 'example://' + channel,
                                'version': 'synthetic-v1', 'artifact_ref': ref})
        goal['searches'].append({'channel': channel, 'query': 'synthetic scope and current capability', 'status': 'observed',
                                'source_ids': [channel], 'reason': 'Example data only, not a real search result.'})
    ids = [s['id'] for s in goal['sources']]
    proposed = {'basis_sha256': basis(goal), 'route': 'operation' if kind == 'operation' else 'software',
        'background': 'Synthetic existing state; actual state requires host retrieval.', 'impact': 'Only the stated tenant scope; no production action in this example.',
        'goals': ['Make the current required result observable without changing unrelated rights.'],
        'flows': ['Owner inspects scope, reviews change, operator applies once, and verifier reads back success/denial/unknown recovery.'],
        'options': [{'id': 'reuse', 'description': 'Reuse the existing capability under its current constraints.', 'tradeoffs': 'Smallest change; actual compatibility still needs inspection.',
                     'counterevidence': 'An absent API or incompatible contract invalidates this option.', 'source_ids': ids},
                    {'id': 'defer', 'description': 'Defer activation until the material gap is resolved.', 'tradeoffs': 'Delays value but avoids unsupported effects.',
                     'counterevidence': 'Unnecessary if current capability and authority can be verified.', 'source_ids': ids}], 'recommended': 'reuse',
        'requirements': [{'id': 'R1', 'classification': 'explicit', 'rationale': 'The original requested outcome.', 'source_ids': ids, 'criterion_ids': ['AC1']}],
        'criteria': [{'id': 'AC1', 'given': 'Verified target inventory and current authority.', 'when': 'The authorized operator applies the reviewed change.',
                      'then': 'Every in-scope target has the exact expected effective state.', 'negative': 'Out-of-scope tenants gain no access.',
                      'recovery': 'Lost reply is read back by operation ID before any retry.', 'verification': 'Query each target through the authoritative service.',
                      'environment': 'synthetic-only'}], 'decisions': []}
    goal['records']['assessment'] = write(root, 'assessment.json', proposed)
    if kind == 'saas':
        architecture = {'basis_sha256': basis(goal), 'assessment_sha256': goal['records']['assessment']['sha256'],
            'current_state': ['Synthetic example; no actual IAM, database or Yunka compatibility is proved.'],
            'patterns': [{'name': 'Separate identity, access and domain responsibility.', 'fit': 'Protect the requested tenant operation.',
                          'limitations': 'Requires actual runtime authority and storage.', 'source_ids': ids}],
            'compatibility': [{'area': 'Operation contract', 'disposition': 'adapt', 'reason': 'Inspect actual accepted PB and consumers before implementation.', 'source_ids': ids}],
            'roadmap': [{'id': 'S1', 'depends_on': [], 'outcome': 'One actual tenant operation under the accepted boundary.',
                        'verification': 'Real API/DB positive, denial and recovery observations.', 'resources': ['Identity and DB Owner decisions']}], 'decisions': []}
        goal['records']['architecture'] = write(root, 'architecture.json', architecture)
    else:
        inventory = write(root, 'inventory.json', {'ids': ['dealer-a', 'dealer-b'], 'notice': 'Synthetic complete inventory, not actual distributors.'})
        plan = {'basis_sha256': basis(goal), 'assessment_sha256': goal['records']['assessment']['sha256'],
                'environment': 'synthetic-only', 'as_of': '2026-10-16T08:00:00+00:00', 'target_predicate': 'All two synthetic active distributors at the recorded observation.',
                'inventory_ref': inventory, 'targets': ['dealer-a', 'dealer-b'], 'exclusions': [], 'operation_id': 'synthetic-operation-001',
                'expected': 'The selected marketing feature becomes effective without changing unrelated IAM.',
                'verification': 'Read current feature state for each target.', 'recovery': 'Read preserved operation ID after unknown reply; never replay blindly.', 'criterion_ids': ['AC1']}
        goal['records']['operation'] = write(root, 'operation.json', plan)
    write(root, 'goal.json', goal)


def generate(package=PACKAGE):
    for kind in ('explore', 'saas', 'operation'):
        example(package / 'examples' / kind, kind)
    template = json.loads((package / 'examples/explore/goal.json').read_text())
    template.update(goal_id='replace-with-existing-task-id', mode='real')
    write(package, 'templates/goal.json', template)


if __name__ == '__main__':
    generate()
    print('Generated synthetic examples only; no search, approval or external action performed.')
