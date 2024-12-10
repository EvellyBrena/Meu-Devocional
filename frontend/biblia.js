import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.mjs";

let fuse;

fetch(window.location.origin + "/biblia/livros")
  .then((res) => res.json())
  .then((books) => {
    fuse = new Fuse(books, { keys: ["nome"], includeScore: true });
  });

function handleSearch() {
  const bookName = document.querySelector("#book").value;

  const chapter = Number.parseInt(
    document.querySelector("#chapter").value || 0,
  );

  const matchedBooks = fuse.search(bookName);

  if (!matchedBooks.length || matchedBooks[0].score >= 0.5) {
    return alert("Nenhum livro encontrado");
  } else if (chapter > matchedBooks[0].item.chapters) {
    return alert("Este capitulo não existe");
  } else if (chapter > 0) {
    window.location.href = `capitulo.html#${matchedBooks[0].abreviacao}-${chapter}`;
  } else {
    window.location.href = `livro.html#${matchedBooks[0].abreviacao}`;
  }
}

document.querySelector("#searchButton").addEventListener("click", handleSearch);
