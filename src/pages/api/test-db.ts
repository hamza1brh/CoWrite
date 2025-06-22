import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await prisma.$connect();

    const userCount = await prisma.user.count();
    const documentCount = await prisma.document.count();

    return res.json({
      status: "success",
      message: "Database connected successfully",
      stats: {
        users: userCount,
        documents: documentCount,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
}
