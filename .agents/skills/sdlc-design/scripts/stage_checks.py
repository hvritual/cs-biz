"""Design-only semantic bindings. External approval authenticity remains unverified."""
from pathlib import Path
import runpy
from artifact_io import asset, read_json, relative, require


def check(workflow, step, data, intake, task, completed):
    if data['status'] != 'ready':
        return
    if step['id'] == 'capture':
        require(data['assets']['raw'] == intake['assets']['raw'], 'raw intent was replaced')
    if step['id'] == 'acceptance':
        from check_workflow import schema_check
        root = Path(__file__).resolve().parents[1]
        schema_check(read_json(relative(root, 'contracts/handoff.json'))['properties']['contract'], data['contract'])
        record = read_json(asset(task, data['assets']['acceptance']))
        require(record.get('acceptance_ids') == data['contract']['acceptance_ids'], 'acceptance index differs from frozen criteria')
        require(record.get('review_ref') == data['payload']['review_ref'], 'acceptance review binding mismatch')
    if 'acceptance' in completed:
        require(data['contract'] == completed['acceptance']['contract'], 'approved acceptance changed after freeze')
    if step['id'] != 'handoff':
        return
    require(data['payload']['design_protocol'] == 'intent-design-v2', 'current design handoff protocol required')
    if intake['contract']['frontend_change']:
        require({'ux_analysis','preview_evidence','journey','flow'} <= data['assets'].keys(), 'UI design lacks journey/preview/UX evidence')
    if intake['contract']['mode'] == 'example':
        return
    root = Path(__file__).resolve().parents[1]
    validator = runpy.run_path(str(root / 'scripts/check_design_workflow.py'))
    packet = asset(task, data['assets']['design_packet'])
    require(packet.name == 'design-loop.json', 'Design packet must bind the actual design-loop.json')
    repo = next((p for p in task.parents if (p / 'AGENTS.md').is_file()), Path.cwd())
    legacy = validator['check'](packet.parent, repo)
    require(legacy['task_ref'] == data['payload']['design_task_ref'] and
            legacy['revision'] == data['payload']['design_revision'], 'Design packet task/revision drift')
    for role in ('raw', 'intent'):
        require(legacy[role]['sha256'] == data['assets'][role]['sha256'], 'Design packet source drift: ' + role)
    for role in ('solution', 'requirements', 'design'):
        require(legacy['artifacts'][role + '.md'] == data['assets'][role]['sha256'], 'Design packet artifact drift: ' + role)
    require(legacy['handoff']['acceptance_ids'] == data['contract']['acceptance_ids'], 'Design v2 acceptance was dropped/added')
    require(legacy['frontend_change'] == data['contract']['frontend_change'], 'UI classification drift')
    require(legacy['handoff']['allowed_paths'] == data['contract']['allowed_paths'] and
            legacy['handoff']['forbidden_paths'] == data['contract']['forbidden_paths'], 'Design v2 scope drift')
    if data['contract']['frontend_change']:
        require({'journey', 'flow', 'ux_analysis', 'preview_evidence'} <= data['assets'].keys(), 'incoming UI evidence roles missing')
        for role, filename in (('journey','journey.md'), ('flow','flow.mmd'), ('ux_analysis','ux-analysis.yaml')):
            require(legacy['artifacts'][filename] == data['assets'][role]['sha256'], 'UI artifact drift: ' + role)
        require(legacy['preview']['browser_evidence']['sha256'] == data['assets']['preview_evidence']['sha256'], 'Preview evidence drift')
    require(legacy['review']['record_ref'] == data['payload']['design_review_ref'], 'Design review source mismatch')
    require(legacy['handoff']['execution_authority_ref'] == data['payload']['execution_authority_ref'], 'Design execution authority drift')
    require({row['requirement_id'] for row in legacy['trace']} == set(data['contract']['requirement_ids']), 'Design v2 requirements drift')
