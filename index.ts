import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { type Handler } from "express";
import jwt from "jsonwebtoken";
import { Resend } from "resend"
import dotenv from "dotenv"
import compression from "compression"
import expressStaticGzip from "express-static-gzip";
import { Database } from "bun:sqlite";

const olddb = new Database("data/biblia_harpa.sqlite", { readonly: true });
const contents = olddb.serialize();
const db = Database.deserialize(contents, true);

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

  const hashedPassword = await Bun.password.hash(password);

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

  if (!user || !(await Bun.password.verify(password, user.password))) {
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
    data: { password: await Bun.password.hash(senha) }
  })

  res.redirect("/login.html")
})

class Livro {
  abreviacao: string;
  nome: string;
  testamento: string;
}

app.get("/biblia/livros", async (req, res) => {
  const { testamento } = req.query

  let livros: { abreviacao: string, nome: string, testamento: string }[]

  if (testamento) {
    livros = db.query(`
      SELECT abreviacao, nome, testamento
      FROM livro
      WHERE testamento = $testamento
    `,
    )
      .as(Livro)
      .all({ $testamento: testamento as string })
  } else {
    livros = db.query(`
      SELECT abreviacao, nome, testamento
      FROM livro
    `,
    )
      .as(Livro)
      .all()
  }

  res.json(livros)
})

app.get("/biblia/livros/:abreviacao", async (req, res) => {
  const { abreviacao } = req.params

  const livro = db.query(`
    SELECT abreviacao, nome, testamento, COUNT(numero) AS capitulos
    FROM livro
    LEFT JOIN capitulo ON livro = abreviacao
    WHERE abreviacao = $abreviacao
  `,
  )
    .as(Livro)
    .get({ $abreviacao: abreviacao })

  res.json(livro)
})

class CapituloWithVersiculos {
  capitulo_numero: number;
  livro_abreviacao: string;
  nome_livro: string;
  versiculo_numero: number;
  versiculo_texto: string;
}

app.get("/biblia/livros/:abreviacao/:capitulo", async (req, res) => {
  const { abreviacao, capitulo: numeroCapitulo } = req.params;

  const results = db.query(`
    SELECT 
      c.numero AS capitulo_numero,
      c.livro AS livro_abreviacao,
      c.nome_livro,
      v.numero AS versiculo_numero,
      v.texto AS versiculo_texto
    FROM capitulo c
    JOIN versiculo v ON c.livro = v.livro AND c.numero = v.capitulo
    WHERE c.livro = $abreviacao AND c.numero = $numeroCapitulo
    ORDER BY v.numero
  `)
    .as(CapituloWithVersiculos)
    .all({ $abreviacao: abreviacao, $numeroCapitulo: numeroCapitulo });

  if (results.length === 0) {
    return res.status(404).json({ error: "Capítulo ou versículos não encontrados." });
  }

  const { capitulo_numero, livro_abreviacao, nome_livro } = results[0];

  const versiculos = results.map(result => result.versiculo_texto.trim());

  res.json({
    numero: capitulo_numero,
    livro: livro_abreviacao,
    nome_livro,
    versiculos
  });
});

class HinoWithVersos {
  hino_numero: number;
  hino_titulo: string;
  hino_coro: string;
  verso_numero: number;
  verso_texto: string;
}

app.get("/harpa/hinos/:numero", async (req, res) => {
  const { numero } = req.params;

  const results = db.query(`
    SELECT 
      h.numero AS hino_numero,
      h.titulo AS hino_titulo,
      h.coro AS hino_coro,
      v.numero AS verso_numero,
      v.texto AS verso_texto
    FROM hino h
    JOIN verso v ON h.numero = v.hino
    WHERE h.numero = $numero
    ORDER BY v.numero
  `)
    .as(HinoWithVersos)
    .all({ $numero: numero });

  if (results.length === 0) {
    return res.status(404).json({ error: "Hino não encontrado." });
  }

  const { hino_numero, hino_titulo, hino_coro } = results[0];

  const versos = results.map(result => result.verso_texto.trim());

  res.json({
    numero: hino_numero,
    titulo: hino_titulo,
    coro: hino_coro,
    versos
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(expressStaticGzip("dist", {
    enableBrotli: true,
    orderPreference: ["br", "gz"],
    serveStatic: {
      maxAge: "1y",
      immutable: true,
    },
  }));
} else {
  app.get("*", express.static("frontend"));
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:3000");
});
