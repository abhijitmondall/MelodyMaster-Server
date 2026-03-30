/**
 * Prisma seed script — idempotent
 * Run with: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"] ?? "",
});
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

const classes = [
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Yoga Fundamentals",
    description:
      "Build core flexibility and strength with foundations of yoga.",
    instructorName: "John Doe",
    instructorEmail: "john.doe@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 100,
    enrolledStudents: 80,
    price: 20,
    ratings: 4.7,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Pilates Essentials",
    instructorName: "Jane Smith",
    instructorEmail: "jane.smith@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 150,
    enrolledStudents: 50,
    price: 25,
    ratings: 4.2,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Zumba Fitness",
    instructorName: "Alex Johnson",
    instructorEmail: "alex.johnson@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 200,
    enrolledStudents: 30,
    price: 15,
    ratings: 4.9,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Kickboxing Power",
    instructorName: "Michael Brown",
    instructorEmail: "michael.brown@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 300,
    enrolledStudents: 150,
    price: 30,
    ratings: 4.6,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Pilates Advanced",
    instructorName: "Emily Davis",
    instructorEmail: "emily.davis@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 500,
    enrolledStudents: 250,
    price: 25,
    ratings: 4.4,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Yoga Flow",
    instructorName: "David Wilson",
    instructorEmail: "david.wilson@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 100,
    enrolledStudents: 20,
    price: 20,
    ratings: 4.8,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Yoga Intermediate",
    instructorName: "David Wilson",
    instructorEmail: "david.wilson@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 50,
    enrolledStudents: 10,
    price: 20,
    ratings: 4.8,
    status: "Approved" as const,
  },
  {
    classImage: "https://i.ibb.co/M8GwzdP/slide-1.jpg",
    className: "Yoga Advanced",
    instructorName: "David Wilson",
    instructorEmail: "david.wilson@example.com",
    instructorPhoto: "https://i.ibb.co/z6BSTQ2/user-photo.jpg",
    totalSeats: 50,
    enrolledStudents: 10,
    price: 20,
    ratings: 4.8,
    status: "Approved" as const,
  },
];

const instructors = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    defaultPassword: "john1234",
    classes: 1,
    students: 80,
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    defaultPassword: "jane1234",
    classes: 1,
    students: 50,
  },
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    defaultPassword: "alex1234",
    classes: 1,
    students: 30,
  },
  {
    name: "Michael Brown",
    email: "michael.brown@example.com",
    defaultPassword: "michael1234",
    classes: 1,
    students: 150,
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    defaultPassword: "emily1234",
    classes: 1,
    students: 250,
  },
  {
    name: "David Wilson",
    email: "david.wilson@example.com",
    defaultPassword: "david1234",
    classes: 3,
    students: 40,
  },
];

const main = async (): Promise<void> => {
  console.log("🌱 Seeding database…");

  for (const instructor of instructors) {
    const { defaultPassword, ...data } = instructor;
    const password = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, password, role: "Instructor" },
    });
  }
  console.log(`✅ Seeded ${instructors.length} instructors`);

  const adminPassword = await bcrypt.hash("admin1234", BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: "admin@melodymasters.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@melodymasters.com",
      password: adminPassword,
      role: "Admin",
    },
  });
  console.log("✅ Seeded admin  →  admin@melodymasters.com / admin1234");

  await prisma.class.deleteMany();
  await prisma.class.createMany({ data: classes });
  console.log(`✅ Seeded ${classes.length} classes`);

  console.log("\n🎵 Seed complete!");
  console.log("─────────────────────────────────────────────────────────");
  console.log("Instructor passwords: <firstname>1234  |  Admin: admin1234");
};

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
