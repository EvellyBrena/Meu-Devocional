/*
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Hello World")
  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}

main()
*/

import express from "express";

const app = express();

app.use(express.static("frontend"));

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
