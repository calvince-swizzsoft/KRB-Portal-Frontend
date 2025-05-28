const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

const mobileToggleBtn = document.getElementById('mobileToggleBtn');

function isMobile() {
  return window.innerWidth <= 768;
}

function updateMobileToggleText() {
  if (container.classList.contains("right-panel-active")) {
    mobileToggleBtn.textContent = "Already have an Account Sign In";
  } else {
    mobileToggleBtn.textContent = "Don't have an Account? Sign Up";
  }
}

mobileToggleBtn.addEventListener('click', () => {
  container.classList.toggle("right-panel-active");
  updateMobileToggleText();
});

window.addEventListener("resize", () => {
  if (!isMobile()) {
    mobileToggleBtn.style.display = "none";
    container.classList.remove("mobile-mode");
  } else {
    mobileToggleBtn.style.display = "block";
    container.classList.add("mobile-mode");
    updateMobileToggleText();
  }
});

// Initial check
if (isMobile()) {
  mobileToggleBtn.style.display = "block";
  container.classList.add("mobile-mode");
  updateMobileToggleText();
} else {
  mobileToggleBtn.style.display = "none";
}
