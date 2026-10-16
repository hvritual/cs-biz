"""Portable release-index relationships, never authentication of external evidence."""
from artifact_io import asset, read_json, require


def check_release(task, data):
    payload, contract, assets = data['payload'], data['contract'], data['assets']
    require({'package', 'quality', 'review', 'acceptance_evidence'} <= assets.keys(),
            'release lacks required Build evidence roles')
    require(not data['blockers'], 'release has unresolved blockers')
    require(payload['package_sha256'] == assets['package']['sha256'], 'release package digest mismatch')
    quality = read_json(asset(task, assets['quality']))
    require(quality.get('result') == 'QUALIFIED' and quality.get('HEAD_SHA') == payload['main_sha']
            and quality.get('REPOSITORY') == contract['repository']
            and quality.get('TIER') in {'docs', 'backend', 'full'}, 'release quality receipt mismatch')
    review = read_json(asset(task, assets['review']))
    require(review.get('decision') == 'pass' and review.get('implementer') and review.get('reviewer')
            and review['implementer'] != review['reviewer'] and review.get('source_ref')
            and review.get('candidate_sha') == payload['candidate_sha'], 'release review missing/self/stale')
    evidence = read_json(asset(task, assets['acceptance_evidence']))
    require(evidence.get('acceptance_ids') == contract['acceptance_ids'] and
            evidence.get('candidate_sha') == payload['candidate_sha'], 'release acceptance evidence stale/incomplete')
    results = evidence.get('results')
    require(isinstance(results, list) and len(results) == len(contract['acceptance_ids']) and
            all(isinstance(row, dict) and row.get('status') == 'pass' and row.get('evidence_ref')
                for row in results) and
            {row.get('acceptance_id') for row in results} == set(contract['acceptance_ids']),
            'release requires passing raw-evidence reference for every frozen acceptance criterion')
