import {
  fetchQuery,
  graphql,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { useEffect, useId, useRef, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import type { RequestReviewersModalMutation } from './__generated__/RequestReviewersModalMutation.graphql';
import type { RequestReviewersModalSearchQuery } from './__generated__/RequestReviewersModalSearchQuery.graphql';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/cls';

export type ReviewerUser = {
  id: string;
  login: string;
  name?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  pullRequestId: string;
  owner: string;
  name: string;
  /** Currently requested user reviewers */
  requested: ReviewerUser[];
  /** GitHub suggested reviewers */
  suggested: ReviewerUser[];
  onChanged?: () => void;
};

const requestMutation = graphql`
  mutation RequestReviewersModalMutation(
    $pullRequestId: ID!
    $userIds: [ID!]!
    $union: Boolean!
  ) {
    requestReviews(
      input: {
        pullRequestId: $pullRequestId
        userIds: $userIds
        union: $union
      }
    ) {
      pullRequest {
        id
        reviewRequests(first: 40) {
          nodes {
            id
            asCodeOwner
            requestedReviewer {
              __typename
              ... on User {
                id
                login
                userName: name
                avatarUrl(size: 40)
              }
              ... on Team {
                id
                teamName: name
                combinedSlug
              }
              ... on Bot {
                id
                login
                avatarUrl(size: 40)
              }
            }
          }
        }
      }
    }
  }
`;

const searchQuery = graphql`
  query RequestReviewersModalSearchQuery(
    $owner: String!
    $name: String!
    $q: String!
  ) {
    repository(owner: $owner, name: $name) {
      assignableUsers(query: $q, first: 20) {
        nodes {
          id
          login
          name
          avatarUrl(size: 40)
        }
      }
    }
  }
`;

function UserRow({
  user,
  actionLabel,
  onAction,
  disabled,
  secondary,
}: {
  user: ReviewerUser;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  secondary?: string;
}) {
  return (
    <li className="flex items-center gap-2 py-1.5 min-w-0">
      <div className="avatar shrink-0">
        <div className="size-7 rounded-full overflow-hidden bg-transparent">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-full object-cover bg-transparent"
            />
          ) : (
            <div className="bg-neutral text-neutral-content size-full flex items-center justify-center text-xs">
              {user.login[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-sm font-medium truncate">
          {user.name?.trim() || user.login}
        </div>
        <div className="text-xs opacity-60 truncate">
          @{user.login}
          {secondary ? ` · ${secondary}` : null}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-xs shrink-0"
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </li>
  );
}

/**
 * daisyUI dialog modal to request / remove PR reviewers (GraphQL requestReviews).
 */
export function RequestReviewersModal({
  open,
  onClose,
  pullRequestId,
  owner,
  name,
  requested: requestedProp,
  suggested,
  onChanged,
}: Props) {
  const toast = useToast();
  const env = useRelayEnvironment();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<ReviewerUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [localRequested, setLocalRequested] =
    useState<ReviewerUser[]>(requestedProp);
  const [commitRequest, busy] =
    useMutation<RequestReviewersModalMutation>(requestMutation);

  useEffect(() => {
    setLocalRequested(requestedProp);
  }, [requestedProp]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
      setQ('');
      setHits([]);
    } else if (d.open) {
      d.close();
    }
  }, [open]);

  // Debounced assignableUsers search
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term) {
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(() => {
      void fetchQuery<RequestReviewersModalSearchQuery>(
        env,
        searchQuery,
        { owner, name, q: term },
        { fetchPolicy: 'network-only' },
      )
        .toPromise()
        .then((data) => {
          if (cancelled) return;
          const nodes =
            data?.repository?.assignableUsers?.nodes?.filter(Boolean) ?? [];
          setHits(
            nodes.map((u) => ({
              id: u!.id,
              login: u!.login,
              name: u!.name ?? null,
              avatarUrl: u!.avatarUrl ?? null,
            })),
          );
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          toast.error(
            'Search failed',
            e instanceof Error ? e.message : String(e),
          );
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      // Drop in-flight results when the query changes or the modal closes.
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, open, owner, name, env, toast]);

  const requestedIds = new Set(localRequested.map((u) => u.id));

  const applyFromPayload = (
    nodes: ReadonlyArray<{
      readonly requestedReviewer?: {
        readonly __typename: string;
        readonly id?: string;
        readonly login?: string;
        readonly userName?: string | null;
        readonly avatarUrl?: string | null;
      } | null;
    } | null | undefined> | null | undefined,
  ) => {
    const next: ReviewerUser[] = [];
    for (const n of nodes ?? []) {
      if (!n) continue;
      const r = n.requestedReviewer;
      if (!r || r.__typename !== 'User' || !r.id || !r.login) continue;
      next.push({
        id: r.id,
        login: r.login,
        name: r.userName ?? null,
        avatarUrl: r.avatarUrl ?? null,
      });
    }
    setLocalRequested(next);
  };

  const addUser = (user: ReviewerUser) => {
    if (requestedIds.has(user.id) || busy) return;
    commitRequest({
      variables: {
        pullRequestId,
        userIds: [user.id],
        union: true,
      },
      onCompleted: (res) => {
        applyFromPayload(
          res.requestReviews?.pullRequest?.reviewRequests?.nodes ?? null,
        );
        toast.info(`Requested review from @${user.login}`);
        onChanged?.();
      },
      onError: (e) => toast.error('Could not request review', e.message),
    });
  };

  const removeUser = (user: ReviewerUser) => {
    if (busy) return;
    // union:false replaces the full set — omit this user
    const remaining = localRequested
      .filter((u) => u.id !== user.id)
      .map((u) => u.id);
    commitRequest({
      variables: {
        pullRequestId,
        userIds: remaining,
        union: false,
      },
      onCompleted: (res) => {
        applyFromPayload(
          res.requestReviews?.pullRequest?.reviewRequests?.nodes ?? null,
        );
        toast.info(`Removed @${user.login}`);
        onChanged?.();
      },
      onError: (e) => toast.error('Could not remove reviewer', e.message),
    });
  };

  const candidates = (q.trim() ? hits : suggested).filter(
    (u) => !requestedIds.has(u.id),
  );

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      aria-labelledby={titleId}
    >
      <div className="modal-box max-w-md flex flex-col gap-3 max-h-[min(90dvh,36rem)]">
        <div className="flex items-start justify-between gap-2">
          <h3 id={titleId} className="font-bold text-lg">
            Request reviewers
          </h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <label className="input input-bordered input-sm flex items-center gap-2 w-full">
          <Search className="size-4 opacity-50 shrink-0" aria-hidden />
          <input
            type="search"
            className="grow min-w-0"
            placeholder="Search people…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            disabled={busy}
          />
          {searching ? (
            <span className="loading loading-spinner loading-xs shrink-0" />
          ) : null}
        </label>

        {localRequested.length > 0 ? (
          <div className="min-w-0">
            <div className="text-xs font-medium opacity-60 mb-1">
              Requested ({localRequested.length})
            </div>
            <ul className="divide-y divide-base-300">
              {localRequested.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  actionLabel="Remove"
                  disabled={busy}
                  onAction={() => removeUser(u)}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm opacity-60">No reviewers requested yet.</p>
        )}

        <div className="min-w-0 flex-1 overflow-y-auto min-h-0">
          <div className="text-xs font-medium opacity-60 mb-1">
            {q.trim() ? 'Search results' : 'Suggestions'}
          </div>
          {candidates.length === 0 ? (
            <p className="text-sm opacity-50 py-2">
              {q.trim()
                ? searching
                  ? 'Searching…'
                  : 'No matching assignable users.'
                : 'No suggestions. Try searching by login.'}
            </p>
          ) : (
            <ul className="divide-y divide-base-300">
              {candidates.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  actionLabel="Request"
                  disabled={busy}
                  onAction={() => addUser(u)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="modal-action mt-0">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => dialogRef.current?.close()}
          >
            Done
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close backdrop">
          close
        </button>
      </form>
    </dialog>
  );
}

/** Compact chips of requested reviewers + open modal */
export function RequestedReviewersStrip({
  requested,
  onOpenModal,
  className,
}: {
  requested: ReviewerUser[];
  onOpenModal: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="text-xs font-medium opacity-60">Reviewers</span>
      {requested.length === 0 ? (
        <span className="text-xs opacity-50">None</span>
      ) : (
        requested.map((u) => (
          <span
            key={u.id}
            className="badge badge-sm badge-ghost gap-1 font-normal"
            title={u.name ? `${u.name} (@${u.login})` : `@${u.login}`}
          >
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt=""
                className="size-3.5 rounded-full bg-transparent"
              />
            ) : null}
            @{u.login}
          </span>
        ))
      )}
      <button
        type="button"
        className="btn btn-ghost btn-xs gap-1"
        onClick={onOpenModal}
      >
        <UserPlus className="size-3.5" aria-hidden />
        Edit
      </button>
    </div>
  );
}
