let testamento = window.location.hash.replace("#", "");

if (!testamento && !["at", "nt"].includes(testamento)) {
  testamento = "at";
}

const titulo = document.querySelector("#titulo");

if (testamento === "nt") {
  titulo.textContent = "Novo Testamento";
} else {
  titulo.textContent = "Antigo Testamento";
}

fetch(`${window.location.origin}/biblia/livros?testamento=${testamento}`)
  .then((res) => res.json())
  .then((books) => {
    const bookList = document.querySelector("#book-list");

    books
      .forEach((book) => {
        const bookItem = document.createElement("a");
        bookItem.href = `livro.html#${book.abreviacao}`;
        bookItem.classList.add("book-item");
        bookItem.textContent = book.nome

        bookList.appendChild(bookItem);
      });
  });
