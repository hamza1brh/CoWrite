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
    // Credentials provider for email/password authentication
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email address",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }

        // Find or create user by email
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Create a new user with the provided email
          const nameParts = credentials.email.split("@")[0].split(/[._-]/);
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";

          user = await prisma.user.create({
            data: {
              email: credentials.email,
              firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
              lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
              name:
                `${firstName} ${lastName}`.trim() ||
                credentials.email.split("@")[0],
              imageUrl: "/placeholder-user.jpg",
            },
          });

          console.log(`✅ Created new user: ${user.email}`);
        }

        // In production, you should verify password hashes here
        // For now, accepting any password for demo purposes
        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`.trim(),
          image: user.imageUrl,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;

        // Sync user data with our database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
        });

        if (dbUser) {
          session.user.dbUser = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            imageUrl: dbUser.imageUrl,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          };
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) {
          return false; // Reject sign-in if no email
        }

        // Upsert user when signing in with OAuth
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              name: user.name || "",
              imageUrl: user.image || "/placeholder-user.jpg",
            },
          });
        } else {
          // Update existing user with latest info
          await prisma.user.update({
            where: { email: user.email },
            data: {
              firstName: user.name?.split(" ")[0] || existingUser.firstName,
              lastName:
                user.name?.split(" ").slice(1).join(" ") ||
                existingUser.lastName,
              name: user.name || existingUser.name,
              imageUrl: user.image || existingUser.imageUrl,
            },
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the dashboard after successful authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
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
