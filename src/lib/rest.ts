import { getToken } from '@/lib/auth';

const API = 'https://api.github.com';

export type RestPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
};

export async function fetchPullFiles(
  owner: string,
  repo: string,
  number: number,
): Promise<RestPullFile[]> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');

  const out: RestPullFile[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `${API}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`REST pull files ${res.status}: ${body.slice(0, 400)}`);
    }
    const batch = (await res.json()) as RestPullFile[];
    out.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 20) break;
  }
  return out;
}
