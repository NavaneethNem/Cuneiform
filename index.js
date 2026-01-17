// Show signup choice page (Student / Admin buttons)
function showSignupChoice() {
  document.body.classList.add("choose-signup");
  document.body.classList.remove("signup-active");
}

// Open actual signup form (email + password create account)
function openSignup() {
  document.body.classList.add("signup-active");
}

// OPTIONAL (recommended): Go back to login page
function backToLogin() {
  document.body.classList.remove("choose-signup");
  document.body.classList.remove("signup-active");
}
