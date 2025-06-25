import { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = JSON.stringify(req.body);
  const headers = req.headers;

  const wh = new Webhook(webhookSecret);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      "svix-id": headers["svix-id"] as string,
      "svix-timestamp": headers["svix-timestamp"] as string,
      "svix-signature": headers["svix-signature"] as string,
    });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  const eventType = evt.type;
  console.log("📨 Webhook received:", eventType, "for user:", evt.data.id);

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, first_name, last_name, email_addresses, image_url } =
        evt.data;

      console.log("🔄 Syncing user:", {
        clerkId: id,
        email: email_addresses[0]?.email_address,
        eventType,
      });

      const syncedUser = await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          firstName: first_name || "",
          lastName: last_name || "",
          email: email_addresses[0]?.email_address || "",
          imageUrl: image_url || "",
        },
        create: {
          clerkId: id,
          firstName: first_name || "",
          lastName: last_name || "",
          email: email_addresses[0]?.email_address || "",
          imageUrl: image_url || "",
        },
      });

      console.log("✅ User synced successfully:", {
        id: syncedUser.id,
        clerkId: syncedUser.clerkId,
        email: syncedUser.email,
        eventType,
      });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      console.log("🗑️ Deleting user:", id);

      // ✅ Fix: Use correct model name 'documentCollaborator'
      await prisma.$transaction([
        // Delete document collaborations
        prisma.documentCollaborator.deleteMany({
          where: { user: { clerkId: id } },
        }),
        // Delete comments by this user
        prisma.comment.deleteMany({
          where: {
            author: { clerkId: id },
          },
        }),
        // Handle documents owned by this user
        // Option 1: Delete all documents (destructive)
        prisma.document.deleteMany({
          where: {
            owner: { clerkId: id },
          },
        }),
        // Finally, delete the user
        prisma.user.delete({
          where: { clerkId: id },
        }),
      ]);

      console.log("✅ User and related data deleted successfully:", id);
    }
  } catch (dbError) {
    console.error("❌ Database error in webhook:", dbError);
    return res.status(500).json({
      error:
        dbError instanceof Error ? dbError.message : "Database sync failed",
    });
  }

  res.status(200).json({ received: true });
}
