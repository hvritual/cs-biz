import { onBeforeUnmount, shallowRef, watch } from 'vue';

import type { RequestContext } from '#/api/mock/types';
import { useWorkspaceStore } from '#/store';

/** Data is discarded synchronously whenever its workspace or access generation changes. */
export function useResource<T>(loader: (context: RequestContext) => Promise<T>, initial: T) {
  const workspace = useWorkspaceStore();
  const data = shallowRef<T>(initial);
  const loading = shallowRef(false);
  const error = shallowRef<unknown>(null);
  let controller: AbortController | undefined;
  let sequence = 0;

  async function refresh() {
    const request = ++sequence;
    controller?.abort();
    controller = new AbortController();
    error.value = null;
    if (!workspace.context || !workspace.ready) {
      data.value = initial;
      loading.value = workspace.loading;
      return;
    }
    const generation = workspace.generation;
    const context = { ...workspace.requestContext(), signal: controller.signal };
    loading.value = true;
    const current = () => sequence === request && generation === workspace.generation && !context.signal.aborted;
    try {
      const result = await loader(context);
      if (current()) data.value = result;
    } catch (cause) {
      if (current()) {
        data.value = initial;
        error.value = cause;
      }
    } finally {
      if (current()) loading.value = false;
    }
  }

  watch(() => workspace.generation, () => {
    sequence++;
    controller?.abort();
    data.value = initial;
    error.value = null;
  }, { flush: 'sync' });
  watch(() => [workspace.ready, workspace.revision, workspace.context?.accessVersion], refresh, { immediate: true });
  onBeforeUnmount(() => { sequence++; controller?.abort(); });
  return { data, loading, error, refresh };
}
