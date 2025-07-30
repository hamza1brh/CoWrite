import { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return handleGetDocuments(req, res);
  }

  if (req.method === "POST") {
    return handleCreateDocument(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGetDocuments(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔍 DOCUMENTS GET - Starting request");
  console.log("🔍 DOCUMENTS GET - Has cookies:", !!req.cookies);
  console.log(
    "🔍 DOCUMENTS GET - Cookie names:",
    Object.keys(req.cookies || {})
  );

  try {
    console.log("🔍 DOCUMENTS GET - Calling requireAuthenticatedUser");
    const user = await requireAuthenticatedUser(req, res);
    console.log("✅ DOCUMENTS GET - User authenticated:", user.email);

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            collaborators: {
              some: {
                userId: user.id,
              },
            },
          },
          { isPublic: true },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(`Found ${documents.length} documents for user ${user.id}`);
    return res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);

    // Handle authentication errors specifically
    if (
      error instanceof Error &&
      (error.message.includes("Authentication required") ||
        error.message.includes("Invalid session") ||
        error.message.includes("User not found"))
    ) {
      return res.status(401).json({ error: "Authentication required" });
    }

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
    });
  }
}

async function handleCreateDocument(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔍 DOCUMENTS POST - Starting create request");
  console.log("🔍 DOCUMENTS POST - Has cookies:", !!req.cookies);
  console.log(
    "🔍 DOCUMENTS POST - Cookie names:",
    Object.keys(req.cookies || {})
  );

  try {
    console.log("🔍 DOCUMENTS POST - Calling requireAuthenticatedUser");
    const user = await requireAuthenticatedUser(req, res);
    console.log("✅ DOCUMENTS POST - User authenticated:", user.email);
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
        title: title || "Untitled Document",
        ownerId: user.id,
        content: JSON.stringify(defaultContent),
        isPublic: false,
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

    console.log("Document created:", document.id);
    return res.status(201).json(document);
  } catch (error) {
    console.error("Error creating document:", error);

    // Handle authentication errors specifically
    if (
      error instanceof Error &&
      (error.message.includes("Authentication required") ||
        error.message.includes("Invalid session") ||
        error.message.includes("User not found"))
    ) {
      return res.status(401).json({ error: "Authentication required" });
    }

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create document",
    });
  }
}
