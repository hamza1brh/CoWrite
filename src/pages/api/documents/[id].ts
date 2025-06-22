import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Document ID is required" });
  }

  console.log("Document API called:", req.method, "for ID:", id);

  if (req.method === "GET") {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      console.log("Found document:", document.title);
      return res.json(document);
    } catch (error) {
      console.error("GET document error:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch document",
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { title, content } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      const document = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            },
          },
        },
      });

      console.log("Updated document:", document.title);
      return res.json(document);
    } catch (error) {
      console.error("PUT document error:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to update document",
      });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}
