import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.comment.deleteMany({});
  await prisma.documentCollaborator.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("👥 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: "user_john_doe",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        imageUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_jane_smith",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        imageUrl:
          "https://images.unsplash.com/photo-1494790108755-2616b612b0c0?w=100&h=100&fit=crop&crop=face",
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_mike_wilson",
        email: "mike@example.com",
        firstName: "Mike",
        lastName: "Wilson",
        imageUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_sara_chen",
        email: "sara@example.com",
        firstName: "Sara",
        lastName: "Chen",
        imageUrl:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Documents
  console.log("📄 Creating documents...");
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        title: "Project Proposal - Q1 2024",
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Project Proposal - Q1 2024",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading",
                version: 1,
                tag: "h1",
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "This document outlines our strategic initiatives for the first quarter of 2024. We aim to focus on key deliverables that will drive growth and improve customer satisfaction.",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        ownerId: users[0].id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Team Meeting Notes",
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Team Meeting - March 15, 2024",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading",
                version: 1,
                tag: "h1",
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Attendees: John, Jane, Mike, Sara",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Action items discussed:",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        ownerId: users[1].id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Product Roadmap 2024",
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Product Roadmap 2024",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading",
                version: 1,
                tag: "h1",
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Our product development goals for this year include major feature releases and performance improvements.",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        ownerId: users[2].id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Marketing Strategy",
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Marketing Strategy Overview",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading",
                version: 1,
                tag: "h1",
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "This document outlines our comprehensive marketing approach for the upcoming quarter.",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        ownerId: users[3].id,
      },
    }),
    prisma.document.create({
      data: {
        title: "Untitled Document",
        content: {
          root: {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        ownerId: users[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${documents.length} documents`);

  // Create Collaborators
  console.log("🤝 Creating collaborators...");
  const collaborators = await Promise.all([
    // John's project proposal - Jane as editor, Mike as viewer
    prisma.documentCollaborator.create({
      data: {
        documentId: documents[0].id,
        userId: users[1].id, // Jane
        role: Role.EDITOR,
      },
    }),
    prisma.documentCollaborator.create({
      data: {
        documentId: documents[0].id,
        userId: users[2].id, // Mike
        role: Role.VIEWER,
      },
    }),
    // Jane's meeting notes - John and Sara as editors
    prisma.documentCollaborator.create({
      data: {
        documentId: documents[1].id,
        userId: users[0].id, // John
        role: Role.EDITOR,
      },
    }),
    prisma.documentCollaborator.create({
      data: {
        documentId: documents[1].id,
        userId: users[3].id, // Sara
        role: Role.EDITOR,
      },
    }),
    // Mike's roadmap - Sara as viewer
    prisma.documentCollaborator.create({
      data: {
        documentId: documents[2].id,
        userId: users[3].id, // Sara
        role: Role.VIEWER,
      },
    }),
  ]);

  console.log(`✅ Created ${collaborators.length} collaborators`);

  // Create Comments
  console.log("💬 Creating comments...");
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content:
          "Great start on the proposal! I think we should add more details about the budget breakdown.",
        documentId: documents[0].id,
        authorId: users[1].id, // Jane commenting on John's proposal
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "Agreed! Also, we might want to consider the timeline for Q2 integration.",
        documentId: documents[0].id,
        authorId: users[2].id, // Mike commenting on John's proposal
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "Thanks for taking notes! Can we schedule a follow-up for next week?",
        documentId: documents[1].id,
        authorId: users[0].id, // John commenting on Jane's meeting notes
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "The roadmap looks solid. Should we prioritize the mobile features first?",
        documentId: documents[2].id,
        authorId: users[3].id, // Sara commenting on Mike's roadmap
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "I like the approach outlined here. Let me review the market analysis section.",
        documentId: documents[3].id,
        authorId: users[0].id, // John commenting on Sara's marketing strategy
      },
    }),
  ]);

  console.log(`✅ Created ${comments.length} comments`);

  // Display summary
  console.log("\n🎉 Database seeding completed!");
  console.log("📊 Summary:");
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   📄 Documents: ${documents.length}`);
  console.log(`   🤝 Collaborators: ${collaborators.length}`);
  console.log(`   💬 Comments: ${comments.length}`);

  console.log("\n👥 Users created:");
  users.forEach(user => {
    console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
  });

  console.log("\n📄 Documents created:");
  documents.forEach(doc => {
    const owner = users.find(u => u.id === doc.ownerId);
    console.log(
      `   - "${doc.title}" by ${owner?.firstName} ${owner?.lastName}`
    );
  });
}

main()
  .catch(e => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
