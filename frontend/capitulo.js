const [livro, capitulo] = window.location.hash.replace("#", "").split("-");
console.log(livro, capitulo);

fetch(
	"https://www.abibliadigital.com.br/api/verses/nvi/" + livro + "/" + capitulo,
	{
		headers: {
			Authorization:
				"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgSnVuIDA1IDIwMjQgMTQ6MzQ6NTAgR01UKzAwMDAudml0b3IwMzZkYW5pZWxAZ21haWwuY29tIiwiaWF0IjoxNzE3NTk4MDkwfQ.O-I87RQ_1EV-agG9qGCb4vTA3oGDXnH4tJPG8k-m_pc",
		},
	},
)
	.then((response) => response.json())
	.then((capitulo) => {
		const boxversiculos = document.getElementById("versiculos");
        const boxcapitulo = document.getElementById("capitulo");

        boxcapitulo.textContent = `${capitulo.book.name} ${capitulo.chapter.number}`
		const versiculos = capitulo.verses; 
		
		versiculos.forEach((versiculo) => {
			const versiculoItem = document.createElement("li");
			versiculoItem.textContent = versiculo.text;

			boxversiculos.appendChild(versiculoItem);
		});
	});
