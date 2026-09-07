# プロ野球観戦記録アプリ

Next.js (App Router) + MUI + Supabase。試合データは npb.jp をスクレイピングして取得する。

## アーキテクチャ

| 層 | 実装 |
|---|---|
| 一覧取得 | Server Component (`app/page.tsx`) が Secret key で Supabase から取得 |
| 追加 / 編集 / 削除 | Server Actions (`app/actions.ts`)。RLS をバイパスする Secret key を使用 |
| スクレイピング | `lib/scrape.ts`（純ロジック）+ `app/api/cron/scrape/route.ts`（Vercel Cron） |
| 集計・日付 | `lib/stats.ts` / `lib/date.ts`（純関数・ユニットテスト対象） |
| 認証 | `proxy.ts` の Basic 認証（`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`） |

ブラウザから Supabase を直接叩かない。anon key は使用しない。

## セットアップ

1. `.env.example` を `.env.local` にコピーして値を設定
2. `npm install`
3. `npm run dev`

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest（`lib/*.test.ts`） |

## 型（任意）

Supabase のスキーマ型を付けるなら:

```
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

生成後、`lib/supabase/admin.ts` の `createClient` を `createClient<Database>(...)` に差し替える。

## Supabase

- `db/rls.sql` を SQL Editor で実行し、`games` / `records` の RLS を有効化（anon 全拒否）
- `games.game_code` に UNIQUE 制約（UPSERT のキー）

## Vercel デプロイ

1. 環境変数を設定: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`, `CRON_SECRET`
2. `vercel.json` の Cron が毎日 05:00 JST に `/api/cron/scrape` を実行（直近4日分を再取得）
3. `CRON_SECRET` を設定すると Vercel が Cron 実行時に `Authorization: Bearer` を自動付与する

## 注意

- npb.jp の HTML 構造が変わるとスクレイピングが壊れる（`lib/scrape.ts` のセレクタ）
- 個人〜仲間内利用を想定。大量アクセスや商用公開はしない
