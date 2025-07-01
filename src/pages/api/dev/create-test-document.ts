import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireSyncedUser } from "@/lib/user-sync";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const currentUser = await requireSyncedUser(req);

    const document = await prisma.document.create({
      data: {
        title: `Test Doc - ${new Date().toLocaleTimeString()}`,
        ownerId: currentUser.id,
        isPublic: true,
      },
      include: {
        owner: true,
        collaborators: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("Test document created:", {
      id: document.id,
      title: document.title,
      hasContent: !!document.content,
      hasYjsState: !!document.yjsState,
    });

    return res.status(201).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        hasContent: !!document.content,
        hasYjsState: !!document.yjsState,
        ownerId: document.ownerId,
      },
      instructions: [
        `Navigate to /editor/${document.id}`,
        "Should see empty editor",
        "Type content and test real-time collaboration",
        "Content persists via Yjs state management",
      ],
    });
  } catch (error) {
    console.error("Error creating test document:", error);
    return res.status(500).json({
      error: "Failed to create test document",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
