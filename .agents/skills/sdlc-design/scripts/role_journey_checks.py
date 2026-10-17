"""Continuous role simulation declarations; never authenticate browser/Human evidence."""
from artifact_io import require


def index(values, name):
    require(isinstance(values, list) and bool(values), 'missing ' + name)
    require(all(isinstance(v, dict) and isinstance(v.get('id'), str) and v['id'].strip()
                for v in values), 'invalid ' + name)
    result = {v['id']: v for v in values}
    require(len(result) == len(values), 'duplicate ' + name)
    return result


def text(value, name):
    require(isinstance(value, str) and bool(value.strip()), 'missing ' + name)


def expand(nodes, roles, tasks, actor, objects, authenticated=False, created=None, recovery_key=None):
    """Expand task references without hiding navigation, identity or object handoffs."""
    actions, bindings, covered, snapshots, actors = [], [], set(), {}, []
    created = set() if created is None else set(created)
    for key, node in index(nodes, 'journey walkthrough').items():
        require(node.get('actor_id') == actor, 'journey role continuity broken at ' + key)
        consumes, produces = node.get('consumes', []), node.get('produces', [])
        require(isinstance(consumes, list) and set(consumes) <= objects,
                'journey object continuity broken at ' + key)
        require(isinstance(produces, list) and all(isinstance(v, str) and v.strip() for v in produces)
                and len(set(produces)) == len(produces) and not set(produces) & objects,
                'journey object must be produced once at ' + key)
        kind = node.get('kind')
        before, acting = len(actions), actor
        authenticates = kind == 'user_action' and node.get('purpose') == 'authenticate'
        require(kind == 'task_path' or authenticated or authenticates or node.get('purpose') in {'identity_input','public_entry'},
                'role must authenticate at normal entry or after handoff')
        if authenticates:
            authenticated = True
        if kind == 'task_path':
            task_id = node.get('task_id')
            require(task_id in tasks and task_id in roles[actor].get('task_ids', []),
                    'journey task is outside declared role')
            paths = tasks[task_id]['paths'] if node.get('path_kind') == 'normal' else tasks[task_id]['recovery']
            require(node.get('path_kind') in {'normal', 'recovery'}, 'invalid journey path kind')
            path = next((v for v in paths if v['id'] == node.get('path_id')), None)
            require(path is not None, 'journey references unknown task path')
            require(path.get('access') in {'public', 'authenticated'} and isinstance(path.get('authenticates'), bool),
                    'path identity contract missing')
            require(authenticated or path['access'] == 'public', 'role must authenticate before this task path')
            if path['authenticates']:
                authenticated = True
            require(path.get('session_after') in {'preserve', 'authenticated', 'signed_out'}, 'path session transition missing')
            if path['session_after'] == 'signed_out':
                authenticated = False
            binding = path.get('object_mode')
            require(binding in {'produce', 'consume', 'none'}, 'invalid path object contract')
            require(binding != 'produce' or bool(produces), 'task must produce its original business object')
            require(binding != 'consume' or bool(consumes), 'task must consume its original business object')
            if binding != 'none':
                require(node.get('result_key') in (produces if binding == 'produce' else consumes),
                        'task result key must bind its actual business object')
            if node['path_kind'] == 'recovery' and binding == 'consume':
                require(recovery_key is not None and node.get('result_key') == recovery_key,
                        'recovery must retain the triggering original business object')
            actions.extend(key + '.' + v['id'] for v in path['steps'])
            covered.add((task_id, node['path_kind'], node['path_id']))
        else:
            require(kind in {'user_action', 'handoff'}, 'invalid journey action kind')
            text(node.get('action'), 'journey action')
            text(node.get('visible_result'), 'journey visible result')
            actions.append(key)
            if kind == 'handoff':
                require(bool(consumes), 'handoff needs the original business object')
                require(bool(set(consumes) & created), 'handoff cannot substitute a seeded business object')
                require(node.get('to_role_id') in roles and node['to_role_id'] != actor,
                        'invalid journey role handoff')
                text(node.get('channel'), 'handoff channel')
                actor = node['to_role_id']
                authenticated = False
        actors.extend((step, acting) for step in actions[before:])
        for name in consumes + produces:
            bindings.append((key, name))
        objects = objects | set(produces)
        created |= set(produces)
        snapshots[key] = (actor, set(objects), list(actions), list(bindings), list(actors), authenticated, set(created))
    require(node['kind'] != 'handoff', 'journey cannot stop before the receiving role acts')
    return actions, bindings, covered, snapshots, actors


def journey_plan(plan, tasks):
    roles = index(plan.get('roles'), 'review roles')
    for role in roles.values():
        for key in ('label', 'account_context', 'tenant_scope'):
            text(role.get(key), 'role.' + key)
        require(isinstance(role.get('navigation'), list) and bool(role['navigation']), 'role navigation missing')
        require(isinstance(role.get('task_ids'), list) and set(role['task_ids']) <= tasks.keys(),
                'role task binding invalid')
    journeys = index(plan.get('journeys'), 'journeys')
    expected, covered, routes = set(), set(), {}
    for task_id, task in tasks.items():
        for path in task['paths'] + task['recovery']:
            require(path.get('object_mode') in {'produce', 'consume', 'none'}, 'path original object contract missing')
            require(path.get('access') in {'public', 'authenticated'} and isinstance(path.get('authenticates'), bool),
                    'path identity contract missing')
            require(path.get('session_after') in {'preserve','authenticated','signed_out'}, 'path session transition missing')
        expected.update((task_id, kind, path['id']) for kind, paths in
                        [('normal', task['paths']), ('recovery', task['recovery'])] for path in paths)
    for journey_id, journey in journeys.items():
        text(journey.get('goal'), 'journey goal')
        text(journey.get('end_result'), 'journey end result')
        entry = journey.get('entry', {})
        require(entry.get('kind') in {'sign_in', 'invitation', 'account_recovery', 'public'},
                'journey must start at a normal product entry')
        require(entry.get('actor_id') in roles, 'journey entry role missing')
        text(entry.get('location'), 'journey entry location')
        setup = journey.get('fixture_setup', {})
        require(setup.get('owner') == 'executor' and setup.get('review_tools_in_user_path') is False
                and setup.get('reset_during_walkthrough') is False,
                'executor setup cannot become Human navigation or reset')
        text(setup.get('preparation'), 'executor preparation')
        text(setup.get('simulation_boundary'), 'simulation boundary')
        objects = journey.get('starting_objects', [])
        require(isinstance(objects, list) and all(isinstance(v, str) and v for v in objects)
                and len(set(objects)) == len(objects), 'invalid starting objects')
        actions, bindings, paths, snapshots, actors = expand(journey.get('walkthrough'), roles, tasks,
                                                    entry['actor_id'], set(objects))
        require(journey.get('action_count') == len(actions), 'journey cumulative action count differs')
        routes[journey_id] = {'main': (actions, bindings, actors)}
        covered |= paths
        branches = journey.get('branches', [])
        require(isinstance(branches, list), 'journey branches required')
        if branches:
            for branch_id, branch in index(branches, 'journey branches').items():
                require(branch_id != 'main' and branch.get('from_step') in snapshots, 'branch entry missing')
                text(branch.get('condition'), 'branch condition')
                text(branch.get('executor_preparation'), 'branch executor preparation')
                text(branch.get('end_result'), 'branch end result')
                actor, current, prefix, prefix_bindings, prefix_actors, auth, created = snapshots[branch['from_step']]
                source = next(node for node in journey['walkthrough'] if node['id'] == branch['from_step'])
                seq, links, paths, _, branch_actors = expand(branch.get('walkthrough'), roles, tasks, actor, current,
                                                            auth, created, source.get('result_key'))
                require(branch.get('action_count') == len(prefix) + len(seq), 'branch cumulative action count differs')
                # Prefix is replayed under the prepared condition, never reached by jumping to the error page.
                routes[journey_id][branch_id] = (prefix + seq, prefix_bindings + links, prefix_actors + branch_actors)
                covered |= paths
        mapping = plan.get('original_journey_coverage', {}).get(journey_id, [])
        # Check all routes of this journey, rather than merely its last branch.
        actual = {node.get('task_id') for node in journey['walkthrough'] if node['kind'] == 'task_path'} | {
            node.get('task_id') for branch in branches for node in branch['walkthrough'] if node['kind'] == 'task_path'}
        require(set(mapping) <= actual, 'original journey task coverage missing')
    original = plan.get('original_journey_coverage', {})
    require(bool(original) and set(original) == journeys.keys(), 'original journeys missing')
    require(covered == expected, 'journey task path coverage differs from the full denominator')
    require({role for routes_for_journey in routes.values() for route in routes_for_journey.values()
             for _, role in route[2]} == roles.keys(), 'declared role has no complete journey')
    return journeys, routes


def journey_delivery(plan, tasks, delivery, record):
    journeys, routes = journey_plan(plan, tasks)
    runs = index(delivery['observation'].get('journey_runs'), 'observed journey runs')
    require(runs.keys() == journeys.keys(), 'observed journey coverage differs')
    for key, journey in journeys.items():
        run = runs[key]
        require(run.get('result') == 'pass', 'continuous journey failed')
        observed = index(run.get('walkthrough_runs'), 'observed walkthroughs')
        require(observed.keys() == routes[key].keys(), 'required journey branch unobserved')
        for route_id, (actions, links, actors) in routes[key].items():
            row = observed[route_id]
            require(row.get('result') == 'pass' and row.get('steps') == actions
                    and row.get('action_count') == len(actions), 'observed continuous actions differ')
            require(row.get('review_tools_used') is False and row.get('reset_used') is False,
                    'observed journey used executor controls')
            record(row.get('record_ref'))
            require(row.get('actors') == [{'step_id': step, 'role_id': role} for step, role in actors],
                    'observed role continuity differs')
            sessions = index(row.get('role_sessions'), 'observed role sessions')
            require(set(sessions) == {role for _, role in actors}, 'observed role session coverage differs')
            for session in sessions.values():
                for name in ('account_id', 'tenant_scope'):
                    text(session.get(name), 'observed role ' + name)
                record(session.get('record_ref'))
            bindings = row.get('object_bindings', [])
            require(isinstance(bindings, list) and [(v.get('step_id'), v.get('object_key')) for v in bindings] == links,
                    'observed business object links missing')
            values = {}
            for binding in bindings:
                name, value = binding['object_key'], binding.get('value')
                text(value, 'observed business object identity')
                require(name not in values or values[name] == value, 'cross-role business object drift')
                values[name] = value
    handoff = delivery.get('presentation', {})
    require(handoff.get('journey_ids') == list(journeys), 'Human presentation omitted role journeys')
    if delivery['state'] == 'DESIGN_APPROVED':
        reviews = index(delivery['human_review'].get('journey_reviews'), 'Human journey reviews')
        require(reviews.keys() == journeys.keys(), 'Human journey coverage incomplete')
        for key, review in reviews.items():
            used_roles = {role for route in routes[key].values() for _, role in route[2]}
            require(review.get('actor_kind') == 'human' and review.get('decision') == 'approved'
                    and review.get('walkthrough_ids') == list(routes[key])
                    and set(review.get('role_ids', [])) == used_roles, 'Human role simulation incomplete')
            record(review.get('record_ref'))
            target = {'candidate_sha': delivery['candidate_sha'], 'version': delivery['target']['version'],
                      'url': delivery['target']['url'], 'plan_ref': delivery['plan_ref']}
            require(all(review.get(name) == value for name, value in target.items()), 'Human journey version drift')
            walkthroughs = index(review.get('walkthrough_reviews'), 'Human walkthrough reviews')
            require(walkthroughs.keys() == routes[key].keys(), 'Human branch review incomplete')
            for route_id, route in routes[key].items():
                row = walkthroughs[route_id]
                role_reviews = index(row.get('role_reviews'), 'Human route role reviews')
                require(set(role_reviews) == {role for _, role in route[2]}, 'Human route role coverage differs')
                for role_id, receipt in role_reviews.items():
                    require(receipt.get('actor_kind') == 'human' and receipt.get('decision') == 'approved'
                            and receipt.get('steps') == [step for step, role in route[2] if role == role_id],
                            'Human actual role walkthrough incomplete')
                    require(all(receipt.get(name) == value for name, value in target.items()), 'Human role version drift')
                    record(receipt.get('record_ref'))
