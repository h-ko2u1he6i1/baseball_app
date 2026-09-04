import { NextRequest, NextResponse } from 'next/server';

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - assets (public asset files)
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
};

export function middleware(req: NextRequest) {
  // 環境変数からユーザー名とパスワードを取得
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // 環境変数が設定されていなければ、認証をスキップ（開発環境などで便利）
  if (!user || !pass) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // atob()はBase64をデコードする関数
    const [providedUser, providedPass] = atob(authValue).split(':');

    if (providedUser === user && providedPass === pass) {
      return NextResponse.next();
    }
  }

  // 認証情報がない、または正しくない場合は401 Unauthorizedを返す
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
