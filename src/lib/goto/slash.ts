/** Normalized slash commands: /code, /issues, /prs, /search [rest] */

export type SlashCommand = {
  cmd: 'code' | 'issues' | 'prs' | 'search';
  rest: string;
};

const ALIASES: Record<string, SlashCommand['cmd']> = {
  code: 'code',
  issues: 'issues',
  issue: 'issues',
  prs: 'prs',
  pulls: 'prs',
  pr: 'prs',
  pull: 'prs',
  search: 'search',
  s: 'search',
};

export function parseSlashCommand(q: string): SlashCommand | null {
  if (!q.startsWith('/')) return null;
  const body = q.slice(1).trim();
  const [cmdRaw, ...restParts] = body.split(/\s+/);
  const raw = (cmdRaw ?? '').toLowerCase();
  if (!raw) return null;
  const cmd = ALIASES[raw];
  if (!cmd) return null;
  return { cmd, rest: restParts.join(' ').trim() };
}

export function slashMatches(
  slash: SlashCommand,
  section: 'code' | 'issues' | 'prs',
): boolean {
  return slash.cmd === section;
}
