import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Documents API called:", req.method);

  if (req.method === "GET") {
    try {
      const documents = await prisma.document.findMany({
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

      console.log("Found documents in DB:", documents.length);
      console.log("First document owner:", documents[0]?.owner);

      return res.json(documents);
    } catch (error) {
      console.error("GET documents error:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { title } = req.body;
      console.log("Creating document with title:", title);

      // Create or find a temporary user
      const tempUser = await prisma.user.upsert({
        where: { clerkId: "temp-user" },
        update: {}, // Don't update anything if exists
        create: {
          clerkId: "temp-user",
          email: "temp@example.com",
          firstName: "Temp",
          lastName: "User",
        },
      });

      console.log("Using user:", tempUser.id);

      const document = await prisma.document.create({
        data: {
          title: title || "Untitled Document",
          ownerId: tempUser.id,
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
        },
      });

      console.log("Document created:", document);
      return res.status(201).json(document);
    } catch (error) {
      console.error("POST document error:", error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to create document",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
