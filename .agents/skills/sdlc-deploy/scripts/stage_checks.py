"""Deploy-only release identity and outcome bindings, never deployment execution."""
from pathlib import Path
from artifact_io import asset, read_json, relative, require
from release_checks import check_release


def check(workflow, step, data, intake, task, completed):
    from check_workflow import schema_check
    root = Path(__file__).resolve().parents[1]
    request = read_json(relative(task, 'deploy-request.json'))
    schema_check(read_json(relative(root, 'contracts/deploy-request.json')), request)
    check_release(task, intake)
    require(request['expected_main_sha'] == intake['payload']['main_sha'] and
            request['expected_package_sha256'] == intake['assets']['package']['sha256'], 'deployment request targets another release')
    if data['status'] != 'ready':
        return
    require(data['payload']['environment'] == request['environment'], 'target environment drift')
    require(request['deployment_authority_ref'].strip().lower() not in {'none','unknown','tbd'}, 'separate deployment authority missing')
    if step['id'] == 'admit':
        require(data['payload']['deployment_authority_ref'] == request['deployment_authority_ref'], 'deployment authority binding mismatch')
    if step['id'] in {'execute','observe','recover'}:
        require(data['payload']['operation_id'] == completed['plan']['payload']['operation_id'], 'operation identity changed from durable release plan')
    if step['id'] == 'plan':
        plan = read_json(asset(task, data['assets']['release_plan']))
        require(data['payload']['operation_id'] == plan.get('operation_id'), 'operation identity not persisted in plan evidence')
        require(data['payload']['plan_ref'] == data['assets']['release_plan']['path'], 'release plan reference mismatch')
    if step['id'] == 'observe' and data['payload']['outcome'] == 'healthy':
        require(data['payload']['observed_revision'] == intake['payload']['main_sha'] and
                data['payload']['package_sha256'] == intake['assets']['package']['sha256'], 'smoke observed a different release')
    if step['id'] == 'recover' and data['payload']['outcome'] == 'rolled_back':
        require(request['rollback_authority_ref'].strip().lower() not in {'none','unknown','tbd'}, 'rollback lacks separate authority')
        plan = read_json(asset(task, completed['plan']['assets']['release_plan']))
        require(data['payload']['observed_revision'] == plan.get('rollback_revision') and
                data['payload']['package_sha256'] == plan.get('rollback_package_sha256'), 'rollback did not observe planned prior release')
    if step['id'] != 'handoff':
        return
    require(all(data['assets'].get('upstream.' + k) == v for k,v in intake['assets'].items()), 'Build assets removed/replaced')
    observation = completed['recover'] if completed['recover']['status'] == 'ready' else completed['observe']
    observed = observation['payload']
    expected = 'deployed' if observed['outcome'] == 'healthy' else observed['outcome']
    require(data['payload']['outcome'] == expected, 'receipt overstates the observed deployment outcome')
    require(data['payload']['observed_revision'] == observed['observed_revision'] and
            data['payload']['package_sha256'] == observed['package_sha256'], 'receipt release identity differs from observation')
    if data['payload']['outcome'] == 'deployed':
        require(data['payload']['observed_revision'] == intake['payload']['main_sha'] and
                data['payload']['package_sha256'] == intake['assets']['package']['sha256'], 'deployed receipt lacks exact built release')
