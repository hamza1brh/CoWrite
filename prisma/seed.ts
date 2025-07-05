import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.comment.deleteMany();
  await prisma.documentCollaborator.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Database seeded successfully!");
  console.log("🚀 Ready for production use with real user authentication");
}

main()
  .catch(e => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
