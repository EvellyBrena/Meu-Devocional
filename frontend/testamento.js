let testamento = window.location.hash.replace("#", "");

if (!testamento && !["vt", "nt"].includes(testamento)) {
  testamento = "vt";
}

const titulo = document.querySelector("#titulo");

if (testamento === "nt") {
  titulo.textContent = "Novo Testamento";
} else {
  titulo.textContent = "Antigo Testamento";
}

fetch(window.location.origin + "/api/biblia/livros")
  .then((res) => res.json())
  .then((books) => {
    const bookList = document.querySelector("#book-list");

    books
      .filter((book) =>
        book.testamento.toLowerCase().includes(testamento.toLowerCase()),
      )
      .forEach((book) => {
        const bookItem = document.createElement("a");
        bookItem.href = `livro.html#${book.abbrev.pt}`;
        bookItem.classList.add("book-item");
        bookItem.textContent = book.nome

        bookList.appendChild(bookItem);
      });
  });
