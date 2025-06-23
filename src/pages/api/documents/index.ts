import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Documents API called:", req.method);

  if (req.method === "GET") {
    try {
      const user = await getUserFromRequest(req);

      // Only return documents user owns or collaborates on
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            {
              collaborators: {
                some: { userId: user.id },
              },
            },
          ],
        },
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
        orderBy: { updatedAt: "desc" },
      });

      console.log(`Found ${documents.length} documents for user:`, user.email);
      return res.json(documents);
    } catch (error) {
      console.error("GET documents error:", error);

      if (error instanceof Error && error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (
        error instanceof Error &&
        error.message === "User not found in database"
      ) {
        return res.status(404).json({ error: "User not synced to database" });
      }

      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const user = await getUserFromRequest(req);

      const { title } = req.body;
      console.log("Creating document for user:", user.email);

      // default content structure for Lexical
      const defaultContent = {
        root: {
          children: [
            {
              children: [],
              direction: null,
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      };

      const document = await prisma.document.create({
        data: {
          title: title || "Untitled Document",
          ownerId: user.id,
          // ✅ Fix: Provide valid default content instead of null
          content: JSON.stringify(defaultContent),
          // ✅ Fix: Explicitly set default values
          isPublic: false,
          coverImage: null, // Explicitly null is fine
        },
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

      console.log("Document created:", document.id, "with valid content");
      return res.status(201).json(document);
    } catch (error) {
      console.error("POST document error:", error);

      if (error instanceof Error && error.message === "Unauthorized") {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (
        error instanceof Error &&
        error.message === "User not found in database"
      ) {
        return res.status(404).json({ error: "User not synced to database" });
      }

      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to create document",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
