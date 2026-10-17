"""Generate the requirement originator's separate business operation flow."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = next(p for p in HERE.parents if (p / '.git').exists())
PLAN = REPO / 'doc/tasks/f-series/rounds/r004/review-plan.json'


def operation_flow(data):
    tasks = {t['id']: t for t in data['tasks']}
    roles = {r['id']: r for r in data['roles']}

    def business(value):
        for old, new in [('；真实API越权另需跨端证明', ''), ('真实API越权另需跨端证明', ''), ('同一测试资源', '同一资源'), ('无接受ACT', '未创建接受操作记录'), ('不伪造ACT', '未受理时不产生操作记录'), ('本轮首次企业负责人', '首次企业负责人'), ('原发布模拟计划', '原发布计划'),
                         ('发布模拟计划', '发布计划'), ('模拟恢复', '恢复'), ('模拟计划', '计划'),
                         ('本轮隔离', '本次'), ('隔离身份验证结果', '身份验证结果'),
                         ('当前样例账号', '当前账号'), ('审阅操作', '操作'), ('审阅计划', '计划'),
                         ('（交接后先退出当前会话）', '；交接账号时先退出当前会话'),
                         ('，不使用角色切换工具', ''), ('，不预设企业成员身份或能力', '')]:
            value = value.replace(old, new)
        return value.strip().rstrip('。；')

    def steps(nodes):
        result = []
        for node in nodes:
            label = business(roles[node['actor_id']]['label'])
            if node['kind'] == 'task_path':
                task = tasks[node['task_id']]
                path = next(p for p in task['paths' if node['path_kind'] == 'normal' else 'recovery'] if p['id'] == node['path_id'])
                result.extend((label, business(v['action']), business(v['visible_result'])) for v in path['steps'])
                if node.get('inputs'):
                    label, action, expected = result[-len(path['steps'])]
                    result[-len(path['steps'])] = (label, action, expected+'；填写：'+'；'.join(business(k)+'：'+business(v) for k,v in node['inputs'].items()))
            else:
                result.append((label, business(node['action']), business(node['visible_result'])))
        return result

    def numbered(values):
        return [f'{i}. {role}：{action}。预期：{expected}。' for i, (role,action,expected) in enumerate(values, 1)]

    lines = ['# 用户旅程体验操作流程', '', '使用对应账号，从登录或收到的邀请开始，按以下流程完成业务操作。', '', '## 账号', '']
    for role in data['roles']:
        lines.append('- '+business(role['label'])+'：'+business(role['account_context'])+'。')
    for journey in data['journeys']:
        location = journey['entry']['location']
        lines += ['', '## '+business(journey['goal']), '', '入口：[打开产品](http://127.0.0.1:5790'+location+')。', '']
        lines += numbered(steps(journey['walkthrough']))
        for branch in journey['branches']:
            condition = business(branch['condition'])
            if condition == '使用direct入口替代本次选取方式':
                condition = {'T01-zero-organizations':'账号还未加入企业', 'T01-one-organization':'账号只有一家企业', 'T01-many-organizations':'账号可以进入多家企业'}.get(branch['id'], '使用另一种选取方式')
            nodes = journey['walkthrough']
            prefix = nodes[:next(i for i,n in enumerate(nodes) if n['id']==branch['from_step'])+1]
            lines += ['', '### '+condition, '']
            prefix_steps = steps(prefix)
            if branch.get('trigger_result') and prefix_steps:
                role, action, _ = prefix_steps[-1]
                prefix_steps[-1] = (role, action, business(branch['trigger_result']))
            lines += numbered(prefix_steps+steps(branch['walkthrough']))
    return '\n'.join(lines)+'\n'


def generate():
    data = json.loads(PLAN.read_text(encoding='utf-8'))
    (PLAN.parent/'human-review.md').write_text(operation_flow(data),encoding='utf-8',newline='\n')


if __name__ == '__main__':
    generate()
