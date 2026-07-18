export type {
  GotoAction,
  GotoCandidate,
  GotoContext,
  GotoIcon,
  GotoProvider,
} from './types';
export { buildGotoContext } from './context';
export { collectGotoCandidates, groupCandidates } from './collect';
export { executeGoto, type GotoExecuteDeps, type GotoExecuteResult } from './execute';
export { parseSlashCommand } from './slash';
export { defaultProviders } from './providers';
