const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const bgImg = new Image();
bgImg.src = "background.png"; // dosya adın neyse aynısını yaz!



const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.5;

const characterImg = new Image();
characterImg.src = "character.png";

const heartImg = new Image();
heartImg.src = "heart.png";

const brokenHeartImg = new Image();
brokenHeartImg.src = "broken_heart.png";

let characterDirection = 0; // 0: önden

let character = {
  x: 200,
  y: 260,
  width: 32,
  height: 48,
  speed: 3,
  vy: 0,
  gravity: 0.5,
  jumpPower: -10,
  onGround: true
};
let movingLeft = false;
let movingRight = false;

let frameIndex = 0;
let frameCount = 4; // 4 kare var
let frameDelay = 0;
let frameDelayMax = 6; // Ne kadar yavaş animasyon dönsün


let keys = {};
let isPaused = false;
let score = 0;
let hearts = [];
let brokenHearts = [];
let platforms = [
  { x: 80, y: 235, width: 140, height: 8, type: "normal" }, // sabit
  { x: 60, y: 160, width: 120, height: 8, type: "moving", direction: 1 },
  { x: 150, y: 120, width: 100, height: 8, type: "bouncer" },
  { x: 40, y: 100, width: 120, height: 8, type: "slippery" },
  { x: 200, y: 60, width: 120, height: 8, type: "falling", timer: 0, falling: false }
];




document.addEventListener("keydown", function(e) {
  keys[e.key] = true;

  if (e.key === "Escape") {
    isPaused = !isPaused;

    if (isPaused) {
      bgMusic.pause();
      document.getElementById("pause-menu").style.display = "block";
    } else {
      bgMusic.play().catch(() => {});
      document.getElementById("pause-menu").style.display = "none";
    }
  }
});

document.addEventListener("keyup", function(e) {
  keys[e.key] = false;

  // Eğer hem sağ hem sol tuşları bırakıldıysa → karakter öne dönsün
  if (!keys["ArrowLeft"] && !keys["a"] && !keys["ArrowRight"] && !keys["d"]) {
    characterDirection = 0; // öne dön
  }
});


canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  character.x = clickX - character.width / 2;
});

function restartGame() {
  location.reload();
}

function toggleSound() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

function goToMainMenu() {
  alert("Ana Menüye yönlendirileceksiniz... (buraya yönlendirme eklenebilir)");
}

function spawnHeart() {
  if (hearts.length < 3) {
    const life = Math.random() * 4000 + 3000;
    hearts.push({
      x: Math.random() * (canvas.width - 32),
      y: Math.random() * 150 + 50,
      lifetime: life,
      total: life,
      opacity: 0
    });
  }
}

function spawnBrokenHeart() {
  if (brokenHearts.length < 2) {
    const life = Math.random() * 4000 + 3000;
    brokenHearts.push({
      x: Math.random() * (canvas.width - 32),
      y: Math.random() * 150 + 50,
      lifetime: life,
      total: life,
      opacity: 0
    });
  }
}

function updatePlatforms() {
  platforms.forEach(p => {
    if (p.type === "moving") {
      p.x += p.direction * 1.5;
      if (p.x <= 20 || p.x + p.width >= canvas.width - 20) {
        p.direction *= -1;
      }
    }

    if (p.type === "falling" && p.falling) {
      p.y += 2;
    }
  });
}


function updateCharacter() {
  
  // Tuşlara basılı mı kontrol et
  let movingLeft = keys["ArrowLeft"] || keys["a"];
  let movingRight = keys["ArrowRight"] || keys["d"];

  // Yatay hareket
  if (movingLeft) {
    character.x -= character.speed;
  }
  if (movingRight) {
    character.x += character.speed;
  }

  // Zıplama (boşluk tuşu)
  if ((keys[" "] || keys["Space"]) && character.onGround) {
    character.vy = character.jumpPower;
    character.onGround = false;
  }

  // Yer çekimi
  character.vy += character.gravity;
  character.y += character.vy;

  let onAnyPlatform = false;

platforms.forEach(p => {
  if (
    character.y + character.height <= p.y + character.vy &&
    character.y + character.height + character.vy >= p.y &&
    character.x + character.width > p.x &&
    character.x < p.x + p.width
  ) {
    character.y = p.y - character.height;
    character.vy = 0;
    character.onGround = true;
    onAnyPlatform = true;

    if (p.type === "moving") {
      character.x += p.direction * 1.5;
    }

    if (p.type === "bouncer") {
      character.vy = -12;
    }

    if (p.type === "slippery") {
      if (keys["ArrowLeft"] || keys["a"]) character.x -= 1.5;
      if (keys["ArrowRight"] || keys["d"]) character.x += 1.5;
    }

    if (p.type === "falling" && !p.falling) {
      p.timer += 1;
      if (p.timer >= 30) {
        p.falling = true;
      }
    }
  }
});

  


  // Zemine değdiyse
  if (character.y + character.height >= canvas.height) {
    character.y = canvas.height - character.height;
    character.vy = 0;
    character.onGround = true;
  }

  // Yürüyüş animasyonu
  if (movingLeft || movingRight) {
    frameDelay++;
    if (frameDelay >= frameDelayMax) {
      frameDelay = 0;
      frameIndex = (frameIndex + 1) % frameCount;
    }
  } else {
    frameIndex = 0; // duruyorsa ilk kare
  }

  if (movingLeft) {
    character.x -= character.speed;
    characterDirection = 1; // sola bak
  }
  if (movingRight) {
    character.x += character.speed;
    characterDirection = 3; // sağa bak
  }
  
}


function updateHearts() {
  hearts.forEach(h => {
    h.lifetime -= 16;
    h.opacity = h.lifetime > h.total - 500
      ? 1 - ((h.lifetime - (h.total - 500)) / 500)
      : (h.lifetime <= 500 ? h.lifetime / 500 : 1);
  });
  hearts = hearts.filter(h => h.lifetime > 0);

  brokenHearts.forEach(h => {
    h.lifetime -= 16;
    h.opacity = h.lifetime > h.total - 500
      ? 1 - ((h.lifetime - (h.total - 500)) / 500)
      : (h.lifetime <= 500 ? h.lifetime / 500 : 1);
  });
  brokenHearts = brokenHearts.filter(h => h.lifetime > 0);
}

function checkCollisions() {
  hearts.forEach(h => {
    if (
      character.x < h.x + 32 &&
      character.x + character.width > h.x &&
      character.y < h.y + 32 &&
      character.y + character.height > h.y
    ) {
      h.lifetime = 0;
      score++;
    }
  });

  brokenHearts.forEach(h => {
    if (
      character.x < h.x + 32 &&
      character.x + character.width > h.x &&
      character.y < h.y + 32 &&
      character.y + character.height > h.y
    ) {
      h.lifetime = 0;
      score--;
      const alert = document.getElementById("alert-effect");
      alert.style.display = "block";
      alert.style.animation = "popEffect 0.4s ease";
      setTimeout(() => {
        alert.style.display = "none";
        alert.style.animation = "none";
      }, 1000);
    }
  });
}

function draw() {
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    characterImg,
    characterDirection * character.width, 0,
    character.width, character.height,
    character.x, character.y,
    character.width, character.height
  ); 
  platforms.forEach(p => {
    if (p.type === "normal") ctx.fillStyle = "#555";
    if (p.type === "moving") ctx.fillStyle = "#888";
    if (p.type === "bouncer") ctx.fillStyle = "#5cf";
    if (p.type === "slippery") ctx.fillStyle = "#9ff";
    if (p.type === "falling") ctx.fillStyle = "#f55";
  
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
  
  
  hearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.opacity;
    ctx.drawImage(heartImg, h.x, h.y, 32, 32);
    ctx.restore();
  });

  brokenHearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.opacity;
    ctx.drawImage(brokenHeartImg, h.x, h.y, 32, 32);
    ctx.restore();
  });

  document.getElementById("heart-count").textContent = `❤️ ${score}`;
}

function gameLoop() {
  if (isPaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  updatePlatforms();
  updateCharacter();
  updateHearts();
  checkCollisions();
  draw();
  spawnHeart();
  spawnBrokenHeart();

  requestAnimationFrame(gameLoop);
}



document.addEventListener("keydown", () => {
  bgMusic.play().catch(() => {});
}, { once: true });

canvas.addEventListener("click", () => {
  bgMusic.play().catch(() => {});
}, { once: true });

characterImg.onload = () => {
  gameLoop();
};
