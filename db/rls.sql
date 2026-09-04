-- ============================================================
-- Supabase RLS 設定
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行する。
-- 上から順に、1ブロックずつ実行して結果を確認するのが安全。
-- ============================================================

-- ------------------------------------------------------------
-- 0) 事前確認: game_code に重複が無いか
--    (次の UNIQUE 制約を貼るために必要。行が返ってきたら重複あり)
-- ------------------------------------------------------------
select game_code, count(*)
from public.games
group by game_code
having count(*) > 1;

-- 重複があった場合の掃除の例（新しい id を残して古い方を削除）:
-- delete from public.games a
-- using public.games b
-- where a.game_code = b.game_code and a.id < b.id;


-- ------------------------------------------------------------
-- 1) game_code の UNIQUE 制約（UPSERT の onConflict キー）
--    すでにあればエラーになるので、その場合はこのブロックはスキップ
-- ------------------------------------------------------------
alter table public.games
  add constraint games_game_code_key unique (game_code);


-- ------------------------------------------------------------
-- 2) RLS を有効化
-- ------------------------------------------------------------
alter table public.games   enable row level security;
alter table public.records enable row level security;


-- ------------------------------------------------------------
-- 3) 既存の緩いポリシーを削除
--    まず現状を確認:
--      select schemaname, tablename, policyname
--      from pg_policies where schemaname = 'public';
--    表示された policyname をここに列挙して削除する（例）:
-- ------------------------------------------------------------
-- drop policy if exists "Enable read access for all users"  on public.games;
-- drop policy if exists "Enable insert for all users"       on public.games;
-- drop policy if exists "Enable read access for all users"  on public.records;
-- drop policy if exists "Enable insert for all users"       on public.records;
-- drop policy if exists "Enable update for all users"       on public.records;
-- drop policy if exists "Enable delete for all users"       on public.records;


-- ------------------------------------------------------------
-- 4) 完了確認
--    アプリは service role key 経由でアクセスするため RLS をバイパスする。
--    anon / authenticated 向けポリシーを一切作らない = 公開キーからは何もできない。
-- ------------------------------------------------------------
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('games', 'records');
-- rowsecurity が両方 true なら OK
