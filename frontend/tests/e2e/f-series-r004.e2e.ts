import { afterAll, beforeAll } from '@e2e-dev/web';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerR004ReviewTests } from './f-series-r004';
const frontend = fileURLToPath(new URL('../..', import.meta.url));
let server: ChildProcess | undefined;
beforeAll(async () => {
  if (process.env.R004_REUSE_PREVIEW === '1') {
    if (!(await fetch('http://127.0.0.1:5790/')).ok) throw new Error('Explicit local preview reuse requested, but the server is unavailable.');
    return;
  }
  let log = '';
  server = spawn(process.execPath, [resolve(frontend,'node_modules/vite/bin/vite.js'),'--mode','design','--host','127.0.0.1','--port','5790','--strictPort'], {cwd:resolve(frontend,'apps/console'),stdio:['ignore','pipe','pipe'],env:{...process.env,TURBO_TELEMETRY_DISABLED:'1',DO_NOT_TRACK:'1'}});
  server.stdout?.on('data', b=>{log+=String(b);});server.stderr?.on('data', b=>{log+=String(b);});server.on('error',e=>{log+=e.message;});
  const deadline=Date.now()+30000;
  while(Date.now()<deadline) {
    if(server.exitCode!==null)throw new Error('Owned r004 preview exited: '+log);
    try {if((await fetch('http://127.0.0.1:5790/')).ok)return;} catch { /* Owned startup only. */ }
    await new Promise(resolveWait=>setTimeout(resolveWait,200));
  }
  throw new Error('Owned r004 preview did not start: '+log);
});
afterAll(async()=>{
  if(!server||server.exitCode!==null)return;
  const child=server;const exit=new Promise<void>(resolveExit=>child.once('exit',()=>resolveExit()));
  child.kill('SIGTERM');await Promise.race([exit,new Promise<void>(resolveWait=>setTimeout(resolveWait,3000))]);
  if(child.exitCode===null)child.kill('SIGKILL');
});
registerR004ReviewTests();
