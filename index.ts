import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { type Handler } from "express";
import jwt from "jsonwebtoken";

interface Annotation {
	title: string;
	description: string;
	userId: string;
}

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = "1234";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const authMiddleware: Handler = (req, res, next) => {
	const token = req.cookies["token"];

	if (token) {
		const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

		req.userId = payload.sub;

		return next();
	}

	res.redirect("/login.html");
};

app.post("/register", async (req, res) => {
	const { email, password, cell_phone, gender, firstname, lastname } = req.body;

	const hashedPassword = await bcrypt.hash(password, 10);

	await prisma.user.create({
		data: {
			email,
			password: hashedPassword,
			cell_phone,
			gender,
			nome: `${firstname} ${lastname}`,
		},
	});

	res.redirect("/login.html");
});

// Rota para login do usuário
app.post("/login", async (req, res) => {
	const { email, password } = req.body;

	const user = await prisma.user.findFirst({ where: { email } });

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return res.status(401).json({ message: "Credenciais inválidas" });
	}

	const token = jwt.sign({ sub: user.id }, JWT_SECRET);

	res.cookie("token", token, { maxAge: 86400000, httpOnly: true });

	res.redirect("/");
});

// Rotas para Annotation
app.post("/annotations", authMiddleware, async (req, res) => {
	const { title, description }: Annotation = req.body;
	await prisma.annotation.create({
		data: { description, userId: req.userId, Title: title },
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
	const { title, description }: Annotation = req.body;
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

app.get("*", express.static("frontend"));

app.listen(PORT, () => {
	console.log("Server is running on http://localhost:3000");
});

