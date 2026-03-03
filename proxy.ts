import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth proxy — protect ERP routes, allow auth pages
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths — no auth needed
    const publicPaths = ["/login", "/register", "/forgot-password", "/api/auth"];
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    if (isPublic) {
        return NextResponse.next();
    }

    // Check session token
    const token =
        request.cookies.get("authjs.session-token")?.value ||
        request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token && !pathname.startsWith("/api")) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (!token && pathname.startsWith("/api/v1")) {
        return NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
            { status: 401 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - public files (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
