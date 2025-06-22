import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        ownedDocuments: {
          orderBy: { updatedAt: "desc" },
          take: 5,
        },
        collaboratorOn: {
          include: {
            document: true,
          },
        },
        _count: {
          select: {
            ownedDocuments: true,
            collaboratorOn: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({ error: "Method not allowed" });
}
