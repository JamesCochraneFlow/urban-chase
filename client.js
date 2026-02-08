const socket = io("https://urban-chase-server.onrender.com", {
  transports: ["websocket"]
});

let map;
let myMarker;

let role = "Runner"; // or "Hunter"
let playerLat = 0;
let playerLon = 0;
let roundActive = false;
let roundTime = 1000;

const roleText = document.getElementById("role");
const statusText = document.getElementById("status");
const coordsText = document.getElementById("coords");
const timerText = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");







navigator.geolocation.getCurrentPosition((position) => {
  playerLat = position.coords.latitude;
  playerLon = position.coords.longitude;

  map = L.map("map").setView([playerLat, playerLon], 18);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  myMarker = L.marker([playerLat, playerLon]).addTo(map)
    .bindPopup("You")
    .openPopup();

  socket.emit("join", { lat: playerLat, lon: playerLon, role });
});











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



  if (myMarker) {
  myMarker.setLatLng([playerLat, playerLon]);
  map.panTo([playerLat, playerLon], { animate: true });
}



  playerLat = position.coords.latitude;
  playerLon = position.coords.longitude;

  socket.emit("updatePosition", { lat: playerLat, lon: playerLon, role });

  coordsText.textContent =
  `You are at:
  ${playerLat.toFixed(6)}, ${playerLon.toFixed(6)}`;
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



let otherMarkers = {};

socket.on("updatePlayers", (players) => {
  for (let id in players) {
    if (id === socket.id) continue;

    const p = players[id];

    if (!otherMarkers[id]) {
      otherMarkers[id] = L.circleMarker([p.lat, p.lon], {
        radius: 8,
        color: p.role === "Hunter" ? "red" : "blue"
      }).addTo(map);
    } else {
      otherMarkers[id].setLatLng([p.lat, p.lon]);
    }
  }
});
