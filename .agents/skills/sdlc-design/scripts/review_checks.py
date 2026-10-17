"""Read-only Design review consistency checks; never authenticate runtime or approval."""
import re
from urllib.parse import urlsplit

from artifact_io import asset, read_json, require

AVAILABLE = {'REVIEW_AVAILABLE', 'AWAITING_HUMAN_REVIEW', 'DESIGN_APPROVED'}
STATES = AVAILABLE | {'CONTENT_COMPLETE', 'DELIVERY_BLOCKED', 'CHANGES_REQUESTED'}


def words(value, name):
    require(isinstance(value, str) and bool(value.strip()), 'missing review field: ' + name)


def mapping(value, name):
    require(isinstance(value, dict), 'review object required: ' + name)
    return value


def rows(value, name):
    require(isinstance(value, list) and bool(value), 'missing review list: ' + name)
    return value


def keyed(value, name):
    entries = rows(value, name)
    require(all(isinstance(v, dict) for v in entries), 'invalid review rows: ' + name)
    ids = [v.get('id') for v in entries]
    require(all(isinstance(v, str) and v.strip() for v in ids) and len(set(ids)) == len(ids),
            'invalid/duplicate review IDs: ' + name)
    return {v['id']: v for v in entries}


def steps(value, name):
    sequence = keyed(value, name)
    require(1 <= len(sequence) <= 4, 'user task exceeds four steps: ' + name)
    for step in sequence.values():
        words(step.get('action'), name + '.action')
        words(step.get('visible_result'), name + '.visible_result')
    return list(sequence)


def record(task, value):
    require(isinstance(value, dict) and set(value) == {'path', 'sha256'},
            'hashed review record required')
    return asset(task, value)


def reviewer(task, value):
    require(isinstance(value, dict), 'independent review missing')
    for key in ('reviewer', 'implementer'):
        words(value.get(key), key)
    require(value['reviewer'] != value['implementer'], 'reviewer must differ from implementer')
    require(value.get('decision') == 'pass', 'independent review has unresolved findings')
    record(task, value.get('record_ref'))


def plan_check(task, plan, raw_ref, expected_ids=None):
    require(plan.get('protocol') == 'design-review-plan-v1', 'review plan protocol required')
    require(plan.get('raw_ref') == raw_ref, 'review plan replaced original intent')
    record(task, plan['raw_ref'])
    ids = rows(plan.get('requirement_ids'), 'requirement_ids')
    require(all(isinstance(v, str) and v.strip() for v in ids) and len(set(ids)) == len(ids),
            'invalid/duplicate original requirements')
    if expected_ids is not None:
        require(set(ids) == set(expected_ids), 'review plan changed frozen original requirements')
    tasks = keyed(plan.get('tasks'), 'tasks')
    covered = set()
    for key, item in tasks.items():
        for name in ('actor', 'goal', 'entry_context', 'preconditions'):
            words(item.get(name), key + '.' + name)
        required = rows(item.get('requirement_ids'), key + '.requirement_ids')
        require(all(v in ids for v in required), 'task references unknown requirement')
        covered.update(required)
        paths = keyed(item.get('paths'), key + '.paths')
        for path in paths.values():
            words(path.get('method'), 'entry method')
            steps(path.get('steps'), key + '.' + path['id'])
        recovery_kinds = set()
        for recovery in keyed(item.get('recovery'), key + '.recovery').values():
            words(recovery.get('kind'), 'recovery.kind')
            recovery_kinds.add(recovery['kind'])
            words(recovery.get('condition'), 'recovery.condition')
            steps(recovery.get('steps'), key + '.recovery.' + recovery['id'])
        require({'failed', 'unknown'} <= recovery_kinds, 'failed and unknown recovery paths required')
        language = mapping(item.get('language'), 'language')
        words(language.get('plain_summary'), 'plain_summary')
        for term in rows(language.get('terms'), 'terms'):
            mapping(term, 'term')
            words(term.get('label'), 'user-facing term')
            words(term.get('meaning'), 'plain-language meaning')
        for visual in keyed(language.get('visuals'), 'visuals').values():
            for name in ('purpose', 'caption', 'alt'):
                words(visual.get(name), 'visual.' + name)
        selection = mapping(item.get('selection'), 'selection')
        require(selection.get('mode') in {'none', 'single', 'bulk'}, 'selection mode required')
        if selection['mode'] != 'none':
            for name in ('count_label', 'details_entry', 'scope_label'):
                words(selection.get(name), 'selection.' + name)
        if selection['mode'] == 'bulk':
            require(set(selection.get('methods', [])) == {'filter', 'paste', 'excel'},
                    'bulk selection requires filter, paste and Excel')
            require({v['method'] for v in paths.values()} == {'filter', 'paste', 'excel'}
                    and len(paths) == 3, 'each bulk method needs its own counted path')
            require({'import_error', 'ambiguity'} <= recovery_kinds,
                    'bulk import error and ambiguity recovery paths required')
            for name in ('matching', 'deduplication', 'ambiguity', 'unauthorized', 'import_errors',
                         'final_set', 'no_execution_on_selection'):
                words(selection.get(name), 'bulk.' + name)
        results = mapping(item.get('results'), 'results')
        for name in ('summary_entry', 'total_label', 'details_entry', 'readback', 'failure_action', 'unknown_action'):
            words(results.get(name), 'results.' + name)
        require(set(results.get('states', [])) == {'success', 'failed', 'pending', 'unknown'},
                'result summary must separate success, failed, pending and unknown')
    require(covered == set(ids), 'original requirement missing from user tasks')
    reviewer(task, plan.get('coverage_review'))
    rows(plan.get('review_questions'), 'review_questions')
    for question in plan['review_questions']:
        words(question, 'review question')
    return tasks


def entry_url(value):
    words(value, 'review URL')
    url = urlsplit(value)
    require(url.scheme in {'http', 'https'} and bool(url.hostname)
            and not url.username and not url.password, 'invalid review URL')
    return value


def delivery_check(task, delivery, plan, plan_ref, raw_ref):
    tasks = plan_check(task, plan, raw_ref)
    require(delivery.get('protocol') == 'design-review-delivery-v1', 'review delivery protocol required')
    state = delivery.get('state')
    require(state in STATES, 'unknown Design review state')
    require(delivery.get('plan_ref') == plan_ref, 'review delivery uses another plan')
    record(task, delivery['plan_ref'])
    if state not in AVAILABLE:
        for blocker in rows(delivery.get('blockers'), 'delivery blockers'):
            mapping(blocker, 'blocker')
            for key in ('owner', 'gap', 'next_action'):
                words(blocker.get(key), 'blocker.' + key)
            record(task, blocker.get('evidence_ref'))
        return state
    require(delivery.get('blockers') == [], 'review available with unresolved blockers')
    candidate = delivery.get('candidate_sha')
    require(isinstance(candidate, str) and re.fullmatch('[0-9a-f]{40}', candidate),
            'exact review candidate required')
    target = mapping(delivery.get('target'), 'target')
    url = entry_url(target.get('url'))
    words(target.get('version'), 'deployed/local snapshot version')
    words(target.get('access_instructions'), 'review access instructions')
    observed = mapping(delivery.get('observation'), 'observation')
    require(observed.get('kind') == 'final_entry_browser' and observed.get('result') == 'pass',
            'final review entry browser observation required; CI/offline probe is insufficient')
    require(observed.get('candidate_sha') == candidate and observed.get('url') == url
            and observed.get('version') == target['version'], 'review observation target/version drift')
    for name in ('actor', 'observed_at'):
        words(observed.get(name), name)
    record(task, observed.get('record_ref'))
    runs = keyed(observed.get('task_runs'), 'observed tasks')
    require(runs.keys() == tasks.keys(), 'observed tasks omit/add planned task')
    images = set()
    for key, item in tasks.items():
        run = runs[key]
        require(run.get('result') == 'pass', 'observed user task failed')
        record(task, run.get('record_ref'))
        paths = keyed(run.get('path_runs'), 'observed normal paths')
        expected_paths = {v['id']: v for v in item['paths']}
        require(paths.keys() == expected_paths.keys(), 'observed normal path coverage differs')
        for path_id, path in expected_paths.items():
            row = paths[path_id]
            require(row.get('result') == 'pass'
                    and row.get('steps') == steps(path['steps'], key + '.' + path_id),
                    'observed user actions differ from the four-step task')
            record(task, row.get('record_ref'))
        expected = {v['id']: steps(v['steps'], key + '.' + v['id']) for v in item['recovery']}
        actual = keyed(run.get('recovery_runs'), 'observed recovery')
        require(actual.keys() == expected.keys(), 'observed recovery coverage differs')
        for recovery_id, ids in expected.items():
            row = actual[recovery_id]
            require(row.get('result') == 'pass' and row.get('steps') == ids,
                    'recovery action count/result differs')
            record(task, row.get('record_ref'))
        required = {'plain_language', 'visual_guidance', 'result_summary', 'failure_recovery', 'unknown_readback'}
        if item['selection']['mode'] != 'none':
            required |= {'selected_count', 'selected_details', 'affected_scope'}
        if item['selection']['mode'] == 'bulk':
            required |= {'filter', 'paste', 'excel', 'deduplication', 'ambiguity', 'import_errors', 'scope_guard'}
        require(isinstance(run.get('checks'), dict) and all(run['checks'].get(v) == 'pass' for v in required),
                'user task usability/selection/results checks missing')
        expected_images = {v['id'] for v in item['language']['visuals']}
        visuals = keyed(run.get('visuals'), 'observed visuals')
        require(visuals.keys() == expected_images, 'user guidance image missing')
        for visual in visuals.values():
            image = record(task, visual.get('image_ref'))
            require(image.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.svg'},
                    'visual guidance must reference an image')
            # File extension or a prose record alone is not an image.
            body = image.read_bytes()
            require((body.startswith(b'\x89PNG\r\n\x1a\n') or body.startswith(b'\xff\xd8\xff')
                     or body.startswith(b'RIFF') and body[8:12] == b'WEBP'
                     or b'<svg' in body[:1024]), 'invalid guidance image bytes')
            images.add(visual['image_ref']['path'])
    handoff = mapping(delivery.get('presentation'), 'presentation')
    require(handoff.get('url') == url and handoff.get('candidate_sha') == candidate,
            'Human presentation differs from verified UI')
    require(handoff.get('version') == target['version'], 'Human presentation snapshot version drift')
    require(set(handoff.get('image_paths', [])) >= images, 'Human presentation omitted UI images')
    for name in ('review_sequence', 'decision_questions', 'limitations'):
        for item in rows(handoff.get(name), 'presentation.' + name):
            words(item, 'presentation.' + name)
    require(handoff['decision_questions'] == plan['review_questions'], 'presented questions differ from review plan')
    record(task, handoff.get('record_ref'))
    review = delivery.get('independent_review', {})
    reviewer(task, review)
    require(review.get('candidate_sha') == candidate, 'independent review candidate drift')
    human = mapping(delivery.get('human_review'), 'human_review')
    require(human.get('decision') in {'pending', 'partial', 'changes_requested', 'approved'},
            'Human review state required')
    if state == 'DESIGN_APPROVED':
        require(human.get('decision') == 'approved' and human.get('candidate_sha') == candidate,
                'same-version Human design approval missing')
        require(human.get('version') == target['version'] and human.get('url') == url
                and human.get('plan_ref') == plan_ref, 'Human approval target/plan version drift')
        require(human.get('actor_kind') == 'human', 'actual Human review declaration required')
        for key in ('reviewer', 'reviewed_at'):
            words(human.get(key), 'human_review.' + key)
        record(task, human.get('record_ref'))
    else:
        require(human.get('decision') == 'pending', 'Human decision requires a corresponding Design state')
    return state
