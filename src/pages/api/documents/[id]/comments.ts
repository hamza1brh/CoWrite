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

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid document ID" });
  }

  if (req.method === "GET") {
    const comments = await prisma.comment.findMany({
      where: { documentId: id },
      include: {
        author: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(comments);
  }

  if (req.method === "POST") {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        documentId: id,
        authorId: userId,
      },
      include: {
        author: true,
      },
    });
    return res.status(201).json(comment);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
