const addBox = document.querySelector(".add-box"),
	popupBox = document.querySelector(".popup-box"),
	popupTitle = popupBox.querySelector("header p"),
	closeIcon = popupBox.querySelector("header i"),
	titleTag = popupBox.querySelector("input"),
	descTag = popupBox.querySelector("textarea"),
	addBtn = popupBox.querySelector("button");
const form = document.querySelector("form");

const months = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubor",
	"Novembro",
	"Dezembro",
];

function showMenu(elem) {
	elem.parentElement.classList.add("show");
	document.addEventListener("click", (e) => {
		if (e.target.tagName != "I" || e.target != elem) {
			elem.parentElement.classList.remove("show");
		}
	});
}

function deleteNote(noteId) {
	Swal.fire({
		title: "Deseja mesmo deletar esta nota?",
		text: "Esta ação não pode ser desfeita!",
		icon: "warning",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
		confirmButtonText: "Confirmar",
		cancelButtonText: "Cancelar",
	}).then(async (result) => {
		if (result.isConfirmed) {
			const res = await fetch(
				window.location.origin + "/annotations/" + noteId,
				{ method: "DELETE" },
			);

			if (res.ok) {
				showNotes().then(() => {
					Swal.fire({
						title: "Sucesso!",
						text: "A anotação foi deletada!",
						icon: "success",
					});
				});
			} else {
				Swal.fire({
					title: "Erro!",
					text: "Ocorreu um erro ao deletar a anotação!",
					icon: "error",
				});
			}
		}
	});
}

function updateNote(noteId, title, filterDesc) {
	const description = filterDesc.replaceAll("<br/>", "\r\n");
	updateId = noteId;
	isUpdate = true;
	addBox.click();
	titleTag.value = title;
	descTag.value = description;
	popupTitle.innerText = "Edite a sua nota";
	addBtn.innerText = "Editar";
	form.action = "/annotations/" + noteId;
}

let isUpdate = false,
	updateId;

addBox.addEventListener("click", () => {
	popupTitle.innerText = "Adicione a sua nota";
	addBtn.innerText = "Adicionar Nota";
	popupBox.classList.add("show");
	document.querySelector("body").style.overflow = "hidden";
	form.action = "/annotations";
	if (window.innerWidth > 660) titleTag.focus();
});

closeIcon.addEventListener("click", () => {
	isUpdate = false;
	titleTag.value = descTag.value = "";
	popupBox.classList.remove("show");
	document.querySelector("body").style.overflow = "auto";
});

async function showNotes() {
	const res = await fetch(window.location.origin + "/annotations");
	const notes = await res.json();
	document.querySelectorAll(".note").forEach((li) => li.remove());
	notes.forEach((note) => {
		const filterDesc = note.description.replaceAll("\n", "<br/>");
		const liTag = `<li class="note">
                        <div class="details">
                            <p>${note.Title}</p>
                            <span>${filterDesc}</span>
                        </div>
                        <div class="bottom-content">
                            <span>${note.Date}</span>
                            <div class="settings">
                                <i onclick="showMenu(this)" class="uil uil-ellipsis-h"></i>
                                <ul class="menu">
                                    <li onclick="updateNote('${note.id}', '${note.Title}', '${filterDesc}')"><i class="uil uil-pen"></i>Edite</li>
                                    <li onclick="deleteNote('${note.id}')"><i class="uil uil-trash"></i>Delete</li>
                                </ul>
                            </div>
                        </div>
                    </li>`;
		addBox.insertAdjacentHTML("afterend", liTag);
	});
}
showNotes();
