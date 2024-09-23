import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Hello World")
  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}

main()
