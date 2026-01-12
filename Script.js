// Modal
const modal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeBtn = document.querySelector(".close");
loginBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if(e.target == modal) modal.style.display = "none"; }

// Signup/Login
const signupBtn = document.getElementById("signupBtn");
const loginUserBtn = document.getElementById("loginUserBtn");
const loginMsg = document.getElementById("login-msg");

signupBtn.addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if(username && password){
    localStorage.setItem(username, password);
    loginMsg.textContent = "Signup successful! You can now login.";
  } else {
    loginMsg.textContent = "Please enter username and password.";
  }
});

loginUserBtn.addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const storedPass = localStorage.getItem(username);
  if(storedPass === password){
    loginMsg.textContent = "Login successful! Welcome, " + username;
    modal.style.display = "none";
  } else {
    loginMsg.textContent = "Invalid credentials!";
  }
});

// Contact Form
document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  alert("Message sent! Thank you for contacting RIA.");
  document.getElementById("contactForm").reset();
});
