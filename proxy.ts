import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // api / 静的ファイル / assets を除く全ページに Basic 認証を適用
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
};

/** タイミング攻撃を避けるための一定時間比較 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const unauthorized = () =>
  new NextResponse('Authentication Required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });

export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // 未設定なら認証スキップ（ローカル開発向け）
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep === -1) return unauthorized();

  const providedUser = decoded.slice(0, sep);
  const providedPass = decoded.slice(sep + 1);

  if (safeEqual(providedUser, user) && safeEqual(providedPass, pass)) {
    return NextResponse.next();
  }
  return unauthorized();
}
