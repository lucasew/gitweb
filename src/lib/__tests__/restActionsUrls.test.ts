import { describe, expect, it } from 'vitest';
import {
  githubActionsHomeUrl,
  githubActionsJobUrl,
  githubActionsRunUrl,
} from '../rest';

const origin = 'https://ghe.example.com';

describe('Actions web URLs', () => {
  it('builds run / home / job urls for GHE origin', () => {
    expect(githubActionsRunUrl('o', 'r', 99, origin)).toBe(
      'https://ghe.example.com/o/r/actions/runs/99',
    );
    expect(githubActionsRunUrl('o', 'r', null, origin)).toBe(
      'https://ghe.example.com/o/r/actions',
    );
    expect(githubActionsHomeUrl('o', 'r', origin)).toBe(
      'https://ghe.example.com/o/r/actions',
    );
    expect(githubActionsJobUrl('o', 'r', 99, 7, origin)).toBe(
      'https://ghe.example.com/o/r/actions/runs/99/job/7',
    );
    expect(githubActionsJobUrl('o', 'r', null, 7, origin)).toBeNull();
  });
});
