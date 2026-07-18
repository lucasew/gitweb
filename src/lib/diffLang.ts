/**
 * Map a file path to a highlight.js / lowlight language id for @git-diff-view.
 *
 * DiffFile's built-in getLang() only peels the extension (`foo.rs` → `rs`),
 * but hljs registers `rust` not `rs`. We normalize common cases; unknown
 * extensions pass through (hljs falls back to highlightAuto if unregistered).
 */

const EXT_TO_LANG: Record<string, string> = {
  // JS / TS family
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  // systems / systems-y
  rs: 'rust',
  go: 'go',
  c: 'c',
  h: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  m: 'objectivec',
  mm: 'objectivec',
  // JVM / .NET
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  groovy: 'groovy',
  gradle: 'gradle',
  cs: 'csharp',
  fs: 'fsharp',
  fsx: 'fsharp',
  // scripting
  py: 'python',
  pyi: 'python',
  pyw: 'python',
  rb: 'ruby',
  rake: 'ruby',
  php: 'php',
  pl: 'perl',
  pm: 'perl',
  lua: 'lua',
  r: 'r',
  // shells
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'bash',
  ps1: 'powershell',
  psm1: 'powershell',
  // web / markup
  html: 'xml',
  htm: 'xml',
  xhtml: 'xml',
  xml: 'xml',
  svg: 'xml',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  vue: 'vue',
  svelte: 'svelte',
  svx: 'svelte',
  // data / config
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  ini: 'ini',
  conf: 'ini',
  cfg: 'ini',
  env: 'bash',
  properties: 'properties',
  // docs
  md: 'markdown',
  mdx: 'markdown',
  markdown: 'markdown',
  rst: 'markdown',
  // other
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  proto: 'protobuf',
  nix: 'nix',
  tf: 'hcl',
  hcl: 'hcl',
  dockerfile: 'dockerfile',
  cmake: 'cmake',
  mk: 'makefile',
  make: 'makefile',
  swift: 'swift',
  dart: 'dart',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  hs: 'haskell',
  lhs: 'haskell',
  clj: 'clojure',
  cljs: 'clojure',
  elm: 'elm',
  zig: 'plaintext', // not always in hljs; avoid bad auto on noise
  wasm: 'wasm',
  wat: 'lisp',
  diff: 'diff',
  patch: 'diff',
};

const BASENAME_TO_LANG: Record<string, string> = {
  dockerfile: 'dockerfile',
  containerfile: 'dockerfile',
  makefile: 'makefile',
  gnumakefile: 'makefile',
  'cmakelists.txt': 'cmake',
  'cargo.toml': 'ini',
  'cargo.lock': 'ini',
  'go.mod': 'go',
  'go.sum': 'go',
  gemfile: 'ruby',
  rakefile: 'ruby',
  podfile: 'ruby',
  brewfile: 'ruby',
  procfile: 'yaml',
  '.gitignore': 'plaintext',
  '.dockerignore': 'plaintext',
  '.env': 'bash',
  '.env.example': 'bash',
  '.eslintrc': 'json',
  '.prettierrc': 'json',
  'tsconfig.json': 'json',
  'package.json': 'json',
  'composer.json': 'json',
};

/**
 * Resolve a lowlight/hljs language id from a repo-relative path.
 */
export function langFromPath(path: string | null | undefined): string {
  if (!path) return 'plaintext';
  const normalized = path.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? '';
  const baseLower = base.toLowerCase();

  if (BASENAME_TO_LANG[baseLower]) {
    return BASENAME_TO_LANG[baseLower];
  }

  // e.g. Dockerfile.dev, Makefile.am
  if (/^dockerfile(\.|$)/i.test(base)) return 'dockerfile';
  if (/^makefile(\.|$)/i.test(base)) return 'makefile';

  const dot = baseLower.lastIndexOf('.');
  if (dot <= 0 || dot === baseLower.length - 1) {
    return 'plaintext';
  }
  const ext = baseLower.slice(dot + 1);
  return EXT_TO_LANG[ext] ?? ext;
}
