fetch(`${window.location.origin}/biblia/livros/${window.location.hash.replace("#", "")}`)
  .then(response => response.json())
  .then(book => {
    const boxcapitulos = document.querySelector("#capitulos");

    document.querySelector("#nome").textContent = book.nome;

    for (let i = 1; i <= book.capitulos; i++) {
      const capitulo = document.createElement("a");
      capitulo.classList.add("capitulo");
      capitulo.href = "capitulo.html#" + book.abreviacao + "-" + i;
      capitulo.textContent = i;
      boxcapitulos.appendChild(capitulo)
    }
  }) 
