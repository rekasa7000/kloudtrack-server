import { PrismaClient, Role } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database seeding...");

    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPERADMIN",
      },
    });

    if (existingSuperAdmin) {
      console.log(
        `SUPERADMIN already exists with ID: ${existingSuperAdmin.id}`
      );
      return;
    }

    const hashedPassword = await bcryptjs.hash("SuperSecurePassword123!", 10);

    console.log("Creating SUPERADMIN user...");
    const superAdmin = await prisma.user.create({
      data: {
        userName: "superadmin",
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin@example.com",
        role: "SUPERADMIN",
        password: hashedPassword,
        phone: "+1234567890",
        createdAt: new Date(),
      },
    });

    console.log(`Created SUPERADMIN with ID: ${superAdmin.id}`);
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:");
    console.error(error);

    if (error) {
      console.error("Error code:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
