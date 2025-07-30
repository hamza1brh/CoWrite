import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development mode for security
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 DEBUG SESSION - Starting session debug");

    // Get raw session
    const session = await getServerSession(req, res, authOptions);
    console.log(
      "🔍 DEBUG SESSION - Raw session:",
      JSON.stringify(session, null, 2)
    );

    if (!session) {
      return res.json({
        status: "No session found",
        session: null,
        user: null,
        dbUser: null,
        allUsers: await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            emailVerified: true,
            createdAt: true,
          },
        }),
      });
    }

    // Check user in database
    let dbUser = null;
    if (session.user?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // Check all users in database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log(
      `🔍 DEBUG SESSION - Found ${allUsers.length} users in database:`,
      allUsers
    );

    return res.json({
      status: "Debug complete",
      session: {
        user: session.user,
        expires: session.expires,
      },
      dbUser: dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            emailVerified: dbUser.emailVerified,
          }
        : null,
      allUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEBUG SESSION ERROR:", error);
    return res.status(500).json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
