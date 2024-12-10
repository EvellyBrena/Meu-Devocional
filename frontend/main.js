var menu = document.querySelector("nav ul");
var menuBar = document.querySelector("nav .menu-icon");
var iconMenu = document.querySelector("nav .menu-icon img");

menuBar.addEventListener("click", () => {
  if (iconMenu.getAttribute("src") !== "remover.png") {
    iconMenu.setAttribute("src", "remover.png");
  } else {
    iconMenu.setAttribute("src", "menuu.png");
  }

  menu.classList.toggle("active");
});
