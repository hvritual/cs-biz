import { computed, onUnmounted, ref } from 'vue';
import type { CopyKey } from './copy';
import { useWorkspaceStore } from '#/store';
import { installWorkspaceRoutes } from '#/platform/routing';
function createState() {
const workspace = useWorkspaceStore();
const tab = ref<CopyKey>('identity');
const tabs: CopyKey[] = ['identity', 'marketing', 'invitations', 'roles', 'customers', 'operations'];
const sessionKey = 'cs-biz:f-series-design:session';
const identity = ref<'signed_out'|'zero'|'many'|'active'|'switch_error'>(localStorage.getItem(sessionKey) && workspace.tenant ? 'active' : 'signed_out');
const savedTenant = sessionStorage.getItem('cs-biz:f-series-design:tenant');
const activeTenant = ref<string | null>(identity.value === 'active' ? savedTenant : null);
if (!activeTenant.value) identity.value = localStorage.getItem(sessionKey) ? 'many' : 'signed_out';
const reviewUser = workspace.user;
type Outcome = 'unknown' | 'succeeded' | 'failed';
const readbackResult = ref<Outcome | 'denied'>('succeeded');
function queryOperation() {
  if (readbackResult.value === 'denied') { notice.value = 'queryDenied'; return; }
  recordOutcome(readbackResult.value);
}
function journal<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
  catch { throw new Error('Design fixture journal cannot be read'); }
}
const operationJournalKey = 'cs-biz:f-series-design:operations';
const invitationJournalKey = 'cs-biz:f-series-design:invitations';
const operations = ref(journal<Record<string, Outcome>>(operationJournalKey, {}));
const invitationBatches = ref(journal<Record<string, { addresses: string[]; results: Record<string, 'unknown' | 'created'> }>>(invitationJournalKey, {}));
function recordOutcome(value: Outcome) {
  operations.value[operationKey.value] = value;
  localStorage.setItem(operationJournalKey, JSON.stringify(operations.value));
}
function readInvitation(address: string) {
  const batch = invitationBatches.value[operationKey.value];
  if (!batch || !(address in batch.results)) return;
  batch.results[address] = 'created';
  localStorage.setItem(invitationJournalKey, JSON.stringify(invitationBatches.value));
}
const currentBatch = computed(() => invitationBatches.value[operationKey.value]);
const invited = computed(() => !!currentBatch.value);
const operationKey = computed(() => `${reviewUser?.id || 'chen'}:${activeTenant.value || 'none'}`);
const operationId = computed(() => `operation-review-${activeTenant.value || 'none'}-001`);
const campaignState = computed(() => operations.value[operationKey.value] || 'ready');
function clearSelection() {
  parsed.value = false;
  sessionStorage.removeItem('cs-biz:f-series-design:tenant');
  selected.value = []; notice.value = ''; dialog.value = '';
}
function beginSignIn() {
  clearSelection(); activeTenant.value = null; identity.value = 'many';
  localStorage.setItem(sessionKey, 'design-only-active');
  workspace.user = reviewUser;
}
function endSession() {
  clearSelection(); activeTenant.value = null; identity.value = 'signed_out';
  workspace.tenant = null; workspace.context = null;
}
function signOut() { localStorage.removeItem(sessionKey); endSession(); }
function switchFailed() {
  clearSelection(); activeTenant.value = null; identity.value = 'switch_error';
  workspace.tenant = null; workspace.context = null;
}
function membershipScenario(value: 'zero' | 'many') {
  beginSignIn(); identity.value = value; workspace.tenant = null; workspace.context = null;
}
const sessionChanged = (event: StorageEvent) => { if (event.key === sessionKey && event.newValue === null) endSession(); };
window.addEventListener('storage', sessionChanged);
onUnmounted(() => { window.removeEventListener('storage', sessionChanged); shared = undefined; });
const organization = computed(() => workspace.tenants.find(item => item.id === activeTenant.value)?.name || '');
// Fixture display state only: real Workspace publication must use trusted Access Context.
function chooseOrganization(name: string) {
  const target = workspace.tenants.find(item => item.name === name);
  if (!target) return;
  clearSelection();
  localStorage.setItem(sessionKey, 'design-only-active');
  workspace.user = reviewUser; workspace.tenant = target;
  activeTenant.value = target.id; identity.value = 'active';
  sessionStorage.setItem('cs-biz:f-series-design:tenant', target.id);
}
const scenario = ref<'ready'|'revoked'|'disabled'|'unavailable'>('ready');
const dialog = ref<'campaign'|'invite'|'export'|'details'|''>('');
const notice = ref<CopyKey|''>('');
const emails = ref('lin@example.test\nyu@example.test\nLIN@example.test\ninvalid\nnot-in-scope@example.org');
const parsed = ref(false);
const selected = ref<string[]>([]);
const rows = [{ id:'customer-1', name:'青禾科技园', mine:true },{ id:'customer-2', name:'青禾商务中心', mine:false }];
const analyzed = computed(() => {
  const unique = new Set<string>(); let invalid=0, duplicate=0, outside=0;
  for (const line of emails.value.split(/\r?\n/).map(v=>v.trim().toLowerCase()).filter(Boolean)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) { invalid++; continue; }
    if (!line.endsWith('@example.test')) { outside++; continue; }
    if (unique.has(line)) { duplicate++; continue; }
    unique.add(line);
  }
  return { addresses:[...unique], invalid, duplicate, outside };
});
const blocked = computed(()=>scenario.value !== 'ready');
async function selectTab(value: CopyKey) {
  tab.value=value; notice.value=''; dialog.value='';
  if (value === 'marketing') await installWorkspaceRoutes([], false, () => true);
}
function setScenario(value: typeof scenario.value) { scenario.value=value;  notice.value=''; }
function submit() {
  if (dialog.value==='campaign' && !blocked.value && campaignState.value==='ready') recordOutcome('unknown');
  if (dialog.value==='invite' && !currentBatch.value && identity.value === 'active') {
    const addresses = [...analyzed.value.addresses];
    invitationBatches.value[operationKey.value] = { addresses, results: Object.fromEntries(addresses.map((address,index) => [address,index === 0 ? 'created' : 'unknown'])) };
    localStorage.setItem(invitationJournalKey, JSON.stringify(invitationBatches.value));
  }
  if (dialog.value==='export') notice.value='exported';
  dialog.value='';
}
async function copyReference() {
  try { await navigator.clipboard.writeText(operationId.value); notice.value='copied'; }
  catch { notice.value='sampleHelp'; }
}

return { workspace, tab, tabs, identity, activeTenant, organization, scenario, dialog, notice, emails, parsed, selected, rows, analyzed, blocked, campaignState, operationId, invited, currentBatch, readbackResult, selectTab, setScenario, submit, copyReference, readInvitation, queryOperation, beginSignIn, signOut, switchFailed, membershipScenario, chooseOrganization };
}
let shared: ReturnType<typeof createState> | undefined;
export function useFSeriesDesignState() { return shared ??= createState(); }
