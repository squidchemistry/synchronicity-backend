import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/api/auth"]

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If not authenticated and trying to access a protected route, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // If authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except for static files, _next, and api/auth routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}

