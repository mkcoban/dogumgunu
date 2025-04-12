const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.5;

const bgImage = new Image();
bgImage.src = "background.png";

const characterImg = new Image();
characterImg.src = "character.png";

let character = {
  x: 100,
  y: 260,
  width: 32,
  height: 48,
  speed: 2,
  targetX: null
};

let frameIndex = 0;
let frameCount = 4; // toplam 4 kare
let frameWidth = 32;
let frameHeight = 48;
let frameTimer = 0;
let frameInterval = 10; // ne kadar hızlı kare değişsin (daha düşük = daha hızlı)

let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  character.targetX = clickX;
});

function updateCharacter() {
  if (keys["ArrowLeft"] || keys["a"]) {
    character.x -= character.speed;
  }
  if (keys["ArrowRight"] || keys["d"]) {
    character.x += character.speed;
  }

  if (character.targetX !== null) {
    if (Math.abs(character.x - character.targetX) < character.speed) {
      character.targetX = null;
    } else if (character.x < character.targetX) {
      character.x += character.speed;
    } else {
      character.x -= character.speed;
    }
  }
}

function drawCharacter() {
  ctx.drawImage(
    characterImg,
    frameIndex * frameWidth, 0, // kaynak X, Y (sprite içinde hangi kare)
    frameWidth, frameHeight,    // kaynak genişlik, yükseklik
    character.x, character.y,   // canvas’a çizileceği yer
    frameWidth, frameHeight     // canvas’ta çizim boyutu
  );
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  updateCharacter() // Animasyonu sadece hareket ederken oynat
  let isMoving = keys["ArrowLeft"] || keys["a"] || keys["ArrowRight"] || keys["d"] || character.targetX !== null;
  
  if (isMoving) {
    frameTimer++;
    if (frameTimer >= frameInterval) {
      frameTimer = 0;
      frameIndex = (frameIndex + 1) % frameCount; // 0-1-2-3-0 döngüsü
    }
  } else {
    frameIndex = 0; // hareket etmiyorsa ilk karede sabit kalsın
  };
  drawCharacter();
  requestAnimationFrame(gameLoop);
}

bgImage.onload = () => {
  bgMusic.play().catch(err => console.log("Müzik çalamadı:", err));
  gameLoop();
};

document.addEventListener("keydown", () => {
  bgMusic.play().catch(err => console.log("Müzik başlatılamadı:", err));
}, { once: true });

canvas.addEventListener("click", () => {
  bgMusic.play().catch(err => console.log("Müzik başlatılamadı:", err));
}, { once: true });

