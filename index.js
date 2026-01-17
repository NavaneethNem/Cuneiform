/* ------------------------------
   STATE HANDLERS
-------------------------------- */

// Show signup choice page (Student / Admin buttons)
function showSignupChoice() {
  document.body.classList.add("choose-signup");
  document.body.classList.remove("signup-active");
  stopSlideshow();
}

// Open final signup form (email + password)
function openSignup() {
  document.body.classList.remove("choose-signup");
  document.body.classList.add("signup-active");
  startSlideshow();
}

// Optional: go back to login page
function backToLogin() {
  document.body.classList.remove("choose-signup");
  document.body.classList.remove("signup-active");
  stopSlideshow();
}

/* ------------------------------
   SLIDESHOW LOGIC
-------------------------------- */

let slideIndex = 0;
let slideTimer = null;

function startSlideshow() {
  stopSlideshow(); // prevent duplicate timers
  showSlide(slideIndex);
  slideTimer = setInterval(nextSlide, 6000); // auto slide every 6s
}

function stopSlideshow() {
  if (slideTimer) {
    clearInterval(slideTimer);
    slideTimer = null;
  }
}

function showSlide(index) {
  const slides = document.getElementsByClassName("slide");
  if (!slides.length) return;

  // Loop index
  slideIndex = (index + slides.length) % slides.length;

  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  // Show active slide
  slides[slideIndex].style.display = "block";
}

function nextSlide() {
  showSlide(slideIndex + 1);
}

function plusSlides(n) {
  showSlide(slideIndex + n);
}

