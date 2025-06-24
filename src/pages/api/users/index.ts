// Create src/pages/api/users/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);

    console.log("🔍 Creating/Finding user - Clerk ID:", userId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { clerkId, email, firstName, lastName, imageUrl } = req.body;

    console.log("🔍 User data:", {
      clerkId,
      email,
      firstName,
      lastName,
    });


    if (clerkId !== userId) {
      return res.status(403).json({ error: "Forbidden - Clerk ID mismatch" });
    }

    //  Strategy 1: Try to find by Clerk ID first
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (user) {
      console.log("✅ User found by Clerk ID:", user.id);
      return res.json(user);
    }

    //  Strategy 2: If not found by Clerk ID, try to find by email
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (user) {
        console.log("🔄 User found by email, updating Clerk ID...");

        // Update the existing user with the current environment's Clerk ID
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkId: userId, // Update to current environment's Clerk ID
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            imageUrl: imageUrl || user.imageUrl,
          },
        });

        console.log("✅ User updated with new Clerk ID:", {
          id: updatedUser.id,
          oldClerkId: user.clerkId || "null", 
          newClerkId: updatedUser.clerkId,
          email: updatedUser.email,
        });

        return res.json(updatedUser);
      }
    }

    // ✅ Strategy 3: Create new user if not found by either method
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email || "",
        firstName: firstName || "",
        lastName: lastName || "",
        imageUrl: imageUrl || "",
      },
    });

    console.log("✅ New user created:", {
      id: newUser.id,
      clerkId: newUser.clerkId,
      email: newUser.email,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("❌ Error in user creation/lookup:", error);

  
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      console.log("🔄 Unique constraint error, attempting user lookup...");

      try {
        // Try to find the user that caused the conflict
        const { userId } = getAuth(req);
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: userId || undefined },
        });

        if (existingUser) {
          return res.json(existingUser);
        }
      } catch (lookupError) {
        console.error("❌ Error in conflict resolution:", lookupError);
      }
    }

    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
