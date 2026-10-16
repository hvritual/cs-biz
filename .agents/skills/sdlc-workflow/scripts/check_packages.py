#!/usr/bin/env python3
"""Read-only ownership/distribution/integration checks for three portable Agent Skills."""
from pathlib import Path
import argparse,json,subprocess,sys,tempfile,shutil,tomllib

ROOT=Path(__file__).resolve().parents[1]
STAGES=('design','build','deploy')

def run(package,*args,cwd=None):
 r=subprocess.run([sys.executable,str(package/'scripts/check_workflow.py'),*map(str,args)],cwd=cwd,capture_output=True,text=True,timeout=30)
 if r.returncode:raise ValueError(r.stdout+r.stderr)
 return json.loads(r.stdout)

def check(bundle=ROOT,portable=True):
 skills=bundle.parent;repo=skills.parent.parent;seen=[]
 for stage in STAGES:
  p=skills/('sdlc-'+stage)
  for d in ('agents','skills','contracts','templates','examples','scripts','references'):
   if not (p/d).is_dir():raise ValueError('missing owned directory: '+str(p/d))
  for name in ('check_workflow.py','artifact_io.py'):
   if (p/'scripts'/name).read_bytes()!=(bundle/'scripts'/name).read_bytes():raise ValueError('generic runtime distribution drift: '+stage+'/'+name)
  native=p/f'agents/{stage}.toml';definition=tomllib.loads(native.read_text())
  if set(definition)!={'name','description','developer_instructions'} or definition['name']!=stage:
   raise ValueError('Agent definition must inherit model/provider/permissions: '+stage)
  if (repo/f'.codex/agents/{stage}.toml').read_bytes()!=native.read_bytes():raise ValueError('native registration mirror drift: '+stage)
  result=run(p,'--structure')
  if result['state']!='PACKAGE_VALID_STATIC':raise ValueError('invalid package: '+stage)
  result=run(p,'--task',p/'examples/complete')
  if result['state']!='EXAMPLE_ONLY' or result['execution_granted'] is not False:raise ValueError('example promoted to real proof')
  if run(p,'--task',p/'examples/blocked')['state']!='BLOCKED':raise ValueError('blocked example did not block')
  if portable:
   with tempfile.TemporaryDirectory(prefix='sdlc-package-') as tmp:
    copied=Path(tmp)/p.name
    shutil.copytree(p,copied,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    if run(copied,'--task',copied/'examples/complete',cwd=tmp)['state']!='EXAMPLE_ONLY':raise ValueError('nonportable package: '+stage)
  seen.append(stage)
 for downstream,upstream in (('build','design'),('deploy','build')):
  if (skills/f'sdlc-{downstream}/contracts/intake.json').read_bytes()!=(skills/f'sdlc-{upstream}/contracts/handoff.json').read_bytes():
   raise ValueError('consumer contract drift: '+downstream)
 if (skills/'sdlc-build/scripts/check_design_workflow.py').read_bytes()!=(skills/'sdlc-design/scripts/check_design_workflow.py').read_bytes():
  raise ValueError('Build Design-admission dependency copy drift')
 for stage in ('build','deploy'):
  if (skills/f'sdlc-{stage}/scripts/release_checks.py').read_bytes()!=(bundle/'scripts/release_checks.py').read_bytes():
   raise ValueError('release validator distribution drift: '+stage)
 for outcome in ('failed','unknown'):
  result=run(skills/'sdlc-deploy','--task',skills/f'sdlc-deploy/examples/{outcome}')
  expected='rolled_back' if outcome=='failed' else 'unknown'
  if result['reported_outcome']!=expected or result['state']!='EXAMPLE_ONLY':raise ValueError('Deploy outcome example misreported')
 for owner,role in (('intent-to-outcome-closure','goal'),('sdlc-design','architecture')):
  package=skills/owner;native=package/f'agents/{role}.toml'
  definition=tomllib.loads(native.read_text())
  if set(definition)!={'name','description','developer_instructions'} or definition['name']!=role:
   raise ValueError('specialist must inherit model/provider/permissions: '+role)
  if (repo/f'.codex/agents/{role}.toml').read_bytes()!=native.read_bytes():raise ValueError('native registration mirror drift: '+role)
  instructions='agents/agent.md' if role=='goal' else 'agents/architecture.md'
  if not (package/instructions).is_file():raise ValueError('missing role instructions: '+role)
 goal=skills/'intent-to-outcome-closure'
 for kind in ('explore','saas','operation'):
  result=subprocess.run([sys.executable,str(goal/'scripts/check_goal.py'),'--task',str(goal/'examples'/kind)],capture_output=True,text=True,timeout=10)
  if result.returncode or json.loads(result.stdout).get('state')!='EXAMPLE_ONLY':raise ValueError('invalid goal example: '+kind)
 if portable:
  with tempfile.TemporaryDirectory(prefix='goal-package-') as tmp:
   copied=Path(tmp)/goal.name;shutil.copytree(goal,copied,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
   result=subprocess.run([sys.executable,str(copied/'scripts/check_goal.py'),'--task',str(copied/'examples/explore')],cwd=tmp,capture_output=True,text=True,timeout=10)
   if result.returncode or json.loads(result.stdout).get('next_action')!='DISCOVER':raise ValueError('nonportable goal checker')
 return seen

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--bundle-root',type=Path,default=ROOT);parser.add_argument('--no-portable',action='store_true');args=parser.parse_args()
 try:
  result=check(args.bundle_root.resolve(),not args.no_portable)
  print(json.dumps({'contract':'PASS_STATIC_ONLY','stages':result,'portable_checked':not args.no_portable,
   'native_runtime':'NOT_VERIFIED','authentic_approval':'NOT_VERIFIED','runtime':'NOT_VERIFIED','execution_granted':False}))
  return 0
 except (ValueError,OSError,KeyError,TypeError,subprocess.SubprocessError) as e:
  print(json.dumps({'contract':'FAIL','issues':[str(e)]}));return 2
if __name__=='__main__':raise SystemExit(main())
