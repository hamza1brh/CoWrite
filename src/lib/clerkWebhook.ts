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
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, email_addresses, image_url } = evt.data;

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        firstName: first_name,
        lastName: last_name,
        email: email_addresses[0]?.email_address,
        imageUrl: image_url,
      },
      create: {
        clerkId: id,
        firstName: first_name,
        lastName: last_name,
        email: email_addresses[0]?.email_address,
        imageUrl: image_url,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    await prisma.user.delete({
      where: { clerkId: id },
    });
  }

  res.status(200).json({ received: true });
}
