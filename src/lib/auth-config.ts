import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    // Credentials provider disabled for production security
    // Use OAuth providers (Google, GitHub) for secure authentication
    // CredentialsProvider({
    //   name: "Email & Password",
    //   credentials: {
    //     email: {
    //       label: "Email",
    //       type: "email",
    //       placeholder: "Enter your email address",
    //     },
    //     password: {
    //       label: "Password",
    //       type: "password",
    //       placeholder: "Enter your password",
    //     },
    //   },
    //   async authorize(credentials) {
    //     // SECURITY: This was allowing any user to login with any email/password
    //     // For production, implement proper password hashing and verification
    //     throw new Error("Credentials login disabled for security. Please use OAuth providers.");
    //   },
    // }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      // With PrismaAdapter and database sessions, user comes from database automatically
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) {
          console.log("❌ OAuth sign-in rejected: No email provided");
          return false;
        }

        // Ensure email is verified for OAuth providers
        if (
          account.provider === "google" &&
          profile &&
          "email_verified" in profile &&
          profile.email_verified !== true
        ) {
          console.log("❌ Google sign-in rejected: Email not verified");
          return false;
        }

        console.log(`✅ OAuth sign-in allowed for: ${user.email}`);
        return true;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log(`🔄 NextAuth redirect - URL: ${url}, BaseURL: ${baseUrl}`);

      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log(`🔄 Relative redirect to: ${redirectUrl}`);
        return redirectUrl;
      }

      // If it's on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        console.log(`🔄 Same origin redirect to: ${url}`);
        return url;
      }

      // For OAuth callbacks, redirect to dashboard
      if (url.includes("/api/auth/callback/")) {
        console.log(`🔄 OAuth callback redirect to dashboard`);
        return `${baseUrl}/`;
      }

      // Default: redirect to dashboard
      console.log(`🔄 Default redirect to dashboard`);
      return `${baseUrl}/`;
    },
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/welcome",
    error: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
