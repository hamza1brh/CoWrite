import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // For database sessions, we'll handle redirects in the page components
    // This middleware will just handle protected API routes
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow all page routes - let components handle auth
        if (!pathname.startsWith("/api/")) {
          return true;
        }

        // Allow ALL API routes to reach their handlers
        // Let the API endpoints handle their own authentication and return proper JSON errors
        if (pathname.startsWith("/api/")) {
          return true;
        }

        // Default: allow access
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
