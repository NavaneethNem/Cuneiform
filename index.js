/* Move to category window */
function goCategory() {
  document.body.className = "state-category";
}

/* Move to signup choice */
function goSignupChoice() {
  document.body.className = "state-signup-choice";
}

/* Move to final signup + slideshow */
function goFinalSignup() {
  document.body.className = "state-signup-final";
  startSlideshow();
}

/* -----------------------
   SLIDESHOW LOGIC
------------------------*/

let slideIndex = 0;
let slideTimer = null;

function startSlideshow() {
  stopSlideshow();
  showSlide(slideIndex);
  slideTimer = setInterval(() => nextSlide(), 5000);
}

function stopSlideshow() {
  if (slideTimer) clearInterval(slideTimer);
}

function showSlide(index) {
  const slides = document.getElementsByClassName("slide");
  slideIndex = (index + slides.length) % slides.length;

  for (let s of slides) s.style.display = "none";
  slides[slideIndex].style.display = "block";
}

function nextSlide() {
  showSlide(slideIndex + 1);
}

function plusSlides(n) {
  showSlide(slideIndex + n);
}
