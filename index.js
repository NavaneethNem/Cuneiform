/* Move to category window */
function goCategory() {
    document.body.className = "state-category";
}

let selectedOrgType = "";
let selectedRole = "";

/* Move to signup choice */
function goSignupChoice(type) {
    selectedOrgType = type;
    document.body.className = "state-signup-choice";
}

/* Move to final signup + slideshow */
function goFinalSignup(role) {
    selectedRole = role;
    document.body.className = "state-signup-final";
    startSlideshow();
}

/* -----------------------
   AUTH LOGIC (Simulated)
------------------------*/
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    // Simple check: Admin if email contains 'admin'
    // In a real app, this would verify against a database
    if (email.includes('admin')) {
        alert("Login Successful! Redirecting to Admin Dashboard...");
        window.location.href = "admin.html";
    } else {
        alert("Login Successful! Redirecting to Student Dashboard...");
        window.location.href = "user.html";
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;

    // Simulate Account Creation
    const newUser = {
        name: name,
        email: email,
        role: selectedRole,
        orgType: selectedOrgType
    };
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    if (selectedRole === 'admin') {
        alert("Account Created! Welcome Admin.");
        window.location.href = "admin.html";
    } else {
        alert("Account Created! Welcome Student.");
        window.location.href = "user.html";
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

function plusSlides(n) {
    showSlide(slideIndex + n);
}