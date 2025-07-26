import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 認証が必要なパス
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 認証不要なパスの場合はそのまま通す
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    // BetterAuthでセッション確認
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // セッションがない場合はログインページにリダイレクト
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 認証済みの場合はそのまま通す
    return NextResponse.next();
  } catch (error) {
    // エラーの場合もログインページにリダイレクト
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// middlewareを適用するパスの設定
export const config = {
  matcher: [
    "/dashboard/:path*",
    // API routesは除外（Better Authが処理）
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
