// Global timer variables (in seconds, as floats)
// Initialize to 30 so that NaN is not shown at startup.
let redTime = 30, blueTime = 30, redInitial = 30, blueInitial = 30;
let currentPlayer; // "red" or "blue"
let paused = true; // Game starts paused
let lastUpdateTime;
// Flags to ensure the buzzer plays only once per turn end.
let redEnded = false, blueEnded = false;

// Element references
const redDisplay = document.getElementById("redDisplay");
const blueDisplay = document.getElementById("blueDisplay");
const redDrain = document.getElementById("redDrain");
const blueDrain = document.getElementById("blueDrain");
const startupModal = document.getElementById("startupModal");
const startTimerButton = document.getElementById("startTimerButton");

// Helper: interpolate between two colors given as [r, g, b] arrays.
function interpolateColor(start, end, factor) {
  const result = start.map((s, i) => Math.round(s + (end[i] - s) * factor));
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

// Update displays and drain overlays.
// The drain's height is computed as the fraction of total time elapsed.
function updateDisplays() {
  redDisplay.textContent = Math.ceil(redTime);
  blueDisplay.textContent = Math.ceil(blueTime);
  
  const redFraction = Math.min(1, Math.max(0, (redInitial - redTime) / redInitial));
  const blueFraction = Math.min(1, Math.max(0, (blueInitial - blueTime) / blueInitial));
  
  redDrain.style.height = (redFraction * 100) + "%";
  blueDrain.style.height = (blueFraction * 100) + "%";
  
  redDrain.style.backgroundColor = interpolateColor([139, 0, 0], [255, 200, 200], redFraction);
  blueDrain.style.backgroundColor = interpolateColor([0, 0, 139], [200, 200, 255], blueFraction);
}

// Continuous update loop using requestAnimationFrame for a smooth drain transition.
function animate() {
  const now = performance.now();
  const delta = (now - lastUpdateTime) / 1000;
  lastUpdateTime = now;

  if (!paused) {
    if (currentPlayer === "red") {
      if (redTime > 0) {
        redTime = Math.max(0, redTime - delta);
        if (redTime === 0 && !redEnded) {
          redEnded = true;
          playBuzzer();
          currentPlayer = "blue";
          blueEnded = false;
          paused = true;
        }
      }
    } else { // currentPlayer === "blue"
      if (blueTime > 0) {
        blueTime = Math.max(0, blueTime - delta);
        if (blueTime === 0 && !blueEnded) {
          blueEnded = true;
          playBuzzer();
          currentPlayer = "red";
          redEnded = false;
          paused = true;
        }
      }
    }
  }

  updateDisplays();
  requestAnimationFrame(animate);
}

// Play a buzzer sound when a timer runs out.
function playBuzzer() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
}

// Play the switch (trivia correct) sound effect.
function playSwitchSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(600, audioCtx.currentTime);
  gain1.gain.setValueAtTime(0.5, audioCtx.currentTime);
  osc1.start();
  osc1.stop(audioCtx.currentTime + 0.1);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(800, audioCtx.currentTime + 0.15);
  gain2.gain.setValueAtTime(0.5, audioCtx.currentTime + 0.15);
  osc2.start(audioCtx.currentTime + 0.15);
  osc2.stop(audioCtx.currentTime + 0.25);
}

// Global key handling:
// "s" switches turns (playing the switch sound), "p" pauses/resumes, and "r" restarts (shows the startup popup).
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "Arrow.Right") {
    if (!paused) {
      playSwitchSound();
      currentPlayer = (currentPlayer === "red") ? "blue" : "red";
      lastUpdateTime = performance.now();
      pause = true
    }
  } else if (key === ' ' || key === 'Space') {
    paused = !paused;
    lastUpdateTime = performance.now();
  } else if (key === "r") {
    paused = true;
    startupModal.style.display = "flex";
  } else if (key === 'p') {
    passTurn();
  }
});

// Pass function that turns the active player's side yellow for 3 seconds and then pauses the game.
function passTurn() {
    if (currentPlayer === "red") {
      const originalColor = "red";
      redSide.style.backgroundColor = "yellow";
      setTimeout(() => {
        redSide.style.backgroundColor = originalColor;
      }, 3000);
    } else if (currentPlayer === "blue") {
      const originalColor = "blue";
      blueSide.style.backgroundColor = "yellow";
      setTimeout(() => {
        blueSide.style.backgroundColor = originalColor;
      }, 3000);
    }
    paused = true;
  }

// Startup modal: when "Start Timer" is clicked, initialize timers and start the game.
startTimerButton.addEventListener("click", () => {
  redTime = parseFloat(document.getElementById("redTimeInput").value) || 30;
  blueTime = parseFloat(document.getElementById("blueTimeInput").value) || 30;
  redInitial = redTime;
  blueInitial = blueTime;
  currentPlayer = document.getElementById("startingColorInput").value;
  redEnded = false;
  blueEnded = false;
  startupModal.style.display = "none";
  paused = true;
  lastUpdateTime = performance.now();
});

// On page load, show the startup modal and start the animation loop.
window.onload = () => {
  startupModal.style.display = "flex";
  lastUpdateTime = performance.now();
  animate();
};
