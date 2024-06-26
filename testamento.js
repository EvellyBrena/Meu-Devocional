let testamento = window.location.hash.replace("#", "")

if (!testamento && !["vt", "nt"].includes(testamento)) {
  testamento = "vt"
}

const titulo = document.querySelector("#titulo")

if (testamento === "nt") {
  titulo.textContent = "Novo Testamento"
} else {
  titulo.textContent = "Antigo Testamento"
}

fetch("https://www.abibliadigital.com.br/api/books", {
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgSnVuIDA1IDIwMjQgMTQ6MzQ6NTAgR01UKzAwMDAudml0b3IwMzZkYW5pZWxAZ21haWwuY29tIiwiaWF0IjoxNzE3NTk4MDkwfQ.O-I87RQ_1EV-agG9qGCb4vTA3oGDXnH4tJPG8k-m_pc"
  }
})
.then(res => res.json())
.then(books => {
  const bookList = document.querySelector("#book-list");

    books.filter(book => book.testament.toLowerCase().includes(testamento.toLowerCase())).forEach(book => {
      const bookItem = document.createElement("div");
      bookItem.classList.add("book-item");

      const bookTitle = document.createElement("h3");
      bookTitle.textContent = book.name;


             const bookLink = document.createElement("a");
             bookLink.href = `livro.html#${book.abbrev.pt}`;
             bookLink.textContent = ">>";

             bookItem.appendChild(bookTitle);
             bookItem.appendChild(bookLink);

             bookList.appendChild(bookItem);


           });
});
