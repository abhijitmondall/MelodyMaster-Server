-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Student', 'Instructor', 'Admin');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('Pending', 'Approved', 'Denied');

-- CreateEnum
CREATE TYPE "SelectedClassStatus" AS ENUM ('Selected', 'Enrolled');

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "classImage" TEXT,
    "className" TEXT NOT NULL,
    "description" TEXT,
    "instructorName" TEXT,
    "instructorEmail" TEXT,
    "instructorPhoto" TEXT,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "enrolledStudents" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL,
    "ratings" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "status" "ClassStatus" NOT NULL DEFAULT 'Pending',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrolled_users" (
    "id" TEXT NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "classID" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "classImage" TEXT,
    "className" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "enrolledStudents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrolled_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_classes" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "instructorEmail" TEXT NOT NULL,
    "classID" TEXT NOT NULL,
    "classImage" TEXT,
    "className" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "SelectedClassStatus" NOT NULL DEFAULT 'Selected',
    "enrolledStudents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "selected_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "photo" TEXT,
    "gender" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Student',
    "classes" INTEGER NOT NULL DEFAULT 0,
    "students" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "classes_className_idx" ON "classes"("className");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE INDEX "classes_instructorEmail_idx" ON "classes"("instructorEmail");

-- CreateIndex
CREATE INDEX "enrolled_users_email_idx" ON "enrolled_users"("email");

-- CreateIndex
CREATE INDEX "enrolled_users_classID_idx" ON "enrolled_users"("classID");

-- CreateIndex
CREATE INDEX "enrolled_users_className_idx" ON "enrolled_users"("className");

-- CreateIndex
CREATE INDEX "selected_classes_userEmail_idx" ON "selected_classes"("userEmail");

-- CreateIndex
CREATE INDEX "selected_classes_classID_idx" ON "selected_classes"("classID");

-- CreateIndex
CREATE INDEX "selected_classes_className_idx" ON "selected_classes"("className");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
