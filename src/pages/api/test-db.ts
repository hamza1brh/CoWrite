import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("=== DATABASE TEST API ===");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log(
    "DATABASE_URL preview:",
    process.env.DATABASE_URL?.substring(0, 30) + "..."
  );

  try {
    console.log("Testing Prisma connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("Prisma connection successful");

    // Test query
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);

    const documentCount = await prisma.document.count();
    console.log("Document count:", documentCount);

    // Test first user
    const firstUser = await prisma.user.findFirst();
    console.log("First user:", firstUser?.firstName);

    return res.json({
      success: true,
      environment: process.env.NODE_ENV,
      databaseConnected: true,
      counts: {
        users: userCount,
        documents: documentCount,
      },
      firstUser: firstUser
        ? {
            id: firstUser.id,
            name: `${firstUser.firstName} ${firstUser.lastName}`,
            email: firstUser.email,
          }
        : null,
    });
  } catch (error) {
    console.error("=== DATABASE ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Error code:", (error as any)?.code);
    console.error("Full error:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Database connection failed",
      errorType: error?.constructor?.name,
      errorCode: (error as any)?.code,
      environment: process.env.NODE_ENV,
    });
  } finally {
    await prisma.$disconnect();
  }
}
