"""Read-only software goal reconciliation; stage and external checks stay authoritative.

This is a projection over the existing goal/task records, not a scheduler service
or an approval source. The host authenticates every referenced decision/result.
"""


def evaluate(api, root, goal, assessment, architecture, record):
    require, fields, strings, asset, digest = api.require, api.fields, api.strings, api.asset, api.digest
    fields(record, ('protocol', 'basis_sha256', 'goal_id', 'assessment_sha256',
                    'work_items', 'observations', 'decision_scopes', 'business_proofs',
                    'last_event', 'reconciliation_ref'))
    require(record['protocol'] == 'goal-coordination-v1' and record['goal_id'] == goal['goal_id'],
            'coordination goal identity mismatch')
    require(record['assessment_sha256'] == goal['records']['assessment']['sha256'], 'stale coordination assessment')
    requirements = {r['id']: r for r in assessment['requirements'] if r['classification'] != 'optional'}
    criteria = {c['id']: c for c in assessment['criteria']}
    decisions = assessment['decisions'] + (architecture['decisions'] if architecture else [])
    strings([d['id'] for d in decisions], 'combined decision IDs', empty=True)
    pending = {d['id'] for d in decisions if d['response'] is None}
    require(isinstance(record['work_items'], list) and record['work_items'], 'work inventory missing')
    nodes, coverage, outcome_criteria = {}, set(), set()
    for node in record['work_items']:
        fields(node, ('id', 'task_id', 'kind', 'requirement_ids', 'criterion_ids', 'depends_on', 'stage',
                      'task_ref', 'outcome', 'omission_impact', 'admission_ref'))
        require(api.text(node['id']) and node['id'] not in nodes, 'duplicate/invalid work ID')
        require(node['kind'] in ('outcome', 'prerequisite') and node['stage'] in ('design', 'build', 'deploy'), 'invalid work kind/stage')
        require(all(api.text(node[k]) for k in ('task_id', 'task_ref', 'outcome', 'omission_impact')), 'work needs necessity, result and canonical task')
        linked = strings(node['requirement_ids'], 'work requirements')
        require(linked <= requirements.keys(), 'optional or unknown work requirement')
        ac = strings(node['criterion_ids'], 'work criteria', empty=node['stage'] == 'design')
        require(ac <= set().union(*(set(requirements[r]['criterion_ids']) for r in linked)), 'work criteria outside original requirements')
        strings(node['depends_on'], 'work dependencies', empty=True)
        coverage |= linked
        if node['kind'] == 'outcome':
            outcome_criteria |= ac
        nodes[node['id']] = node
    require(coverage == requirements.keys(), 'work inventory dropped required outcome')
    require(outcome_criteria == criteria.keys(), 'business criteria lack outcome work; prerequisites cannot replace outcomes')
    # Definition excludes admission/observations so approvals cannot authorize a
    # changed task by merely retaining its ID. Reference hashes still need trust.
    definitions = {key: digest({k: v for k, v in node.items() if k != 'admission_ref'}) for key, node in nodes.items()}
    visiting, visited = set(), set()
    def visit(key):
        require(key in nodes, 'unknown work dependency')
        require(key not in visiting, 'cyclic work dependency')
        if key in visited:
            return
        visiting.add(key)
        for other in nodes[key]['depends_on']:
            visit(other)
        visiting.remove(key); visited.add(key)
    for key in nodes:
        visit(key)
    scoped, decision_impact = set(), {}
    require(isinstance(record['decision_scopes'], list), 'decision scopes missing')
    for scope in record['decision_scopes']:
        fields(scope, ('decision_id', 'work_ids', 'reason'))
        key = scope['decision_id']
        require(key not in scoped and key in {d['id'] for d in decisions}, 'unknown/duplicate decision scope')
        impacted = strings(scope['work_ids'], 'decision impact')
        require(impacted <= nodes.keys() and api.text(scope['reason']), 'invalid decision impact')
        scoped.add(key); decision_impact[key] = impacted
    require(scoped == {d['id'] for d in decisions}, 'decision impact missing; cannot assume independence')
    observations = {}
    require(isinstance(record['observations'], list), 'work observations missing')
    for observed in record['observations']:
        fields(observed, ('work_id', 'state', 'candidate_ref', 'return_ref', 'readback_ref', 'blocker', 'attempts_without_progress'), ('recovery_ref',))
        key = observed['work_id']
        require(key in nodes and key not in observations, 'unknown/duplicate work observation')
        require(observed['state'] in ('pending', 'active', 'suspended', 'completed', 'returned', 'unknown'), 'invalid work state')
        require(type(observed['attempts_without_progress']) is int and observed['attempts_without_progress'] >= 0, 'invalid work attempt budget')
        if observed['state'] in ('active', 'suspended', 'returned', 'unknown', 'completed'):
            require(api.text(observed['candidate_ref']), 'retain existing candidate identity')
        if observed['readback_ref'] is not None:
            asset(root, observed['readback_ref'])
        recovered = False
        if observed.get('recovery_ref') is not None:
            recovery = asset(root, observed['recovery_ref'], True)
            fields(recovery, ('goal_id', 'basis_sha256', 'work_id', 'definition_sha256', 'return_sha256', 'decision', 'evidence_refs'))
            require(observed['return_ref'] is not None and recovery['goal_id'] == goal['goal_id']
                    and recovery['basis_sha256'] == api.basis(goal) and recovery['work_id'] == key
                    and recovery['definition_sha256'] == definitions[key]
                    and recovery['return_sha256'] == observed['return_ref']['sha256']
                    and recovery['decision'] == 'resume', 'recovery not bound to original blocked return')
            require(isinstance(recovery['evidence_refs'], list) and recovery['evidence_refs'], 'recovery needs actual new evidence')
            for ref in recovery['evidence_refs']:
                asset(root, ref)
            recovered = True
        if observed['return_ref'] is not None:
            returned = asset(root, observed['return_ref'], True)
            fields(returned, ('protocol', 'basis_sha256', 'goal_id', 'work_id', 'definition_sha256', 'stage', 'status', 'evidence_refs', 'review_ref'))
            require(returned['protocol'] == 'goal-stage-return-v1' and returned['goal_id'] == goal['goal_id']
                    and returned['basis_sha256'] == api.basis(goal) and returned['work_id'] == key
                    and returned['definition_sha256'] == definitions[key] and returned['stage'] == nodes[key]['stage'], 'stage return binding drift')
            require(returned['status'] in ('completed', 'failed', 'blocked', 'unknown'), 'invalid stage return status')
            require(isinstance(returned['evidence_refs'], list) and returned['evidence_refs'], 'stage result needs raw evidence')
            for ref in returned['evidence_refs']:
                asset(root, ref)
            if returned['review_ref'] is not None:
                asset(root, returned['review_ref'])
            if observed['state'] == 'completed':
                require(returned['status'] == 'completed' and returned['review_ref'] is not None
                        and observed['readback_ref'] is not None, 'completion needs independent review and actual readback')
            require(returned['status'] != 'unknown' or observed['state'] == 'unknown', 'unknown effects require readback')
            require(returned['status'] not in ('failed', 'blocked') or observed['blocker'] is not None or recovered,
                    'failed/blocked stage return needs explicit recovery blocker')
        else:
            require(observed['state'] not in ('completed', 'returned'), 'stage result missing')
        block = observed['blocker']
        if block is not None:
            fields(block, ('owner', 'recovery_action', 'evidence_ref'))
            require(api.text(block['owner']) and api.text(block['recovery_action']), 'unprepared blocker')
            asset(root, block['evidence_ref'])
        observations[key] = observed
    require(observations.keys() == nodes.keys(), 'work observation denominator mismatch')
    require(goal['budget']['attempts_without_progress'] <= max(o['attempts_without_progress'] for o in observations.values()),
            'cumulative stall budget lost during work decomposition')
    for key, item in observations.items():
        if item['state'] == 'completed':
            require(all(observations[d]['state'] == 'completed' for d in nodes[key]['depends_on']), 'completed work has unfinished dependency')
    active = [key for key, item in observations.items() if item['state'] == 'active']
    require(len(active) <= 1, 'more than one active implementation candidate')
    admissions = set()
    boundaries = {'reviewed_design': 0, 'integrated_main': 1, 'deployed': 2, 'operational': 3}
    stage_levels = {'design': 0, 'build': 1, 'deploy': 2}
    for key, node in nodes.items():
        if node['admission_ref'] is None:
            require(observations[key]['state'] == 'pending', 'work executed without bound admission')
            continue
        admission = asset(root, node['admission_ref'], True)
        require(stage_levels[node['stage']] <= boundaries[goal['requested_boundary']], 'stage exceeds parent completion boundary')
        fields(admission, ('goal_id', 'basis_sha256', 'work_id', 'definition_sha256', 'decision',
                           'stage_intake_ref', 'authority_ref', 'review_ref'))
        require(admission['goal_id'] == goal['goal_id'] and admission['basis_sha256'] == api.basis(goal)
                and admission['work_id'] == key and admission['definition_sha256'] == definitions[key]
                and admission['decision'] == 'approved', 'work admission binding drift')
        for name in ('stage_intake_ref', 'authority_ref', 'review_ref'):
            asset(root, admission[name])
        intake = asset(root, admission['stage_intake_ref'], True)
        require(isinstance(intake, dict) and intake.get('task_id') == node['task_id'], 'admission references another stage task')
        contract = intake.get('contract', {})
        require(isinstance(contract, dict) and contract.get('completion_boundary') in boundaries
                and boundaries[contract['completion_boundary']] <= boundaries[goal['requested_boundary']], 'stage intake exceeds parent completion boundary')
        if node['stage'] != 'design':
            require(set(node['requirement_ids']) <= strings(contract.get('requirement_ids'), 'stage requirements')
                    and set(node['criterion_ids']) <= strings(contract.get('acceptance_ids'), 'stage acceptance'), 'stage intake lost original acceptance')
        admissions.add(key)
    blocked = {key: [] for key in nodes}
    for decision in pending:
        for key in decision_impact[decision]:
            blocked[key].append('decision:'+decision)
    for key, item in observations.items():
        if stage_levels[nodes[key]['stage']] > boundaries[goal['requested_boundary']]:
            blocked[key].append('outside_parent_completion_boundary')
        if item['state'] == 'active' and any(observations[d]['state'] != 'completed' for d in nodes[key]['depends_on']):
            blocked[key].append('unfinished_dependency')
        if item['blocker'] is not None:
            blocked[key].append('resource_or_validation')
        if item['attempts_without_progress'] >= goal['budget']['max_without_progress']:
            blocked[key].append('stall')
    # Only descendants inherit a blocker; a whole-goal pause needs actual scope.
    changed = True
    while changed:
        changed = False
        for key, node in nodes.items():
            for dep in node['depends_on']:
                if blocked[dep] and 'dependency:'+dep not in blocked[key]:
                    blocked[key].append('dependency:'+dep); changed = True
    proven = set()
    require(isinstance(record['business_proofs'], list), 'business proofs missing')
    for proof in record['business_proofs']:
        fields(proof, ('criterion_id', 'work_id', 'result', 'baseline_sha', 'environment', 'evidence_ref', 'review_ref'))
        ac, key = proof['criterion_id'], proof['work_id']
        require(ac in criteria and ac not in proven and key in nodes and nodes[key]['kind'] == 'outcome'
                and ac in nodes[key]['criterion_ids'], 'prerequisite/duplicate/foreign business proof')
        require(proof['result'] == 'PROVEN' and proof['baseline_sha'] == goal['baseline_sha']
                and proof['environment'] == criteria[ac]['environment'] and observations[key]['state'] == 'completed'
                and not blocked[key], 'business proof not current or work incomplete/blocked')
        asset(root, proof['evidence_ref']); asset(root, proof['review_ref']); proven.add(ac)
    event = record['last_event']
    reconciled = event is None
    if event is not None:
        fields(event, ('kind', 'record_ref'))
        require(event['kind'] in ('stage_return', 'merge', 'feedback', 'resume'), 'invalid reconciliation event')
        asset(root, event['record_ref'])
        if record['reconciliation_ref'] is not None:
            reconciliation = asset(root, record['reconciliation_ref'], True)
            fields(reconciliation, ('goal_id', 'event_sha256', 'observation_sha256', 'definition_sha256', 'readback_ref'))
            asset(root, reconciliation['readback_ref'])
            reconciled = (reconciliation['goal_id'] == goal['goal_id'] and reconciliation['event_sha256'] == event['record_ref']['sha256']
                          and reconciliation['definition_sha256'] == digest(definitions)
                          and reconciliation['observation_sha256'] == digest({'observations': record['observations'], 'proofs': record['business_proofs'], 'pending': sorted(pending)}))
    require(event is not None or all(o['state'] == 'pending' for o in observations.values()), 'stage progress must return to Goal reconciliation')
    progress = {'required_criteria': sorted(criteria), 'business_proven': sorted(proven),
                'business_unproven': sorted(criteria.keys()-proven),
                'prerequisites_satisfied': [k for k, n in nodes.items() if n['kind'] == 'prerequisite' and observations[k]['state'] == 'completed' and not blocked[k]],
                'pending_decisions': sorted(pending)}
    ready = [key for key, node in nodes.items() if not blocked[key] and observations[key]['state'] in ('pending', 'suspended')
             and all(observations[d]['state'] == 'completed' for d in node['depends_on'])]
    result = {'owner': 'goal', 'progress': progress, 'blocked_work': {k: v for k, v in blocked.items() if v},
              'ready_work': ready, 'goal_complete': False, 'definition_sha256': definitions,
              'requires_stage_validation': True}
    unknown = [key for key, item in observations.items() if item['state'] == 'unknown']
    returned = [key for key, item in observations.items() if item['state'] == 'returned']
    if unknown:
        action, selected = 'READBACK_STAGE_RESULT', unknown[0]
    elif not reconciled or returned:
        action, selected = 'RECONCILE_GOAL', returned[0] if returned else None
    elif active:
        selected = active[0]
        action = 'SUSPEND_WORK_ITEM' if blocked[selected] else 'RESUME_STAGE'
    elif ready:
        selected = next((key for key in ready if key in admissions), ready[0])
        action = 'RESUME_STAGE' if observations[selected]['state'] == 'suspended' else 'ROUTE_STAGE' if selected in admissions else 'ADMIT_WORK_ITEM'
    elif all(o['state'] == 'completed' for o in observations.values()) and proven == criteria.keys() and not pending and not any(blocked.values()):
        action, selected = 'REVIEW_GOAL_CLOSURE', None
    elif not pending and any(o['state'] == 'completed' and nodes[k]['kind'] == 'outcome' and not blocked[k] for k, o in observations.items()) and criteria.keys()-proven:
        action, selected = 'VERIFY_BUSINESS_OUTCOME', None
    else:
        action, selected = 'HUMAN_DECISION' if pending else 'RESOLVE_BLOCKERS', None
    result.update(next_action=action, selected_work=selected,
                  role=nodes[selected]['stage'] if selected and action in ('ROUTE_STAGE', 'RESUME_STAGE') else 'goal')
    if selected:
        result['task_ref'] = nodes[selected]['task_ref']
        result['task_id'] = nodes[selected]['task_id']
        result['admission_ref'] = nodes[selected]['admission_ref']
    return result
