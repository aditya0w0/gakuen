import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
    "/user",
    "/browse",
    "/my-classes",
    "/settings",
    "/dashboard",
    "/users",
    "/class",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth session cookie (set by authCookies.set())
    const sessionCookie = request.cookies.get("user-session")?.value;

    // Check if trying to access protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // If accessing protected route without session, redirect to login
    if (isProtectedRoute && !sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If accessing auth routes with session, redirect to dashboard
    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL("/user", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all protected routes
        "/user/:path*",
        "/browse/:path*",
        "/my-classes/:path*",
        "/settings/:path*",
        "/dashboard/:path*",
        "/users/:path*",
        "/class/:path*",
        // Match auth routes
        "/login",
        "/signup",
    ],
};
