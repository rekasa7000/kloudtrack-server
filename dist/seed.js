"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log("Starting database seeding...");
        const existingSuperAdmin = await prisma.user.findFirst({
            where: {
                role: "SUPERADMIN",
            },
        });
        if (existingSuperAdmin) {
            console.log(`SUPERADMIN already exists with ID: ${existingSuperAdmin.id}`);
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash("SuperSecurePassword123!", 10);
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
    }
    catch (error) {
        console.error("Error during seeding:");
        console.error(error);
        if (error) {
            console.error("Error code:", error);
        }
    }
    finally {
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
