
import { DataService } from './dataService.js';

/* Move to category window */
window.goCategory = function () {
    document.body.className = "state-category";
}

let selectedOrgType = "";
let selectedRole = "";

/* Move to signup choice */
window.goSignupChoice = function (type) {
    selectedOrgType = type;
    document.body.className = "state-signup-choice";
}

/* Move to final signup + slideshow */
window.goFinalSignup = function (role) {
    selectedRole = role;
    document.body.className = "state-signup-final";
    startSlideshow();
}

/* -----------------------
   AUTH LOGIC (REAL FIREBASE)
------------------------*/
window.handleLogin = async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    const result = await DataService.login(email, pass);

    if (result.success) {
        if (email.includes('admin')) {
            window.location.href = "admin.html";
        } else {
            window.location.href = "user.html";
        }
    } else {
        alert("Login Failed: " + result.message);
    }
}

window.handleSignup = async function (e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = "password123"; // Simplification: Hardcoded pass for this UI flow as field is missing

    const result = await DataService.signup(email, pass);

    if (result.success) {
        // We could store the 'name' and 'role' in Firestore under a 'users' collection theoretically
        // For now just redirect
        if (selectedRole === 'admin') {
            alert("Account Created! Welcome Admin.");
            window.location.href = "admin.html";
        } else {
            alert("Account Created! Welcome Student.");
            window.location.href = "user.html";
        }
    } else {
        alert("Signup Failed: " + result.message);
    }
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
    if (slides.length === 0) return;

    slideIndex = (index + slides.length) % slides.length;

    for (let s of slides) s.style.display = "none";
    slides[slideIndex].style.display = "block";
}

function nextSlide() {
    showSlide(slideIndex + 1);
}