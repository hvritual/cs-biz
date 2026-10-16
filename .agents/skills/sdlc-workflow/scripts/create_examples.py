#!/usr/bin/env python3
"""Generate bounded synthetic examples; never approval, CI, deployment or product proof."""
from pathlib import Path
import argparse,copy,hashlib,json,shutil

SHA='a'*40
TREE='b'*40
BASE='0085c7426cd972babe38b3703a4dbb4ee25229a0'
STAGES=('design','build','deploy')
from check_workflow import definition_digest
def dump(path,value):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def ref(task,path):return {'path':path,'sha256':hashlib.sha256((task/path).read_bytes()).hexdigest()}
def fixture(stage, package, task, incoming=None, outcome='healthy'):
 task.mkdir(parents=True,exist_ok=True)
 workflow=json.loads((package/'workflow.json').read_text())
 if stage=='design':
  (task/'raw.txt').write_text('SYNTHETIC ONLY: design a tenant-scoped operation with observable result and unknown-outcome recovery.\n')
  intake={'protocol':'sdlc-request-v1','task_id':'synthetic-example',
   'contract':{'repository':'hvritual/cs-biz','baseline_sha':BASE,'frontend_change':False,'mode':'example',
    'allowed_paths':['backend/internal/example/**'],'forbidden_paths':['frontend/**'],'completion_boundary':'deployed'},
   'authority_ref':'fixture://not-authenticated-authority','assets':{'raw':ref(task,'raw.txt')}}
  dump(task/'request.json',intake)
 else:
  source,filename=incoming
  intake=json.loads((source/filename).read_text())
  dump(task/filename,intake)
  for item in intake['assets'].values():
   p=task/item['path'];p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/item['path'],p)
 contract=copy.deepcopy(intake['contract'])
 if stage=='deploy':
  dump(task/'deploy-request.json',{'environment':'synthetic-env','deployment_authority_ref':'fixture://not-authenticated-deploy-authority',
   'rollback_authority_ref':'fixture://not-authenticated-rollback-authority','expected_main_sha':SHA,
   'expected_package_sha256':intake['assets']['package']['sha256']})
 all_assets=dict(intake['assets']); completed={}
 for step in workflow['steps']:
  sid=step['id'];status='ready';assets={}
  if stage=='design' and sid=='acceptance':contract.update(requirement_ids=['R1'],acceptance_ids=['AC1'])
  applicable=not(stage=='design' and sid in ('ux','preview')) and not(stage=='deploy' and sid=='recover' and outcome=='healthy')
  if not applicable:
   payload={'reason':'Synthetic backend-only design' if stage=='design' else 'Authoritative synthetic observation is healthy; recovery is not applicable.'};status='not_applicable'
  else:
   schema=json.loads((package/step['payload_contract']).read_text())
   payload={k:'fixture://'+stage+'/'+sid+'/'+k for k in schema['required']}
   for role in step['required_assets']:
    if stage=='design' and role=='raw':assets[role]=intake['assets']['raw'];continue
    if sid=='handoff' and role in all_assets:assets[role]=all_assets[role];continue
    path=f'assets/{stage}-{sid}-{role}.json'
    content={'synthetic':True,'notice':'NOT actual approval/runtime/CI/deployment evidence','role':role}
    if role=='acceptance':content.update(acceptance_ids=['AC1'],review_ref=payload.get('review_ref'))
    if role=='review':content.update(decision='pass',implementer='fixture-implementer',reviewer='fixture-reviewer',candidate_sha=SHA,source_ref='fixture://review')
    if role=='quality':content.update(REPOSITORY=contract['repository'],HEAD_SHA=SHA,BASE_SHA=BASE,TIER='full',result='QUALIFIED')
    if role=='acceptance_evidence':content.update(acceptance_ids=['AC1'],candidate_sha=SHA,results=[{'acceptance_id':'AC1','status':'pass','evidence_ref':'fixture://not-real-test-proof'}])
    if role=='release_plan':content.update(operation_id='synthetic-release-001',rollback_revision=BASE,rollback_package_sha256='c'*64)
    dump(task/path,content);assets[role]=ref(task,path)
   for field,role in step.get('payload_asset_refs',{}).items():payload[field]=assets[role]['path']
   if 'mode' in payload:payload['mode']='static'
   if 'decision' in payload:payload['decision']='pass'
   if 'acceptance_ids' in payload:payload['acceptance_ids']=contract['acceptance_ids']
   for k in ('candidate_sha','main_sha'):
    if k in payload:payload[k]=SHA
   if 'tree_sha' in payload:payload['tree_sha']=TREE
   if 'consumer' in payload:payload['consumer']=workflow['consumer']
   if 'design_protocol' in payload:
    payload['design_protocol']='intent-design-v2'
    payload['design_revision']='r001'
    payload['design_task_ref']='fixture://synthetic-task'
   if stage=='deploy':
    payload['environment']='synthetic-env'
    if sid=='admit':payload['deployment_authority_ref']='fixture://not-authenticated-deploy-authority'
    if sid=='plan':
     payload['rollback_authority_ref']='fixture://not-authenticated-rollback-authority'
     payload['plan_ref']=assets['release_plan']['path']
    if 'operation_id' in payload:payload['operation_id']='synthetic-release-001'
    if sid=='execute':payload['outcome']='submitted' if outcome=='healthy' else outcome
    if sid=='observe':payload['outcome']=outcome
    if sid=='recover':payload['outcome']='rolled_back' if outcome=='failed' else 'unknown'
    if sid=='handoff':payload['outcome']='deployed' if outcome=='healthy' else 'rolled_back' if outcome=='failed' else 'unknown'
    for k in ('observed_revision','package_sha256'):
     if k in payload:
      if outcome=='unknown':payload[k]=None
      elif outcome=='failed' and sid in ('recover','handoff'):payload[k]=BASE if k=='observed_revision' else 'c'*64
      else:payload[k]=SHA if k=='observed_revision' else intake['assets']['package']['sha256']
   if sid=='handoff':
    assets={**all_assets,**assets}
    if stage != 'design':assets.update({'upstream.'+k:v for k,v in intake['assets'].items()})
    if stage=='build':payload['package_sha256']=assets['package']['sha256']
  data={'protocol':'sdlc-artifact-v1','task_id':intake['task_id'],'stage':stage,'step':sid,'status':status,
   'definition_sha256':definition_digest(package,workflow,step),
   'input_sha256':{name:ref(task,name)['sha256'] for name in step['inputs']},'contract':copy.deepcopy(contract),
   'payload':payload,'assets':assets,'blockers':[]}
  dump(task/step['output'],data);completed[sid]=data;all_assets.update(assets)
 return task,workflow['handoff']

def generate(root):
 stages=root.parent
 upstream=None
 for stage in STAGES:
  package=stages/('sdlc-'+stage);complete=package/'examples/complete'
  upstream=fixture(stage,package,complete,upstream)
  # A separately bound blocked first-step artifact; no downstream output can exist.
  blocked=package/'examples/blocked';blocked.mkdir(parents=True,exist_ok=True)
  workflow=json.loads((package/'workflow.json').read_text());intake=workflow['intake_files'][0]
  for name in workflow['intake_files']:
   p=blocked/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(complete/name,p)
  for item in json.loads((complete/intake).read_text())['assets'].values():
   p=blocked/item['path'];p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(complete/item['path'],p)
  first=workflow['steps'][0];data=json.loads((complete/first['output']).read_text())
  data.update(status='blocked',payload={},assets={},blockers=[{'owner':'Human_or_resource_owner','next_action':'Provide the missing real decision, authority or environment evidence.','evidence_ref':'fixture://missing-condition'}])
  dump(blocked/first['output'],data)
 # Failure and unknown-outcome examples stay in the Deploy package.
 deploy=stages/'sdlc-deploy'
 for outcome in ('failed','unknown'):
  fixture('deploy',deploy,deploy/('examples/'+outcome),(stages/'sdlc-build/examples/complete','build-to-deploy.json'),outcome)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--bundle-root',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args()
 generate(args.bundle_root)
 print('Generated explicit EXAMPLE_ONLY/BLOCKED fixtures; no external action was performed.')
