import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.mjs'

let fuse

fetch("https://www.abibliadigital.com.br/api/books", {
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgSnVuIDA1IDIwMjQgMTQ6MzQ6NTAgR01UKzAwMDAudml0b3IwMzZkYW5pZWxAZ21haWwuY29tIiwiaWF0IjoxNzE3NTk4MDkwfQ.O-I87RQ_1EV-agG9qGCb4vTA3oGDXnH4tJPG8k-m_pc"
  }
})
.then(res => res.json())
.then(books => {
  fuse = new Fuse(books, { keys: ['name'], includeScore: true })
});

function handleSearch() {
  const bookName = document.querySelector("#book").value

  const chapter = parseInt(document.querySelector("#chapter").value || 0);

  const matchedBooks = fuse.search(bookName)

  if (!matchedBooks.length || matchedBooks[0].score >= 0.5) {
    return alert("Nenhum livro encontrado")
  } else if (chapter > matchedBooks[0].item.chapters) {
    return alert("Este capitulo não existe")
  } else if (chapter > 0) {
    window.location.href = `capitulo.html#${matchedBooks[0].item.abbrev.pt}-${chapter}`;
  } else {
    window.location.href = `livro.html#${matchedBooks[0].item.abbrev.pt}`;
  }
}

document.querySelector("#searchButton").addEventListener("click", handleSearch)
