import { useState } from 'react';
import { setToken } from '@/lib/auth';

type Props = {
  onSignedIn: () => void;
};

export function LoginScreen({ onSignedIn }: Props) {
  const [pat, setPat] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card bg-base-100 w-full max-w-md shadow border border-base-300">
        <div className="card-body gap-3">
          <h1 className="card-title text-xl">ghweb</h1>
          <p className="text-sm opacity-80">
            Paste a GitHub personal access token (same idea as{' '}
            <code className="text-xs">gh auth token</code>). Stored in{' '}
            <code className="text-xs">sessionStorage</code> for this tab only.
          </p>
          <label className="form-control w-full">
            <span className="label-text text-sm">PAT</span>
            <input
              type="password"
              className="input input-bordered w-full bg-base-100 text-base-content border-base-300"
              autoComplete="off"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="ghp_… or github_pat_…"
            />
          </label>
          {error ? (
            <div className="alert alert-error text-sm py-2">{error}</div>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pat.trim()}
            onClick={() => {
              if (!pat.trim()) {
                setError('Token is required');
                return;
              }
              setToken(pat);
              setError(null);
              onSignedIn();
            }}
          >
            Continue
          </button>
          <p className="text-xs opacity-60">
            Recommended scopes: <code>repo</code>, <code>read:org</code>,{' '}
            <code>read:user</code>, <code>workflow</code> (Actions logs /
            deploy reviews). Fine-grained: repo + Actions read/write as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
