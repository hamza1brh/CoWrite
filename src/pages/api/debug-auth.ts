import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 DEBUG AUTH - Starting authentication debug");

    // Get raw session
    const session = await getServerSession(req, res, authOptions);
    console.log(
      "🔍 DEBUG AUTH - Raw session:",
      JSON.stringify(session, null, 2)
    );

    if (!session) {
      return res.json({
        status: "No session found",
        session: null,
        user: null,
        dbUser: null,
      });
    }

    // Try to get user from our helper
    let dbUser = null;
    let authError = null;

    try {
      dbUser = await getUserFromRequest(req, res);
      console.log("✅ DEBUG AUTH - Successfully got user from request");
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
      console.log("❌ DEBUG AUTH - Error getting user:", authError);
    }

    // Check all users in database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    console.log(
      `🔍 DEBUG AUTH - Found ${allUsers.length} users in database:`,
      allUsers
    );

    return res.json({
      status: "Debug complete",
      session: {
        user: session.user,
        expires: session.expires,
      },
      authError,
      dbUser: dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
          }
        : null,
      allUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DEBUG AUTH ERROR:", error);
    return res.status(500).json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
