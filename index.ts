import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { type Handler } from "express";
import jwt from "jsonwebtoken";
import { Resend } from "resend"
import dotenv from "dotenv"
import compression from "compression"
import expressStaticGzip from "express-static-gzip";
import path from "path";

declare global {
  namespace Express {
    export interface Request {
      userId: string | undefined;
    }
  }
}

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY!)

interface Annotation {
  title: string;
  description: string;
  userId: string;
}

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression())

const authMiddleware: Handler = (req, res, next) => {
  const token = req.cookies["token"];

  if (token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    req.userId = payload.sub;

    return next();
  }

  res.redirect("/login.html");
};

app.post("/register", async (req, res) => {
  const { email, password, cell_phone, gender, firstname, lastname } = req.body;

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() as string } })

  if (user) {
    return res.status(400).json({ message: "Já existe um usuário com esse email!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      cell_phone,
      gender,
      nome: `${firstname} ${lastname}`,
    },
  });

  res.json({ message: "Usuário criado com sucesso!" });
});

// Rota para login do usuário
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!);

  res.cookie("token", token, { maxAge: 86400000, httpOnly: true, secure: process.env.NODE_ENV === "production" });

  res.redirect("/");
});

// Rotas para Annotation
app.post("/annotations", authMiddleware, async (req, res) => {
  const { title, description }: Annotation = req.body;
  await prisma.annotation.create({
    data: { description, userId: req.userId!, Title: title },
  });
  res.redirect("/notas.html");
});

app.get("/annotations", authMiddleware, async (req, res) => {
  const annotations = await prisma.annotation.findMany({
    where: { userId: req.userId },
  });
  res.json(annotations);
});

app.get("/annotations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const annotation = await prisma.annotation.findUnique({
    where: { id, userId: req.userId },
  });
  res.json(annotation);
});

app.post("/annotations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, description }: Annotation = req.body;
  await prisma.annotation.update({
    where: { id, userId: req.userId },
    data: { description, Title: title },
  });
  res.redirect("/notas.html");
});

app.delete("/annotations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const annotation = await prisma.annotation.delete({
    where: { id, userId: req.userId },
  });
  res.json(annotation);
});

app.get("/checklist", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });
  res.json(user!.checklist);
});

app.post("/checklist", authMiddleware, async (req, res) => {
  const { numero, valor } = req.body
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  let checklist = user!.checklist

  if (valor) {
    checklist.push(numero)
  } else {
    checklist = checklist.filter(valor => valor !== numero)
  }

  const checklistSalvo = await prisma.user.update({
    where: { id: req.userId },
    data: {
      checklist
    }
  });

  res.json(checklistSalvo)
});

app.delete("/checklist", authMiddleware, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { checklist: [] }
  });

  res.json(user)
});

app.post("/esqueci-senha", async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ status: "erro" })
  }

  const usuario = await prisma.user.findFirst({
    where: { email }
  })

  if (usuario) {
    const token = jwt.sign({ email: usuario.email }, process.env.JWT_SECRET!, { expiresIn: "15m" });

    await resend.emails.send({
      from: "naoresponder@meudevocional.vitordaniel.com",
      to: usuario.email,
      subject: "Recuperar senha",
      html: `
				<h1>Recuperação de senha!</h1>
				<p>Clique no link abaixo para recuperar a sua senha. O link é válido por 15 minutos.</p>
				<p>Caso você não tenha feito essa solicitação, por favor ignore este email.</p>
				<a href="${process.env.SITE_URL}/recuperar-senha?token=${token}">Recuperar senha</a>
			`
    })

    return res.json({ status: "ok" })
  }

  res.status(404).json({ status: "erro" })
})

app.get("/recuperar-senha", (req, res) => {
  const { token } = req.query

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token inválido" })
  }

  const { email } = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

  if (!email) {
    return res.status(400).json({ message: "Token inválido" })
  }

  res.redirect(`/mudar-senha.html?token=${token}`)
})

app.post("/mudar-senha", async (req, res) => {
  const { token } = req.query
  const { senha } = req.body

  if (!senha) {
    return res.status(400).json({ message: "Digite uma senha válida!" })
  }

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token inválido" })
  }

  const { email } = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

  if (!email) {
    return res.status(400).json({ message: "Token inválido" })
  }

  await prisma.user.updateMany({
    where: { email },
    data: { password: await bcrypt.hash(senha, 10) }
  })

  res.redirect("/login.html")
})

app.get("/biblia/livros", async (req, res) => {
  const { testamento } = req.query

  const livros = await prisma.livro.findMany({
    where: testamento ? { testamento: testamento as string } : {}
  })

  res.json(livros)
})

app.get("/biblia/livros/:abreviacao", async (req, res) => {
  const { abreviacao } = req.params

  const livro = await prisma.livro.findFirst({
    where: { abreviacao }
  })

  res.json(livro)
})

app.get("/biblia/livros/:abreviacao/:capitulo", async (req, res) => {
  const { abreviacao, capitulo: numeroCapitulo } = req.params

  const capitulo = await prisma.capitulo.findMany({
    where: {
      livro: {
        abreviacao
      },
      numero: parseInt(numeroCapitulo)
    },
    include: {
      livro: true
    }
  })

  res.json(capitulo)
})

app.get("/harpa/hinos", async (req, res) => {
  const hinos = await prisma.hino.findMany()

  res.json(hinos)
})

app.get("/harpa/hinos/:numero", async (req, res) => {
  const { numero } = req.params

  const hino = await prisma.hino.findFirst({
    where: { numero: parseInt(numero) }
  })

  res.json(hino)
})

if (process.env.NODE_ENV === "production") {
  app.use("*", expressStaticGzip(path.join(__dirname, "dist"), {
    enableBrotli: true
  }));
} else {
  app.get("*", express.static("frontend"));
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:3000");
});
