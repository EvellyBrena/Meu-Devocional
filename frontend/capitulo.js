const [livro, capitulo] = window.location.hash.replace("#", "").split("-");
console.log(livro, capitulo);

fetch(`${window.location.origin}/biblia/livros/${livro}/${capitulo}`)
  .then((response) => response.json())
  .then((capitulo) => {
    const boxversiculos = document.getElementById("versiculos");
    const boxcapitulo = document.getElementById("capitulo");

    boxcapitulo.textContent = `${capitulo.livro.nome} ${capitulo.numero}`
    const versiculos = capitulo.verses;

    versiculos.forEach((versiculo) => {
      const versiculoItem = document.createElement("li");
      versiculoItem.textContent = versiculo.text;

      boxversiculos.appendChild(versiculoItem);
    });
  });
