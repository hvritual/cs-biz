<script setup lang="ts">
import { preferences } from '@vben/preferences';
import { ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, ElInput, ElOption, ElSelect, ElTag } from 'element-plus';
import { useRouter } from 'vue-router';
import PageHeader from '#/components/PageHeader.vue';
import { text, type CopyKey } from './copy';
import { useFSeriesDesignState } from './state';
const router = useRouter();
const t = (key: CopyKey) => text(key, preferences.app.locale === 'en-US');
const { tab, tabs, identity, organization, scenario, dialog, notice, emails, parsed, selected, rows, analyzed, blocked, campaignState, operationId, invited, currentBatch, readbackResult, selectTab, setScenario, submit, copyReference, readInvitation, queryOperation, beginSignIn, signOut, switchFailed, membershipScenario, chooseOrganization } = useFSeriesDesignState();
</script>
<template>
  <section class="f-review" data-design-preview="f-series-r002">
    <aside class="review-boundary" role="note">{{ t('banner') }}</aside>
    <PageHeader :title="t('title')" :description="t('subtitle')" />
    <nav class="review-tabs" :aria-label="t('scenario')"><button v-for="item in tabs" :key="item" type="button" :aria-current="tab===item ? 'page':undefined" :class="{active:tab===item}" @click="selectTab(item)">{{ t(item) }}</button></nav>
    <p v-if="notice" class="review-notice" role="status">{{ t(notice) }}</p>
    <section v-if="tab==='identity'" class="review-card">
      <div class="scenario-controls"><ElButton @click="membershipScenario('zero')">{{ t('zero') }}</ElButton><ElButton @click="membershipScenario('many')">{{ t('many') }}</ElButton><ElButton @click="chooseOrganization('青禾咖啡')">{{ t('one') }}</ElButton><ElButton @click="switchFailed">{{ t('switchFailure') }}</ElButton></div>
      <template v-if="identity==='signed_out'"><h2>{{ t('signedOut') }}</h2><p>{{ t('loginHelp') }}</p><ElButton type="primary" @click="beginSignIn">{{ t('login') }}</ElButton></template>
      <template v-else-if="identity==='zero'"><h2>{{ t('noOrg') }}</h2><p>{{ t('noOrgHelp') }}</p><ElButton @click="signOut">{{ t('login') }}</ElButton></template>
      <template v-else-if="identity==='many'"><ElTag type="success">{{ t('signedIn') }}</ElTag><h2>{{ t('manyOrg') }}</h2><div class="organization-options"><button v-for="org in ['青禾咖啡','云岚生活']" :key="org" type="button" @click="chooseOrganization(org)"><strong>{{ org }}</strong><span>{{ t('choose') }} →</span></button></div></template>
      <template v-else-if="identity==='switch_error'"><h2>{{ t('switchDenied') }}</h2><p>{{ t('switchHelp') }}</p><ElButton type="primary" @click="membershipScenario('many')">{{ t('retry') }}</ElButton></template>
      <template v-else><ElTag type="success">{{ t('active') }}</ElTag><h2>{{ organization }}</h2><p>{{ t('independent') }}</p><ElButton @click="membershipScenario('many')">{{ t('chooseAgain') }}</ElButton><ElButton @click="signOut">{{ t('signout') }}</ElButton><p class="subtle">{{ t('signoutHelp') }}</p></template>
    </section>
    <section v-else-if="identity!=='active'" class="review-card" role="alert"><h2>{{ t('denied') }}</h2><p>{{ t('loginHelp') }}</p><ElButton @click="tab='identity'">{{ t('login') }}</ElButton></section>
    <section v-else-if="tab==='marketing'" class="review-card">
      <div class="scenario-controls"><ElButton v-for="state in (['ready','revoked','disabled','unavailable'] as const)" :key="state" :type="scenario===state?'primary':'default'" @click="setScenario(state)">{{ t(state) }}</ElButton></div>
      <h2>{{ t('campaign') }}</h2><p>{{ t('campaignHelp') }}</p><p>{{ t('marketingScope') }}</p><ElButton @click="router.push('/members')">{{ t('consoleEntry') }}</ElButton>
      <div v-if="blocked" class="outcome warning" role="alert"><h3>{{ t('denied') }}</h3><p>{{ t(scenario) }}</p><p>{{ t('deniedHelp') }}</p></div>
      <div v-else-if="campaignState==='unknown'" class="outcome warning" role="status"><h3>{{ t('unknown') }}</h3><p>{{ t('unknownHelp') }}</p><code>{{ operationId }}</code><ElSelect v-model="readbackResult" :aria-label="t('queryScenario')"><ElOption v-for="result in (['unknown','succeeded','failed','denied'] as const)" :key="result" :value="result" :label="t(result==='denied'?'queryDenied':result)" /></ElSelect><div><ElButton type="primary" @click="queryOperation">{{ t('readback') }}</ElButton></div></div>
      <div v-else-if="campaignState==='succeeded'" class="outcome" role="status"><h3>{{ t('succeeded') }}</h3><p>{{ t('receipt') }} · {{ operationId }}</p><p>{{ t('resultHelp') }}</p></div>
      <div v-else-if="campaignState==='failed'" class="outcome warning" role="status"><h3>{{ t('failed') }}</h3><p>{{ t('failedHelp') }}</p><code>{{ operationId }}</code></div>
      <ElButton type="primary" :disabled="blocked || campaignState!=='ready'" @click="dialog='campaign'">{{ t('execute') }}</ElButton>
    </section>
    <section v-else-if="tab==='invitations'" class="review-card">
      <h2>{{ t('invitations') }}</h2><p>{{ t('inviteHelp') }}</p><ElInput v-model="emails" type="textarea" :rows="5" :aria-label="t('input')" @input="parsed=false" />
      <ElButton class="top-space" type="primary" @click="parsed=true">{{ t('parse') }}</ElButton>
      <div v-if="parsed" class="outcome"><h3>{{ t('selected') }} {{ analyzed.addresses.length }}</h3><p>{{ t('invalid') }} {{ analyzed.invalid }} · {{ t('duplicate') }} {{ analyzed.duplicate }} · {{ t('outside') }} {{ analyzed.outside }}</p><p>{{ t('selectedHelp') }}</p><ul><li v-for="address in analyzed.addresses" :key="address">{{ address }}</li></ul><p>{{ t('inviteRole') }}</p><p>{{ t('expires') }}</p><ElButton :disabled="!analyzed.addresses.length || invited" @click="dialog='invite'">{{ t('createInvites') }}</ElButton></div>
      <div v-if="invited" class="outcome" role="status"><h3>{{ t('invitationResult') }}</h3><ul><li v-for="address in currentBatch?.addresses" :key="address">{{ address }} — {{ currentBatch?.results[address] === 'created' ? t('created'):t('inviteUnknown') }}<ElButton v-if="currentBatch?.results[address] === 'unknown'" link type="primary" @click="readInvitation(address)">{{ t('queryItem') }}</ElButton></li></ul><p>{{ t('deliveryPending') }}</p><p>{{ t('inviteRecovery') }}</p></div>
    </section>
    <section v-else-if="tab==='roles'" class="review-card"><h2>{{ t('roles') }}</h2><p>陈予安 · {{ t('owner') }}</p><ElButton @click="notice='lastOwner'">{{ t('demote') }}</ElButton><ElButton @click="notice='grantDenied'">{{ t('delegate') }}</ElButton><div v-if="notice" class="outcome warning" role="alert"><p>{{ t(notice==='lastOwner'?'ownerHelp':'grantHelp') }}</p></div></section>
    <section v-else-if="tab==='customers'" class="review-card">
      <h2>{{ t('customers') }}</h2><p>{{ t('scope') }}</p><ElCheckboxGroup v-model="selected"><table><thead><tr><th>{{ t('selected') }}</th><th>{{ t('customer') }}</th><th>{{ t('ownerColumn') }}</th><th>{{ t('action') }}</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><td><ElCheckbox :value="row.id" :aria-label="row.name" /></td><td>{{ row.name }}</td><td>{{ t(row.mine?'mine':'other') }}</td><td><ElButton link @click="notice=row.mine?'impact':'updateDenied'">{{ t('edit') }}</ElButton></td></tr></tbody></table></ElCheckboxGroup><ElButton type="primary" :disabled="!selected.length" @click="dialog='export'">{{ t('export') }}</ElButton>
    </section>
    <section v-else class="review-card"><h2>{{ t('outbox') }}</h2><p>event-review-001 · {{ t('queued') }} → {{ t('deadletter') }}</p><ElButton @click="dialog='details'">{{ t('inspect') }}</ElButton><div class="outcome"><h3>{{ t('noSample') }}</h3><p>{{ t('sampleHelp') }}</p><code>{{ operationId }}</code><ElButton link @click="copyReference">{{ t('copyId') }}</ElButton></div><div class="outcome"><h3>{{ t('release') }}</h3><p>{{ t('releaseHelp') }}</p><ElTag type="info">{{ t('noDeploy') }}</ElTag></div></section>
    <ElDialog :model-value="!!dialog" :title="t(dialog==='invite'?'invitationReview':dialog==='export'?'exportConfirm':dialog==='details'?'detail':'impact')" width="540px" @close="dialog=''">
      <template v-if="dialog==='campaign'"><p>{{ t('campaign') }} · {{ organization }}</p><p>{{ t('impactHelp') }}</p></template><template v-else-if="dialog==='invite'"><p>{{ t('selected') }} {{ analyzed.addresses.length }} · {{ organization }}</p><p>{{ t('inviteRole') }}</p><p>{{ t('expires') }}</p></template><template v-else-if="dialog==='export'"><p>{{ t('selected') }} {{ selected.length }} · {{ organization }}</p><p>{{ t('exportHelp') }}</p></template><template v-else><p>{{ t('causation') }}: {{ operationId }} / event-review-001</p><p>{{ t('noSecrets') }}</p><p>{{ t('resultHelp') }}</p></template>
      <template #footer><ElButton @click="dialog=''">{{ t(dialog==='details'?'close':'cancel') }}</ElButton><ElButton v-if="dialog!=='details'" type="primary" @click="submit">{{ t(dialog==='invite'?'createInvites':dialog==='export'?'export':'confirm') }}</ElButton></template>
    </ElDialog>
  </section>
</template>
<style scoped>
.f-review { padding:var(--content-padding); color:var(--color-text); }
.review-boundary { border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:12px 16px; background:var(--color-surface-soft); color:var(--color-text-secondary); font-size:12px; margin-bottom:18px; }
.review-tabs { display:flex; flex-wrap:wrap; gap:8px; margin:20px 0; border-bottom:1px solid var(--color-border); padding-bottom:12px; }
.review-tabs button { border:0; background:transparent; color:var(--color-text-secondary); padding:9px 12px; border-radius:6px; cursor:pointer; font:inherit; }
.review-tabs button.active { background:var(--el-color-primary-light-9); color:var(--el-color-primary); }
.review-tabs button:focus-visible { outline:2px solid var(--el-color-primary); }
.review-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:24px; max-width:1120px; min-height:270px; }
h2 { font-size:22px; font-weight:600; margin:15px 0; } h3 { font-size:16px; font-weight:600; margin:0 0 8px; }
p { color:var(--color-text-secondary); line-height:1.75; margin:12px 0; }
.scenario-controls { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:24px; } .scenario-controls :deep(.el-button + .el-button) { margin-left:0; }
.organization-options { display:grid; grid-template-columns:1fr 1fr; gap:14px; max-width:700px; }
.organization-options button { text-align:left; display:flex; flex-direction:column; gap:20px; background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:20px; cursor:pointer; }
.organization-options button:hover { border-color:var(--el-color-primary); } .organization-options span { color:var(--el-color-primary); font-size:13px; }
.outcome { border-left:3px solid var(--el-color-primary); background:var(--color-surface-soft); padding:18px; margin:20px 0; } .warning { border-left-color:var(--el-color-warning); }
.review-notice { padding:12px 16px; border:1px solid var(--color-border); border-radius:8px; } .top-space { margin-top:14px; } .subtle { font-size:12px; } li { padding:5px 0; }
table { width:100%; border-collapse:collapse; margin:20px 0; text-align:left; } th,td { border-bottom:1px solid var(--color-border); padding:14px 8px; } th { color:var(--color-text-secondary); font-weight:500; } code { display:inline-block; color:var(--color-text); margin:8px 12px 8px 0; }
</style>
