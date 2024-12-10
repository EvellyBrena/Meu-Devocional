
for (let i = 1; i <= 365; i++) {
  const checkbox = document.getElementById("check" + i)

  if (checkbox) {
    checkbox.addEventListener("change", (ev) => {
      fetch("/checklist", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          numero: i,
          valor: ev.currentTarget.checked
        })
      })
    })
  }
}


fetch("/checklist")
  .then((response) => response.json())
  .then((checklist) => {
    for (const numero of checklist) {
      const checkbox = document.getElementById("check" + numero)

      if (checkbox) {
        checkbox.checked = true;
      }
    }
  });
