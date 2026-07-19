import { describe, expect, it } from 'vitest';
import {
  normalizeGraphqlUrl,
  restBaseFromGraphql,
  webHostFromGraphql,
  webOriginFromGraphql,
  DEFAULT_GRAPHQL_BASE,
} from '../auth';

describe('auth URL helpers', () => {
  it('normalizes github GraphQL endpoints', () => {
    expect(normalizeGraphqlUrl('')).toBe(DEFAULT_GRAPHQL_BASE);
    expect(normalizeGraphqlUrl('https://api.github.com')).toBe(
      DEFAULT_GRAPHQL_BASE,
    );
    expect(normalizeGraphqlUrl('https://api.github.com/graphql/')).toBe(
      'https://api.github.com/graphql',
    );
  });

  it('normalizes GHE GraphQL endpoints', () => {
    expect(normalizeGraphqlUrl('ghe.example.com')).toBe(
      'https://ghe.example.com/api/graphql',
    );
    expect(normalizeGraphqlUrl('https://ghe.example.com/api')).toBe(
      'https://ghe.example.com/api/graphql',
    );
    expect(normalizeGraphqlUrl('https://ghe.example.com/api/graphql')).toBe(
      'https://ghe.example.com/api/graphql',
    );
  });

  it('derives REST base from GraphQL', () => {
    expect(restBaseFromGraphql(DEFAULT_GRAPHQL_BASE)).toBe(
      'https://api.github.com',
    );
    expect(restBaseFromGraphql('https://ghe.example.com/api/graphql')).toBe(
      'https://ghe.example.com/api/v3',
    );
  });

  it('derives web host and origin (github.com vs GHE)', () => {
    expect(webHostFromGraphql(DEFAULT_GRAPHQL_BASE)).toBe('github.com');
    expect(webOriginFromGraphql(DEFAULT_GRAPHQL_BASE)).toBe(
      'https://github.com',
    );
    expect(webHostFromGraphql('https://ghe.example.com/api/graphql')).toBe(
      'ghe.example.com',
    );
    expect(webOriginFromGraphql('https://ghe.example.com/api/graphql')).toBe(
      'https://ghe.example.com',
    );
  });
});
