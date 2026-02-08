const socket = io("https://urban-chase-server.onrender.com", {
  transports: ["websocket"]
});

let role = "Runner"; // or "Hunter"
let playerLat = 0;
let playerLon = 0;
let roundActive = false;
let roundTime = 1000;

const roleText = document.getElementById("role");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");

roleText.textContent = `Role: ${role}`;

startBtn.addEventListener("click", () => {
  startRound();
});

function startRound() {
  if (!navigator.geolocation) {
    statusText.textContent = "Geolocation not supported";
    return;
  }

  statusText.textContent = "GPS active. Round started!";
  roundActive = true;

  navigator.geolocation.watchPosition(updatePosition, gpsError, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });

  let timerInterval = setInterval(() => {
    if (!roundActive) {
      clearInterval(timerInterval);
      return;
    }
    roundTime--;
    timerText.textContent = `Time Left: ${roundTime}`;
    if (roundTime <= 0) {
      roundActive = false;
      statusText.textContent = "Round Ended!";
      clearInterval(timerInterval);
    }
  }, 1000);
}

function updatePosition(position) {
  playerLat = position.coords.latitude;
  playerLon = position.coords.longitude;

  socket.emit("updatePosition", { lat: playerLat, lon: playerLon, role });
}



function gpsError(err) {
  statusText.textContent = `GPS Error: ${err.message}`;
}

navigator.geolocation.getCurrentPosition((position) => {
  playerLat = position.coords.latitude;
  playerLon = position.coords.longitude;
  socket.emit("join", { lat: playerLat, lon: playerLon, role });
  statusText.textContent = "Joined game!";
});

socket.on("captured", (data) => {
  statusText.textContent = "You captured a runner!";
});

socket.on("capturedBy", (data) => {
  statusText.textContent = "You were captured!";
});

socket.on("updatePlayers", (players) => {
  console.log("Players:", players);
});
