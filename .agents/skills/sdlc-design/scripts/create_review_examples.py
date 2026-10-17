#!/usr/bin/env python3
"""Generate synthetic review-contract fixtures; never runtime/Human proof."""
import copy
import hashlib
import json
from pathlib import Path


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def ref(root, name):
    return {'path': name, 'sha256': hashlib.sha256((root / name).read_bytes()).hexdigest()}


def review_assets(task, raw_ref, candidate='a' * 40):
    """Only synthetic declarations, used by examples and temporary negative tests."""
    folder = task / 'review-fixture'
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'record.txt').write_text('SYNTHETIC ONLY. No browser, message delivery or approval occurred.\n')
    (folder / 'guide.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="80">'
                                    '<text x="10" y="40">Example: select - confirm - results</text></svg>\n')
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
    plan = {'protocol': 'design-review-plan-v1', 'raw_ref': raw_ref, 'requirement_ids': ['R1'],
            'tasks': [task_item], 'coverage_review': coverage,
            'review_questions': ['选取、影响核对和失败处理是否符合实际工作？']}
    write(task / 'review-plan.json', plan)
    checks = {name: 'pass' for name in ('plain_language', 'visual_guidance', 'result_summary', 'failure_recovery',
              'unknown_readback', 'selected_count', 'selected_details', 'affected_scope', 'filter', 'paste',
              'excel', 'deduplication', 'ambiguity', 'import_errors', 'scope_guard')}
    url = 'https://review.example.invalid/task'
    delivery = {'protocol': 'design-review-delivery-v1', 'state': 'AWAITING_HUMAN_REVIEW',
                'plan_ref': ref(task, 'review-plan.json'), 'candidate_sha': candidate,
                'target': {'url': url, 'version': 'synthetic-snapshot', 'access_instructions': 'SYNTHETIC ONLY; not an accessible UI'},
                'observation': {'kind': 'final_entry_browser', 'result': 'pass', 'url': url,
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
                                 'image_paths': ['review-fixture/guide.svg'], 'review_sequence': ['选取→核对→结果'],
                                 'decision_questions': plan['review_questions'], 'limitations': ['Synthetic example only; no actual execution.']},
                'independent_review': {**coverage, 'candidate_sha': candidate},
                'human_review': {'decision': 'pending', 'candidate_sha': None, 'record_ref': None}, 'blockers': []}
    write(task / 'review-delivery.json', delivery)
    return plan, delivery


def generate(root):
    task = root / 'examples/review'
    task.mkdir(parents=True, exist_ok=True)
    (task / 'raw.txt').write_text('SYNTHETIC R1: bulk customer selection and result recovery.\n')
    plan, delivery = review_assets(task, ref(task, 'raw.txt'))
    # Templates deliberately cannot pass as delivered/approved.
    template = copy.deepcopy(plan)
    template['raw_ref'] = {'path': 'raw-user.txt', 'sha256': 'REPLACE_WITH_ACTUAL_SHA256'}
    template['coverage_review'] = {'implementer': None, 'reviewer': None, 'decision': 'not_reviewed', 'record_ref': None}
    write(root / 'templates/review-plan.json', template)
    write(root / 'templates/review-delivery.json', {
        'protocol': 'design-review-delivery-v1', 'state': 'DELIVERY_BLOCKED',
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
