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
/*
  Netlify serverless function to initiate an M-Pesa STK Push using Safaricom Daraja API.
  IMPORTANT: Keep your MPESA credentials as environment variables in the deployment platform.

  Required environment variables:
  - MPESA_CONSUMER_KEY
  - MPESA_CONSUMER_SECRET
  - MPESA_SHORTCODE (Business Short Code / Till number)
  - MPESA_PASSKEY
  - MPESA_ENV ("sandbox" or "production")

  Deploy this function to Netlify (netlify/functions/mpesa.js) or adapt to Vercel/Azure Functions.
*/

const axios = require('axios');

const DARO = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stk: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stk: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  }
};

function timestamp() {
  const d = new Date();
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth()+1).padStart(2,'0');
  const DD = String(d.getUTCDate()).padStart(2,'0');
  const hh = String(d.getUTCHours()).padStart(2,'0');
  const mm = String(d.getUTCMinutes()).padStart(2,'0');
  const ss = String(d.getUTCSeconds()).padStart(2,'0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try{ body = JSON.parse(event.body); }catch(e){
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { phone, amount } = body;
  if(!phone || !amount){
    return { statusCode: 400, body: JSON.stringify({ error: 'phone and amount are required' }) };
  }

  const env = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
  const cfg = DARO[env];
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE; // Business short code
  const passkey = process.env.MPESA_PASSKEY;

  if(!consumerKey || !consumerSecret || !shortcode || !passkey){
    return { statusCode: 500, body: JSON.stringify({ error: 'MPESA credentials are not set in environment variables.' }) };
  }

  try{
    // 1) Get OAuth token
    const tokenRes = await axios.get(cfg.oauth, {
      auth: { username: consumerKey, password: consumerSecret }
    });
    const token = tokenRes.data.access_token;

    // 2) Build STK Push payload
    const ts = timestamp();
    const password = Buffer.from(shortcode + passkey + ts).toString('base64');

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(Number(amount)),
      PartyA: phone, // MSISDN sending the funds (format: 2547XXXXXXXX)
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://example.com/mpesa/callback',
      AccountReference: process.env.MPESA_ACCOUNT_REF || 'RoyalImpact',
      TransactionDesc: 'Donation'
    };

    // 3) Call STK Push
    const stkRes = await axios.post(cfg.stk, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'STK Push initiated', data: stkRes.data }) };
  }catch(err){
    console.error('MPESA function error', err && err.response ? err.response.data : err.message || err);
    const msg = err && err.response && err.response.data ? err.response.data : (err.message || 'Unknown error');
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to initiate STK Push', detail: msg }) };
  }
};
