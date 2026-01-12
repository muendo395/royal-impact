const chatlogs = document.getElementById("chatlogs");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => { if(e.key === "Enter") sendMessage(); });

function sendMessage() {
  const msg = userInput.value.trim();
  if(!msg) return;
  
  appendMessage("You", msg);
  userInput.value = "";
  
  // Simple AI responses
  let response = "Sorry, I didn't understand that.";
  if(/hello|hi/i.test(msg)) response = "Hello! Welcome to RIA. How can we help you?";
  if(/about/i.test(msg)) response = "Royal Impact Association empowers communities through education and development programs.";
  if(/services/i.test(msg)) response = "We offer community development programs, educational workshops, and volunteer opportunities.";
  if(/contact/i.test(msg)) response = "You can contact us via the form on our website.";
  
  setTimeout(() => appendMessage("RIA Bot", response), 500);
}

function appendMessage(sender, message){
  const msgDiv = document.createElement("div");
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatlogs.appendChild(msgDiv);
  chatlogs.scrollTop = chatlogs.scrollHeight;
}
