// Next.js 16 の eslint-config-next はフラットコンフィグ配列を直接エクスポートする
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // localStorage / URL からの初期化など「外部システムとの同期」目的の
      // effect 内 setState は許容する（エラーではなく警告に留める）
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default config;
