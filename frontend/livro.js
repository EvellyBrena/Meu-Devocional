fetch("https://www.abibliadigital.com.br/api/books/" + window.location.hash.replace("#", ""), {
  headers: )
.then (response => response.json())
.then(book => {
  const boxcapitulos = document.querySelector("#capitulos");

  for (let i = 1; i <= book.chapters; i++) {
    const capitulo = document.createElement("a");
    capitulo.classList.add("capitulo");
    capitulo.href = "capitulo.html#" + book.abbrev.pt + "-" + i;
    capitulo.textContent = i;
    boxcapitulos.appendChild(capitulo)



  }
}) 
