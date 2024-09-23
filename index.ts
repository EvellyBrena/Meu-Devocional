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
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log(users)
}

main()

const app = express();
app.use(express.urlencoded())

app.use(express.static("frontend"));

app.post("/login", async (req, res) => {

  // retorna as informações do usuário que tem o email igual ao digitado
  const user = await prisma.user.findFirst({
    where: {
      email: req.body.email
    }
  })

  // verifica se o email existe
  if (user) {
    // email existe
  } else {
    // email não existe
  }
})


app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
