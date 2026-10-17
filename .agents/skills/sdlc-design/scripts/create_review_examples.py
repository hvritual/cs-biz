#!/usr/bin/env python3
"""Generate synthetic review-contract fixtures; never runtime/Human proof."""
import copy
import hashlib
import json
from pathlib import Path


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def ref(root, name):
    return {'path': name, 'sha256': hashlib.sha256((root / name).read_bytes()).hexdigest()}


def role_example(plan, delivery, record):
    """A synthetic continuous route, including entry, navigation and record handoff."""
    plan['roles'] = [
        {'id': 'admin', 'label': '企业管理员', 'account_context': '隔离管理员账号',
         'tenant_scope': '本企业', 'navigation': ['客户', '操作记录'], 'task_ids': ['T1'], 'authentication_task_ids': []},
        {'id': 'support', 'label': '获授权支持', 'account_context': '独立支持账号',
         'tenant_scope': '获授权支持范围', 'navigation': ['诊断'], 'task_ids': [], 'authentication_task_ids': []}]
    for item in plan['tasks'][0]['paths'] + plan['tasks'][0]['recovery']:
        item.update(access='authenticated', authenticates=False, session_after='preserve',
                    object_mode='produce' if item in plan['tasks'][0]['paths'] or item['id'] in {'import-error', 'ambiguity'} else 'consume')
    plan['original_journey_coverage'] = {'J1': ['T1']}
    def path(path_id, kind='normal'):
        creates = kind == 'normal' or path_id in {'import-error', 'ambiguity'}
        return {'id': 'work-' + path_id, 'kind': 'task_path', 'actor_id': 'admin',
                'task_id': 'T1', 'path_kind': kind, 'path_id': path_id,
                'result_key': 'operation',
                **({'produces': ['operation']} if creates else {'consumes': ['operation']})}
    normal = [
        {'id': 'login', 'kind': 'user_action', 'purpose': 'authenticate', 'actor_id': 'admin', 'action': '使用指定组织账号登录', 'visible_result': '进入本企业工作台'},
        {'id': 'navigate', 'kind': 'user_action', 'actor_id': 'admin', 'action': '从业务导航打开客户列表', 'visible_result': '显示当前授权客户'},
        path('filter'),
        {'id': 'handoff', 'kind': 'handoff', 'actor_id': 'admin', 'to_role_id': 'support',
         'channel': '授权支持交接', 'consumes': ['operation'],
         'action': '将原操作编号交给支持', 'visible_result': '支持获得同一原操作编号'},
        {'id': 'support-login', 'kind': 'user_action', 'purpose': 'authenticate', 'actor_id': 'support',
         'action': '支持在独立会话使用指定账号登录', 'visible_result': '进入支持工作台'},
        {'id': 'locate', 'kind': 'user_action', 'actor_id': 'support', 'consumes': ['operation'],
         'action': '按收到的原操作编号查询', 'visible_result': '只读取该原操作的授权结果'}]
    branches = []
    for item in plan['tasks'][0]['paths'][1:] + plan['tasks'][0]['recovery']:
        kind = 'normal' if item in plan['tasks'][0]['paths'] else 'recovery'
        before_submit = item['id'] in {'import-error', 'ambiguity'}
        if before_submit:
            item['object_mode'] = 'produce'
        prefix = 2 if kind == 'normal' or before_submit else 6
        trigger = [{'id': 'trigger-' + item['id'], 'kind': 'user_action', 'actor_id': 'admin',
                    'action': '导入格式错误的文件' if item['id'] == 'import-error' else '粘贴存在同名匹配的客户名称',
                    'visible_result': '显示行级错误或待消歧项，尚未提交操作'}] if before_submit else []
        branches.append({'id': item['id'], 'from_step': 'navigate' if kind == 'normal' or before_submit else 'work-filter',
                         'condition': item.get('condition', '使用另一种批量选取方式'),
                         'executor_preparation': '独立重放前由执行者准备输入或故障，用户不切场景',
                         'walkthrough': trigger + [path(item['id'], kind)], 'action_count': prefix + len(trigger) + len(item['steps']),
                         'end_result': '保留原记录并显示本分支实际结果'})
    plan['journeys'] = [{'id': 'J1', 'goal': '管理员处理客户并将同一原操作交接给支持',
                         'entry': {'kind': 'sign_in', 'location': '/sign-in', 'actor_id': 'admin'},
                         'fixture_setup': {'owner': 'executor', 'preparation': '准备独立管理员与支持会话及授权客户',
                                           'simulation_boundary': 'SYNTHETIC ONLY; no real IAM or backend',
                                           'review_tools_in_user_path': False, 'reset_during_walkthrough': False},
                         'starting_objects': [], 'walkthrough': normal, 'branches': branches,
                         'action_count': 9, 'end_result': '支持查询管理员刚产生的同一原操作'}]
    # Fixture construction is declarative, not execution. The checker independently expands the route.
    def run(route_id, nodes, count):
        actions, bindings, actors = [], [], []
        for node in nodes:
            before = len(actions)
            if node['kind'] == 'task_path':
                paths = plan['tasks'][0]['paths' if node['path_kind'] == 'normal' else 'recovery']
                item = next(v for v in paths if v['id'] == node['path_id'])
                actions.extend(node['id'] + '.' + s['id'] for s in item['steps'])
            else:
                actions.append(node['id'])
            actors.extend({'step_id': step, 'role_id': node['actor_id']} for step in actions[before:])
            bindings.extend({'step_id': node['id'], 'object_key': key, 'value': 'SYNTHETIC-OP-1'}
                            for key in node.get('consumes', []) + node.get('produces', []))
        return {'id': route_id, 'result': 'pass', 'steps': actions, 'action_count': count,
                'review_tools_used': False, 'reset_used': False, 'object_bindings': bindings, 'record_ref': record,
                'actors': actors, 'role_sessions': [{'id': role, 'account_id': 'SYNTHETIC-' + role,
                                                    'tenant_scope': 'SYNTHETIC-tenant', 'record_ref': record}
                                                   for role in dict.fromkeys(v['role_id'] for v in actors)]}
    runs = [run('main', normal, 9)]
    for branch in branches:
        prefix = normal[:2] if branch['from_step'] == 'navigate' else normal[:3]
        runs.append(run(branch['id'], prefix + branch['walkthrough'], branch['action_count']))
    delivery['observation']['journey_runs'] = [{'id': 'J1', 'result': 'pass', 'walkthrough_runs': runs}]
    delivery['presentation']['journey_ids'] = ['J1']


def synthetic_approval(delivery):
    """Explicit synthetic Human receipts for contract tests only, never real approval."""
    context = {key: delivery['target'][key] for key in ('url', 'version')}
    context.update(candidate_sha=delivery['candidate_sha'], plan_ref=delivery['plan_ref'])
    record = delivery['observation']['record_ref']
    reviews = []
    for journey in delivery['observation']['journey_runs']:
        walkthroughs = []
        roles = []
        for run in journey['walkthrough_runs']:
            role_ids = list(dict.fromkeys(v['role_id'] for v in run['actors']))
            roles.extend(role_ids)
            walkthroughs.append({'id': run['id'], 'role_reviews': [
                {'id': role, 'actor_kind': 'human', 'decision': 'approved', **context, 'record_ref': record,
                 'steps': [v['step_id'] for v in run['actors'] if v['role_id'] == role]} for role in role_ids]})
        reviews.append({'id': journey['id'], **context, 'actor_kind': 'human', 'decision': 'approved',
                        'role_ids': list(dict.fromkeys(roles)), 'walkthrough_ids': [r['id'] for r in journey['walkthrough_runs']],
                        'walkthrough_reviews': walkthroughs, 'record_ref': record})
    return {'decision': 'approved', **context, 'record_ref': record, 'actor_kind': 'human',
            'reviewer_role': 'requirement_originator',
            'reviewer': 'synthetic-human', 'reviewed_at': '2026-10-17T00:00:00Z', 'journey_reviews': reviews}


def review_assets(task, raw_ref, candidate='a' * 40):
    """Only synthetic declarations, used by examples and temporary negative tests."""
    folder = task / 'review-fixture'
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'record.txt').write_text('SYNTHETIC ONLY. No browser, message delivery or approval occurred.\n', encoding='utf-8', newline='\n')
    (folder / 'experience-flow.txt').write_text(
        '目标：调整客户负责人并查看结果。\n入口：登录后进入客户。\n'
        '1. 选取客户。\n2. 选择新的负责人并核对范围。\n3. 确认调整，查看逐项结果。\n'
        '需要支持时，将本次操作编号交给支持；支持登录后查询该编号。\n',
        encoding='utf-8', newline='\n')
    (folder / 'guide.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="80">'
                                    '<text x="10" y="40">Example: select - confirm - results</text></svg>\n', encoding='utf-8', newline='\n')
    record = ref(task, 'review-fixture/record.txt')
    coverage = {'implementer': 'example-author', 'reviewer': 'example-reviewer',
                'decision': 'pass', 'record_ref': record}
    task_item = {
        'id': 'T1', 'requirement_ids': ['R1'], 'actor': '企业管理员',
        'goal': '批量调整所选客户的负责人，并查看每个客户的结果',
        'entry_context': '当前企业客户列表', 'preconditions': '已有本企业有效会话及必要权限；不含首次登录任务',
        'steps': [
            {'id': 'select', 'action': '粘贴客户编号', 'visible_result': '自动匹配后显示唯一选中数量及查看已选入口'},
            {'id': 'owner', 'action': '选择新的负责人', 'visible_result': '显示当前负责人、新负责人及本次影响范围'},
            {'id': 'confirm', 'action': '核对影响并确认负责人调整', 'visible_result': '保存原操作编号；本页自动更新进度、各类结果数量及逐项结果'}],
        'recovery': [
            {'id': 'failed', 'kind': 'failed', 'condition': '一项失败，其余已成功', 'steps': [
                {'id': 'details', 'action': '打开失败明细', 'visible_result': '显示失败原因及需修改的内容'},
                {'id': 'repair', 'action': '修改该失败项的无效值', 'visible_result': '仅该失败项进入待确认集合'},
                {'id': 'retry', 'action': '核对后确认仅处理失败项', 'visible_result': '按实际合同安全提交，已成功项保持原结果'},
                {'id': 'readback', 'action': '查看更新结果', 'visible_result': '显示该项的真实结果'}]},
            {'id': 'unknown', 'kind': 'unknown', 'condition': '提交后回复丢失', 'steps': [
                {'id': 'original', 'action': '查询原操作', 'visible_result': '读回原结果，不重新执行'}]},
            {'id': 'import-error', 'kind': 'import_error', 'condition': 'Excel格式错误，尚未选取', 'steps': [
                {'id': 'errors', 'action': '查看错误明细', 'visible_result': '显示行列与正确格式'},
                {'id': 'replace', 'action': '拖入已修正的Excel文件', 'visible_result': '重新校验并显示选中集合，不执行业务操作'},
                {'id': 'owner', 'action': '选择新的负责人', 'visible_result': '显示当前负责人、新负责人及影响范围'},
                {'id': 'confirm', 'action': '核对影响并确认调整', 'visible_result': '本页自动更新原操作进度与逐项结果'}]},
            {'id': 'ambiguity', 'kind': 'ambiguity', 'condition': '一个名称对应多个可授权客户', 'steps': [
                {'id': 'resolve', 'action': '在歧义项中选择明确客户', 'visible_result': '只将该明确编号纳入待确认集合'},
                {'id': 'owner', 'action': '选择新的负责人', 'visible_result': '显示当前负责人、新负责人及影响范围'},
                {'id': 'confirm', 'action': '核对影响并确认调整', 'visible_result': '本页自动更新原操作进度与逐项结果'}]}],
        'language': {'plain_summary': '先选客户，核对调整范围，再查看每项结果。',
                     'terms': [{'label': '待核实', 'meaning': '暂未确认最终结果，请先查询原操作。'}],
                     'visuals': [{'id': 'guide', 'purpose': '帮助理解选取、确认与结果的位置',
                                  'caption': '选取后可查看已选客户；确认后查看本次结果。',
                                  'alt': '选取、确认、结果三个位置的示意图'}]},
        'selection': {'mode': 'bulk', 'methods': ['filter', 'paste', 'excel'],
                      'count_label': '已选客户数量', 'details_entry': '查看已选客户', 'scope_label': '当前企业及可调整客户',
                      'matching': '按当前企业内编号精确匹配', 'deduplication': '同编号仅保留一项',
                      'ambiguity': '同名项逐项选择或排除', 'unauthorized': '不可授权项排除且不泄露跨企业对象',
                      'import_errors': '显示Excel列映射、逐行错误和文本编号；修正后重新校验',
                      'final_set': '提交固定已核对的编号集合，筛选改变不扩大集合',
                      'no_execution_on_selection': '选取、粘贴及导入仅建立选定集，不提交调整'},
        'results': {'summary_entry': '本次调整结果', 'total_label': '本次受影响客户总数', 'details_entry': '逐项结果',
                    'states': ['success', 'failed', 'pending', 'unknown'],
                    'readback': '按原操作编号查询权威结果',
                    'failure_action': '按原因修正，仅在合同允许时重试失败项',
                    'unknown_action': '先查询原操作，禁止重发整批'}}
    normal = task_item.pop('steps')
    task_item['paths'] = []
    entry_actions = {'filter': ('输入客户筛选条件', '自动筛选，只展示匹配的客户，不自动选取'),
                     'paste': ('粘贴客户编号', '自动匹配并显示唯一选中数量及已选入口'),
                     'excel': ('拖入标准模板的Excel文件', '自动解析匹配并显示唯一选中数量及已选入口')}
    for method, (action, result) in entry_actions.items():
        sequence = copy.deepcopy(normal)
        sequence[0].update(action=action, visible_result=result)
        if method == 'filter':
            sequence.insert(1, {'id': 'select-results', 'action': '选取当前匹配结果',
                                'visible_result': '固定当前明确范围的集合，显示唯一选中数量及已选入口'})
        task_item['paths'].append({'id': method, 'method': method, 'steps': sequence})
    plan = {'protocol': 'design-review-plan-v2', 'raw_ref': raw_ref, 'requirement_ids': ['R1'],
            'experience': {'audience': 'requirement_originator', 'interface': 'released_product',
                           'guidance_location': 'outside_product',
                           'guide_ref': ref(task, 'review-fixture/experience-flow.txt')},
            'tasks': [task_item], 'coverage_review': coverage,
            'review_questions': ['选取、影响核对和失败处理是否符合实际工作？']}
    write(task / 'review-plan.json', plan)
    checks = {name: 'pass' for name in ('plain_language', 'visual_guidance', 'result_summary', 'failure_recovery',
              'unknown_readback', 'selected_count', 'selected_details', 'affected_scope', 'filter', 'paste',
              'excel', 'deduplication', 'ambiguity', 'import_errors', 'scope_guard')}
    url = 'https://review.example.invalid/task'
    delivery = {'protocol': 'design-review-delivery-v2', 'state': 'AWAITING_HUMAN_REVIEW',
                'plan_ref': ref(task, 'review-plan.json'), 'candidate_sha': candidate,
                'target': {'url': url, 'version': 'synthetic-snapshot', 'access_instructions': 'SYNTHETIC ONLY; not an accessible UI'},
                'observation': {'kind': 'final_entry_browser', 'result': 'pass', 'url': url,
                                'experience_ui': {'product_interface': True, 'review_chrome_visible': False,
                                                  'engineering_copy_visible': False},
                                'version': 'synthetic-snapshot', 'candidate_sha': candidate,
                                'actor': 'synthetic-only', 'observed_at': '2026-10-17T00:00:00Z', 'record_ref': record,
                                'task_runs': [{'id': 'T1', 'result': 'pass', 'record_ref': record,
                                               'path_runs': [{'id': v['id'], 'result': 'pass', 'record_ref': record,
                                                              'steps': [s['id'] for s in v['steps']]} for v in task_item['paths']],
                                               'checks': checks,
                                               'recovery_runs': [{'id': v['id'], 'result': 'pass', 'record_ref': record,
                                                                  'steps': [s['id'] for s in v['steps']]} for v in task_item['recovery']],
                                               'visuals': [{'id': 'guide', 'image_ref': ref(task, 'review-fixture/guide.svg')}]}]},
                'presentation': {'url': url, 'candidate_sha': candidate, 'version': 'synthetic-snapshot', 'record_ref': record,
                                 'experience_guide_ref': plan['experience']['guide_ref'],
                                 'image_paths': ['review-fixture/guide.svg'], 'review_sequence': ['选取→核对→结果'],
                                 'decision_questions': plan['review_questions'], 'limitations': ['Synthetic example only; no actual execution.']},
                'independent_review': {**coverage, 'candidate_sha': candidate},
                'human_review': {'decision': 'pending', 'candidate_sha': None, 'record_ref': None}, 'blockers': []}
    role_example(plan, delivery, record)
    write(task / 'review-plan.json', plan)
    delivery['plan_ref'] = ref(task, 'review-plan.json')
    write(task / 'review-delivery.json', delivery)
    return plan, delivery


def generate(root):
    task = root / 'examples/review'
    task.mkdir(parents=True, exist_ok=True)
    (task / 'raw.txt').write_text('SYNTHETIC R1: bulk customer selection and result recovery.\n', encoding='utf-8', newline='\n')
    plan, delivery = review_assets(task, ref(task, 'raw.txt'))
    # Templates deliberately cannot pass as delivered/approved.
    template = copy.deepcopy(plan)
    template['raw_ref'] = {'path': 'raw-user.txt', 'sha256': 'REPLACE_WITH_ACTUAL_SHA256'}
    template['coverage_review'] = {'implementer': None, 'reviewer': None, 'decision': 'not_reviewed', 'record_ref': None}
    write(root / 'templates/review-plan.json', template)
    write(root / 'templates/review-delivery.json', {
        'protocol': 'design-review-delivery-v2', 'state': 'DELIVERY_BLOCKED',
        'plan_ref': {'path': 'review-plan.json', 'sha256': 'REPLACE_WITH_ACTUAL_SHA256'},
        'candidate_sha': None, 'target': {'url': None, 'version': None, 'access_instructions': None},
        'observation': {'kind': 'not_run', 'result': 'not_run', 'record_ref': None},
        'presentation': None, 'independent_review': None,
        'human_review': {'decision': 'pending', 'candidate_sha': None, 'record_ref': None},
        'blockers': [{'owner': 'Preview executor', 'gap': 'Final entry and actual UI presentation unverified',
                      'next_action': 'Observe final entry, task actions and recovery; present same-version UI with evidence',
                      'evidence_ref': None}]})


if __name__ == '__main__':
    generate(Path(__file__).resolve().parents[1])
    print('Generated synthetic review examples and blocked templates; no browser/approval occurred.')
