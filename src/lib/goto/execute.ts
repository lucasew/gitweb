import { appPathForObject } from '@/lib/repoPath';
import { probeRepoPath } from '@/lib/rest';
import type { GotoAction } from './types';

export type GotoExecuteDeps = {
  navigate: (to: string) => void | Promise<void>;
  toastError: (title: string, detail?: string) => void;
};

export type GotoExecuteResult = 'navigated' | 'missing' | 'error';

/**
 * Run a goto action. Path probes never navigate on 404 (toast via deps).
 */
export async function executeGoto(
  action: GotoAction,
  deps: GotoExecuteDeps,
): Promise<GotoExecuteResult> {
  if (action.kind === 'navigate') {
    await deps.navigate(action.to);
    return 'navigated';
  }

  try {
    const kind = await probeRepoPath(
      action.owner,
      action.name,
      action.ref,
      action.path,
    );
    if (!kind) {
      const display = action.path || '/';
      deps.toastError(
        'Path not found',
        `${display} does not exist on ${action.ref}`,
      );
      return 'missing';
    }
    const to = appPathForObject(
      action.owner,
      action.name,
      action.ref,
      action.path,
      kind,
    );
    await deps.navigate(to);
    return 'navigated';
  } catch (e) {
    deps.toastError(
      'Could not open path',
      e instanceof Error ? e.message : String(e),
    );
    return 'error';
  }
}
