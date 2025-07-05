import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const documents = await prisma.document.findMany({
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return res.status(200).json({
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner,
        commentCount: doc._count.comments,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      users,
      counts: {
        totalDocuments: documents.length,
        totalUsers: users.length,
      },
    });
  } catch (error) {
    console.error("Debug DB error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Database error",
    });
  }
}
