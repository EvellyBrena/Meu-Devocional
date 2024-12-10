var swiper = new Swiper(".swiper", {
  slidesPerView: 3.2,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    320: {
      slidesPerView: 1.2,
    },
    768: {
      slidesPerView: 2.2,
      spaceBetween: 20,
    },
    992: {
      slidesPerView: 3.2,
      spaceBetween: 20,
    },
  },
});
