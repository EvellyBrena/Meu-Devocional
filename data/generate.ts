import { Database } from "bun:sqlite";

const db = new Database("biblia_harpa.sqlite");

db.exec(`
CREATE TABLE IF NOT EXISTS "hino" (
  "numero" INTEGER PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "coro" TEXT
);

CREATE TABLE IF NOT EXISTS "verso" (
  "id" INTEGER PRIMARY KEY,
  "hino" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "texto" TEXT NOT NULL,
  FOREIGN KEY ("hino") REFERENCES "hino" ("numero")
);

CREATE TABLE IF NOT EXISTS "livro" (
  "abreviacao" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "testamento" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "capitulo" (
  "numero" INTEGER NOT NULL,
  "livro" INTEGER NOT NULL,
  PRIMARY KEY ("livro", "numero"),
  FOREIGN KEY ("livro") REFERENCES "livro" ("abreviacao")
);

CREATE TABLE IF NOT EXISTS "versiculo" (
  "livro" TEXT NOT NULL,
  "capitulo" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "texto" TEXT NOT NULL,
  PRIMARY KEY ("livro", "capitulo", "numero"),
  FOREIGN KEY ("livro") REFERENCES "livro" ("abreviacao"),
  FOREIGN KEY ("capitulo") REFERENCES "capitulo" ("id")
);
`);

const harpa = await Bun.file("harpa.json").json();

db.transaction(() => {
  for (const [numero, hino] of Object.entries<{ hino: string, coro: string, verses: { [index: number]: string } }>(harpa)) {
    db.run("INSERT INTO hino (numero, titulo, coro) VALUES (?, ?, ?)", [
      numero + 1,
      hino.hino,
      hino.coro || null
    ]);

    for (const [index, verse] of Object.entries(hino.verses)) {
      db.run("INSERT INTO verso (hino, numero, texto) VALUES (?, ?, ?)", [
        numero + 1,
        index + 1,
        verse
      ]);
    }
  }
})();

const biblia = await Bun.file("biblia.json").json();

db.transaction(() => {
  for (const book of Object.values<{ name: string, abbrev: string, chapters: string[][] }>(biblia)) {
    db.run("INSERT INTO livro (nome, abreviacao, testamento) VALUES (?, ?, ?)", [
      book.name,
      book.abbrev,
      ["gn", "ex", "lv", "nm", "dt", "js", "jz", "rt", "1sm", "2sm", "1rs", "2rs", "1cr", "2cr", "ed", "ne", "et", "jó", "sl", "pv", "ec", "ct", "is", "jr", "lm", "ez", "dn", "os", "jl", "am", "ob", "jn", "mq", "na", "hc", "sf", "ag", "zc", "ml"].includes(book.abbrev) ? "at" : "nt"
    ]);

    for (const [chapterIndex, chapter] of book.chapters.entries()) {
      db.run("INSERT INTO capitulo (numero, livro) VALUES (?, ?)", [
        chapterIndex + 1,
        book.abbrev
      ]);

      for (const [index, verse] of chapter.entries()) {
        db.run("INSERT INTO versiculo (livro, capitulo, numero, texto) VALUES (?, ?, ?, ?)", [
          book.abbrev,
          chapterIndex + 1,
          index,
          verse
        ]);
      }
    }
  }
})();
