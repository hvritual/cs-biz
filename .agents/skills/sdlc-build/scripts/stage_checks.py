"""Build-only cross-evidence bindings; no external CI/identity authentication."""
from pathlib import Path
import runpy
from artifact_io import asset, read_json, require
from release_checks import check_release


def check(workflow, step, data, intake, task, completed):
    if data['status'] != 'ready':
        return
    if step['id'] == 'admit' and intake['contract']['mode'] == 'real':
        packet = asset(task, intake['assets']['design_packet'])
        require(packet.name == 'design-loop.json', 'Design packet must bind the actual design-loop.json')
        root = Path(__file__).resolve().parents[1]
        validator = runpy.run_path(str(root / 'scripts/check_design_workflow.py'))
        repo = next((p for p in task.parents if (p / 'AGENTS.md').is_file()), Path.cwd())
        design = validator['check'](packet.parent, repo)
        require(design['task_ref'] == intake['payload']['design_task_ref'] and
                design['revision'] == intake['payload']['design_revision'], 'incoming Design task/revision drift')
        for role in ('raw', 'intent'):
            require(design[role]['sha256'] == intake['assets'][role]['sha256'], 'incoming Design source drift: ' + role)
        for role in ('solution', 'requirements', 'design'):
            require(design['artifacts'][role + '.md'] == intake['assets'][role]['sha256'], 'incoming Design artifact drift: ' + role)
        if intake['contract']['frontend_change']:
            require({'journey', 'flow', 'ux_analysis', 'preview_evidence'} <= intake['assets'].keys(), 'incoming UI evidence roles missing')
            for role, filename in (('journey','journey.md'), ('flow','flow.mmd'), ('ux_analysis','ux-analysis.yaml')):
                require(design['artifacts'][filename] == intake['assets'][role]['sha256'], 'UI artifact drift: ' + role)
            require(design['preview']['browser_evidence']['sha256'] == intake['assets']['preview_evidence']['sha256'], 'Preview evidence drift')
        require(design['handoff']['acceptance_ids'] == intake['contract']['acceptance_ids'], 'incoming Design acceptance drift')
        require(design['frontend_change'] == intake['contract']['frontend_change'], 'incoming Design UI classification drift')
        for key in ('allowed_paths', 'forbidden_paths'):
            require(design['handoff'][key] == intake['contract'][key], 'incoming Design scope drift: ' + key)
        require(design['review']['record_ref'] == intake['payload']['design_review_ref'], 'incoming Design review drift')
        require(design['handoff']['execution_authority_ref'] == intake['payload']['execution_authority_ref'], 'incoming Design authority drift')
        require({row['requirement_id'] for row in design['trace']} == set(intake['contract']['requirement_ids']), 'incoming Design requirements drift')
    if step['id'] == 'verify':
        require(data['payload']['acceptance_ids'] == intake['contract']['acceptance_ids'], 'verification omits locked acceptance')
    if step['id'] in {'review','handoff'}:
        review = read_json(asset(task, data['assets']['review']))
        require(review.get('decision') == 'pass' and review.get('reviewer') and
                review.get('implementer') and review['reviewer'] != review['implementer'] and
                review.get('source_ref'), 'missing independent review record (identity not authenticated)')
    if step['id'] not in {'integrate','handoff'}:
        return
    quality = read_json(asset(task, data['assets']['quality']))
    require(quality.get('result') == 'QUALIFIED' and quality.get('HEAD_SHA') == data['payload']['main_sha'] and
            quality.get('REPOSITORY') == intake['contract']['repository'] and
            quality.get('TIER') in {'docs','backend','full'}, 'quality receipt/version/repository mismatch')
    if step['id'] == 'handoff':
        require(all(data['assets'].get('upstream.' + k) == v for k,v in intake['assets'].items()), 'upstream Design assets removed/replaced')
        require(data['payload']['package_sha256'] == data['assets']['package']['sha256'], 'release package digest mismatch')
        require(all(data['payload'][k] == completed['integrate']['payload'][k] for k in ('candidate_sha','main_sha','tree_sha')),
                'handoff changed integrated candidate identity')
        review = read_json(asset(task, data['assets']['review']))
        require(review.get('candidate_sha') == data['payload']['candidate_sha'], 'review is stale for candidate')
        evidence = read_json(asset(task, data['assets']['acceptance_evidence']))
        require(evidence.get('acceptance_ids') == intake['contract']['acceptance_ids'] and
                evidence.get('candidate_sha') == data['payload']['candidate_sha'], 'acceptance evidence stale/incomplete')
        check_release(task, data)
