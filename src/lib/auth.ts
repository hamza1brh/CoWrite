import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest } from "next";
import { prisma } from "./prisma";

export async function getUserFromRequest(req: NextApiRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user && process.env.NODE_ENV === "development") {
    console.log(
      "User not synced locally, using first available user for testing..."
    );

    user = await prisma.user.findFirst();

    if (!user) {
      throw new Error(
        "No users found in database. Please test in production or add a user via webhook."
      );
    }

    console.log("Using test user:", user.email);
  }

  if (!user) {
    throw new Error("User not found in database");
  }

  return user;
}

export function requireAuth(req: NextApiRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
