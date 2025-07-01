import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let testUser = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          clerkId: "test-clerk-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          imageUrl: "",
        },
      });
    }

    const { title } = req.body;

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
        title: title || "Test Document for Collaboration",
        ownerId: testUser.id,
        content: JSON.stringify(defaultContent),
        isPublic: true,
        coverImage: null,
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

    console.log("Test document created:", document.id);
    return res.status(201).json(document);
  } catch (error) {
    console.error("Test document creation error:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create test document",
    });
  }
}
