const [livro, capitulo] = window.location.hash.replace("#", "").split("-");

fetch(`${window.location.origin}/biblia/livros/${livro}/${capitulo}`)
  .then((response) => response.json())
  .then((capitulo) => {
    const boxversiculos = document.getElementById("versiculos");
    const boxcapitulo = document.getElementById("capitulo");

    boxcapitulo.textContent = `${capitulo.nome_livro} ${capitulo.numero}`
    const versiculos = capitulo.versiculos;

    versiculos.forEach((versiculo) => {
      const versiculoItem = document.createElement("li");
      versiculoItem.textContent = versiculo;

      boxversiculos.appendChild(versiculoItem);
    });
  });
