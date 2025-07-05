import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Redirect unauthenticated users from root to welcome page
    if (pathname === "/" && !req.nextauth.token) {
      return Response.redirect(new URL("/welcome", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicRoutes = ["/welcome", "/sign-in", "/sign-up", "/api/auth"];

        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Protected routes that require authentication
        const protectedRoutes = [
          "/",
          "/editor",
          "/api/documents",
          "/api/comments",
          "/api/users",
        ];

        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token;
        }

        // Default: require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/welcome",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
