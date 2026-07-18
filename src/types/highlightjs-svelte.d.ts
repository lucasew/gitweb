declare module 'highlightjs-svelte' {
  import type { LanguageFn } from 'highlight.js';

  export default function registerSvelte(hljs: {
    registerLanguage(name: string, language: LanguageFn): void;
  }): void;
}
