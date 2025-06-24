import { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log(
      "🔍 Comments API called:",
      req.method,
      "for document:",
      req.query.id
    );

    const user = await getUserFromRequest(req);
    console.log("🔍 Authenticated user:", {
      id: user.id,
      email: user.email,
      clerkId: user.clerkId,
    });

    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
          { isPublic: true },
        ],
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found or access denied",
      });
    }

    if (req.method === "GET") {
      const comments = await prisma.comment.findMany({
        where: { documentId: id },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`✅ Found ${comments.length} comments for document:`, id);
      return res.json(comments);
    }

    if (req.method === "POST") {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      console.log("🔍 Creating comment with data:", {
        content: content?.trim(),
        documentId: id,
        authorId: user.id,
      });

      const comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          documentId: id,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      });

      console.log("✅ Comment created successfully:", comment);
      return res.status(201).json(comment);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("❌ Document comments API error:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (error.message === "User not found in database") {
        return res.status(404).json({
          error: "User not synced to database. Please refresh and try again.",
        });
      }


      console.error("❌ Full error details:", {
        message: error.message,
        name: error.name,
        ...((error as any).code && { code: (error as any).code }),
        ...((error as any).meta && { meta: (error as any).meta }),
      });

      return res.status(500).json({
        error: error.message,
      });
    }

    console.error("❌ Unknown error type:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
