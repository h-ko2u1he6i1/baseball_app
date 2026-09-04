import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// サーバー専用クライアント。RLS をバイパスするため Server Action / Route Handler からのみ利用する。
// キーは Supabase の Secret key (sb_secret_...) を使う。旧 service_role JWT でも動くが、
// legacy API keys を無効化している場合は Secret key が必須。
// 遅延生成にすることで、環境変数が無いビルド環境でもモジュール評価では失敗しない。

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // 新: SUPABASE_SECRET_KEY / 旧: SUPABASE_SERVICE_ROLE_KEY のどちらでも受け付ける
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY');
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
