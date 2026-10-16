#!/usr/bin/env python3
"""Own isolated development resources; never authenticate application users.

The form driver is a Keycloak resource probe, not the future application OIDC
adapter. No passwords, tokens, cookies or authorization codes enter evidence.
"""
import argparse
import base64
import hashlib
from html.parser import HTMLParser
import http.cookiejar
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent
OWNER = 'cs-biz-nonprod-identity-v1'
CALLBACK = 'http://127.0.0.1:18081/callback'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def permission_denied(run):
    # A missing table, bad password or broken connection is NOT isolation proof.
    return run.returncode != 0 and bool(re.search(r'ERROR (1044|1142) \(',run.stderr))


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def initialize(state, environment):
    require(environment in ('development', 'ci'), 'production is not an allowed environment')
    require(not any(p.is_symlink() for p in (state, *state.parents)), 'symlink state is prohibited')
    state.mkdir(mode=0o700, parents=True, exist_ok=True)
    require(not any(state.iterdir()), 'state already exists; reuse it, never overwrite credentials')
    os.chmod(state, 0o700)
    marker = {'owner': OWNER, 'environment': environment,
              'project': 'cs-biz-identity-' + secrets.token_hex(6)}
    env = {name: secrets.token_hex(24) for name in (
        'CS_MYSQL_ROOT_PASSWORD', 'CS_KEYCLOAK_DB_PASSWORD',
        'CS_APP_DB_PASSWORD', 'CS_OIDC_ADMIN_PASSWORD')}
    env.update(CS_MYSQL_PORT=str(free_port()), CS_OIDC_PORT=str(free_port()))
    for name, content in [('owner.json', json.dumps(marker)),
                          ('runtime.env', ''.join(k+'='+v+'\n' for k, v in env.items()))]:
        with (state/name).open('x', encoding='utf-8') as out:
            os.chmod(state/name, 0o600)
            out.write(content)


class Resources:
    def __init__(self, state):
        self.state = state.resolve()
        require(not any(p.is_symlink() for p in (state, *state.parents))
                and not (state/'runtime.env').is_symlink()
                and not (state/'owner.json').is_symlink(), 'unsafe state')
        marker = json.loads((self.state/'owner.json').read_text())
        require(marker.get('owner') == OWNER and marker.get('environment') in ('development', 'ci'), 'not owned nonproduction state')
        require(re.fullmatch('cs-biz-identity-[0-9a-f]{12}', marker.get('project', '')), 'invalid project')
        self.marker = marker
        if os.name != 'nt':
            require((self.state/'runtime.env').stat().st_mode & 0o077 == 0, 'credential file must be private')
        self.env = dict(line.split('=', 1) for line in (self.state/'runtime.env').read_text().splitlines())
        require(all(re.fullmatch('[0-9a-f]{48}', self.env[k]) for k in (
            'CS_MYSQL_ROOT_PASSWORD','CS_KEYCLOAK_DB_PASSWORD','CS_APP_DB_PASSWORD','CS_OIDC_ADMIN_PASSWORD')), 'invalid runtime secret')
        require(all(self.env[k].isdigit() and 1024 <= int(self.env[k]) <= 65535 for k in ('CS_MYSQL_PORT','CS_OIDC_PORT')), 'invalid port')
        self.base = 'http://127.0.0.1:' + self.env['CS_OIDC_PORT']
        self.issuer = self.base + '/realms/cs-biz-nonprod'
        self.command = ['docker','compose','--env-file',str(self.state/'runtime.env'),
                        '-p',marker['project'],'-f',str(HERE/'compose.yaml')]

    def compose(self, *args, input=None, env=None, check=True, timeout=240):
        run = subprocess.run(self.command+list(args), input=input, text=True,
                             capture_output=True, timeout=timeout,
                             env={**os.environ, **(env or {})})
        # Keep raw container output out of logs; errors can contain credentials.
        if check:
            require(run.returncode == 0, 'resource command failed: '+str(args[0]))
        return run

    def sql(self, account, query, check=True):
        key = {'root':'CS_MYSQL_ROOT_PASSWORD','cs_biz':'CS_APP_DB_PASSWORD',
               'keycloak':'CS_KEYCLOAK_DB_PASSWORD'}[account]
        password = self.env[key]
        return self.compose('exec','-T','-e','MYSQL_PWD','mysql','mysql',
                            '-u'+account,'--batch','--skip-column-names',
                            input=query, env={'MYSQL_PWD':password}, check=check)

    def up(self):
        self.compose('up','-d','--wait','--wait-timeout','180')
        self.ready()
        password = self.env['CS_APP_DB_PASSWORD']  # generated hex, never caller SQL
        self.sql('root', "CREATE DATABASE IF NOT EXISTS cs_biz CHARACTER SET utf8mb4;"
                 "CREATE USER IF NOT EXISTS 'cs_biz'@'%' IDENTIFIED BY '"+password+"';"
                 "GRANT ALL ON cs_biz.* TO 'cs_biz'@'%';")

    def ready(self):
        deadline = time.monotonic()+180
        last_reason = 'not attempted'
        while time.monotonic() < deadline:
            try:
                doc = request(self.issuer+'/.well-known/openid-configuration')
                require(doc['issuer'] == self.issuer, 'issuer mismatch')
                return doc
            except (RuntimeError, OSError, ValueError, KeyError) as error:
                last_reason = str(error) if type(error) is RuntimeError else type(error).__name__
                time.sleep(2)
        raise RuntimeError('OIDC readiness timed out: '+last_reason)

    def diagnostics(self):
        # Only allowlisted, redacted failure lines; never dump container inspect
        # (Env), HTTP responses, SQL input, cookies, credentials or raw logs.
        logs = self.compose('logs','--no-color','--tail','120',check=False,timeout=20)
        selected = []
        for line in (logs.stdout+'\n'+logs.stderr).splitlines():
            if not re.search(r'ERROR|Exception|Caused by:|permission denied|Unable to|Unknown|Invalid|starting',line,re.I):
                continue
            for value in self.env.values():
                if len(value) >= 20:
                    line = line.replace(value,'[redacted]')
            line = re.sub(r'eyJ[A-Za-z0-9_.=-]+','[token]',line)
            line = re.sub(r'(?i)(password|secret|token|code)(\s*[:=]\s*)[^,;\s]+',r'\1\2[redacted]',line)
            line = re.sub(r'https?://[^\s]+','[url]',line)
            selected.append(line[:500])
        print(json.dumps({'resource_failure_diagnostics':selected[-30:]}))

    def down(self, destroy_ci=False):
        if destroy_ci:
            require(self.marker['environment'] == 'ci', 'cannot delete development volumes')
        self.compose('down', *(['--volumes'] if destroy_ci else []))

    def inspect_resources(self):
        images = []
        ids = self.compose('ps','-q').stdout.split()
        require(len(ids) == 2, 'expected exactly two resource containers')
        for container in ids:
            result = subprocess.run(['docker','inspect','--format',
                '{{.Config.Image}}|{{json .HostConfig.PortBindings}}',container],
                capture_output=True,text=True,timeout=15,check=True)
            image, bindings = result.stdout.strip().split('|',1)
            ports = json.loads(bindings)
            require(ports and all(p['HostIp'] == '127.0.0.1' for values in ports.values() for p in values), 'non-loopback port exposure')
            require('@sha256:' in image, 'runtime image is not digest pinned')
            images.append(image)
        return sorted(images)


def request(url, data=None, token=None, method=None):
    headers = {}
    if token:
        headers['Authorization'] = 'Bearer '+token
    if data is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            body = response.read()
            return json.loads(body) if body else None
    except urllib.error.HTTPError as error:
        raise RuntimeError('OIDC resource HTTP '+str(error.code)) from None


def form(url, fields):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(fields).encode())
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, None


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class LoginForm(HTMLParser):
    def __init__(self):
        super().__init__()
        self.action = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'form' and attrs.get('id') == 'kc-form-login':
            self.action = attrs.get('action')


class LoopbackProbeCookiePolicy(http.cookiejar.DefaultCookiePolicy):
    """Match the IdP's loopback secure-context behavior for this probe only.

    Keycloak sets Secure cookies on HTTP loopback origins; urllib otherwise
    withholds them. Never relax cookie domain/path rules or permit any other
    HTTP origin (including a different port). This is not application policy.
    """
    def __init__(self, origin):
        super().__init__()
        parsed = urllib.parse.urlsplit(origin)
        require(parsed.scheme == 'http' and parsed.hostname == '127.0.0.1'
                and parsed.port is not None and not parsed.username
                and not parsed.password and parsed.path == ''
                and not parsed.query and not parsed.fragment, 'invalid probe origin')
        self.origin = origin

    def return_ok_secure(self, cookie, req):
        url = urllib.parse.urlsplit(req.full_url)
        origin = urllib.parse.urlunsplit((url.scheme,url.netloc,'','',''))
        if cookie.secure and origin == self.origin:
            return True
        return super().return_ok_secure(cookie,req)


def authorization_code(resources, username, password, challenge, state, nonce):
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar(
            policy=LoopbackProbeCookiePolicy(resources.base))), NoRedirect())
    url = resources.issuer+'/protocol/openid-connect/auth?'+urllib.parse.urlencode({
        'client_id':'resource-probe','redirect_uri':CALLBACK,'response_type':'code',
        'scope':'openid','state':state,'nonce':nonce,
        'code_challenge':challenge,'code_challenge_method':'S256'})
    with opener.open(url, timeout=15) as response:
        parser = LoginForm()
        parser.feed(response.read().decode())
    require(parser.action and parser.action.startswith(resources.base+'/'), 'invalid login form target')
    req = urllib.request.Request(parser.action, data=urllib.parse.urlencode({
        'username':username,'password':password}).encode())
    try:
        opener.open(req, timeout=15).close()
        raise RuntimeError('login did not yield authorization code')
    except urllib.error.HTTPError as error:
        require(error.code in (302,303), 'login rejected')
        destination = error.headers.get('Location','')
    location = urllib.parse.urlsplit(destination)
    require(urllib.parse.urlunsplit(location[:3]+('', '')) == CALLBACK, 'callback mismatch')
    params = urllib.parse.parse_qs(location.query)
    require(params.get('state') == [state] and len(params.get('code',[])) == 1, 'state/code mismatch')
    return params['code'][0]


def verify(resources):
    doc = resources.ready()
    require(doc['authorization_endpoint'] == resources.issuer+'/protocol/openid-connect/auth', 'unexpected authorization endpoint')
    require(doc['token_endpoint'] == resources.issuer+'/protocol/openid-connect/token', 'unexpected token endpoint')
    require(doc['jwks_uri'].startswith(resources.issuer+'/'), 'unexpected JWKS endpoint')
    require(request(doc['jwks_uri'])['keys'], 'empty signing key set')
    status, admin = form(resources.base+'/realms/master/protocol/openid-connect/token', {
        'client_id':'admin-cli','grant_type':'password','username':'resource-admin',
        'password':resources.env['CS_OIDC_ADMIN_PASSWORD']})
    require(status == 200 and admin.get('access_token'), 'bootstrap management authentication failed')
    # This password grant is management bootstrap only; the application probe
    # client explicitly disables direct grants and uses code + S256 below.
    token = admin['access_token']
    username = 'probe-'+secrets.token_hex(6)
    password = secrets.token_hex(24)
    users = resources.base+'/admin/realms/cs-biz-nonprod/users'
    request(users, {'username':username,'enabled':True,'email':username+'@example.invalid',
        'emailVerified':True,'firstName':'Resource','lastName':'Probe','credentials':[
        {'type':'password','value':password,'temporary':False}]}, token=token, method='POST')
    subject = request(users+'?username='+username, token=token)[0]['id']
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
    state, nonce = secrets.token_urlsafe(24), secrets.token_urlsafe(24)
    code = authorization_code(resources, username, password, challenge, state, nonce)
    fields = {'grant_type':'authorization_code','client_id':'resource-probe',
              'redirect_uri':CALLBACK,'code':code,'code_verifier':verifier}
    status, tokens = form(doc['token_endpoint'], fields)
    require(status == 200 and tokens.get('id_token'), 'code+PKCE exchange failed')
    claims = json.loads(base64.urlsafe_b64decode(tokens['id_token'].split('.')[1]+'==='))
    require(claims['iss'] == resources.issuer and claims['sub'] == subject and claims['nonce'] == nonce, 'issued claims mismatch')
    # Only inspect the issuer's test output. This is NOT an application token
    # validator; signature/aud/time/nonce verification belongs to the BFF slice.
    require(form(doc['token_endpoint'], fields)[0] == 400, 'authorization code replay accepted')
    code2 = authorization_code(resources, username, password, challenge, state, nonce)
    require(form(doc['token_endpoint'], {**fields,'code':code2,'code_verifier':secrets.token_urlsafe(48)})[0] == 400, 'bad PKCE verifier accepted')
    marker = secrets.token_hex(12)
    resources.sql('cs_biz', "CREATE TABLE IF NOT EXISTS cs_biz.resource_probe (id VARCHAR(24) PRIMARY KEY); INSERT INTO cs_biz.resource_probe VALUES ('"+marker+"');")
    require(resources.sql('keycloak','SELECT COUNT(*) FROM keycloak.USER_ENTITY;').stdout.strip().isdigit(), 'IdP table/connection is not readable by its owner')
    require(resources.sql('cs_biz',"SELECT id FROM cs_biz.resource_probe WHERE id='"+marker+"';").stdout.strip() == marker, 'business marker is not readable by its owner')
    require(permission_denied(resources.sql('cs_biz','SELECT COUNT(*) FROM keycloak.USER_ENTITY;',check=False)), 'business-to-IdP isolation not proven')
    require(permission_denied(resources.sql('keycloak','SELECT COUNT(*) FROM cs_biz.resource_probe;',check=False)), 'IdP-to-business isolation not proven')
    resources.compose('restart','mysql','oidc')
    resources.ready()
    # Obtain a fresh management token after restart; never persist tokens.
    status, admin2 = form(resources.base+'/realms/master/protocol/openid-connect/token', {
        'client_id':'admin-cli','grant_type':'password','username':'resource-admin',
        'password':resources.env['CS_OIDC_ADMIN_PASSWORD']})
    require(status == 200, 'management reauthentication failed')
    require(request(users+'?username='+username, token=admin2['access_token'])[0]['id'] == subject, 'identity lost on restart')
    require(resources.sql('cs_biz',"SELECT id FROM cs_biz.resource_probe WHERE id='"+marker+"';").stdout.strip() == marker, 'database marker lost on restart')
    version = resources.sql('root','SELECT VERSION();').stdout.strip()
    images = resources.inspect_resources()
    return {'resource_result':'PASS','environment':resources.marker['environment'],
            'mysql_version':version,'runtime_images':images,'loopback_only':True,
            'discovery':True,'jwks':True,'code_pkce':True,
            'code_replay_denied':True,'bad_pkce_denied':True,'both_schema_accounts_isolated':True,
            'restart_persistence':True,'bff_iam_production':'NOT_IMPLEMENTED_NOT_VERIFIED'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['init','up','verify','down','ci'])
    parser.add_argument('--state',type=Path)
    parser.add_argument('--environment',choices=['development','ci'],default='development')
    parser.add_argument('--evidence',type=Path)
    args = parser.parse_args()
    require(shutil.which('docker') is not None, 'Docker is unavailable; not a passing resource test')
    if args.action == 'ci':
        require(args.evidence is not None,'CI evidence path required')
        with tempfile.TemporaryDirectory(prefix='cs-biz-identity-') as directory:
            state = Path(directory)/'state'
            initialize(state,'ci')
            resources = Resources(state)
            try:
                resources.up()
                result = verify(resources)
                args.evidence.parent.mkdir(parents=True,exist_ok=True)
                args.evidence.write_text(json.dumps(result,indent=2)+'\n')
                print(json.dumps(result))
            except Exception:
                try:
                    resources.diagnostics()
                except Exception as diagnostic_error:
                    print('Resource diagnostics unavailable: '+type(diagnostic_error).__name__)
                raise
            finally:
                resources.down(destroy_ci=True)
        return
    require(args.state is not None, 'explicit private state directory required')
    if args.action == 'init':
        initialize(args.state,args.environment)
        print('Private nonproduction state initialized; no credentials printed.')
        return
    resources = Resources(args.state)
    if args.action == 'up':
        resources.up()
        print('Nonproduction issuer: '+resources.issuer)
    elif args.action == 'verify':
        print(json.dumps(verify(resources)))
    else:
        resources.down()
        print('Containers stopped; development database volume retained.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Do not stringify HTTP/subprocess errors: their URLs or output can hold
        # codes/tokens. Preserve a safe category; exact exit failure is evidence.
        reason = str(error) if type(error) is RuntimeError else type(error).__name__
        print('FAIL: nonproduction resource action: '+reason+'; no success evidence produced.',file=__import__('sys').stderr)
        raise SystemExit(1)
