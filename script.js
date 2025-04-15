const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const bgImg = new Image();
bgImg.src = "background.png"; // dosya adın neyse aynısını yaz!
const movingPlatformImg = new Image();
movingPlatformImg.src = "platform_moving.png";

const bouncerPlatformImg = new Image();
bouncerPlatformImg.src = "platform_bouncer.png";

const fallingPlatformImg = new Image();
fallingPlatformImg.src = "platform_falling.png";



const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 0.3;

const characterImg = new Image();
characterImg.src = "character.png";

let loopStarted = false;

let gameStarted = false;

let characterDirection = 0; // 0: önden

let character = {
  x: 200,
  y: 260,
  width: 24,
  height: 51,
  speed: 1,
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

let gamePaused = false;
let lastHeartTime = 0;
let heartSpawnDelay = 2000; // 2 saniye (milisaniye)
let lastBrokenTime = 0;
let brokenSpawnDelay = 5000; // 5 saniyede birden fazla çıkmasın

let keys = {};
let isPaused = false;
let score = 0;
let hearts = [];

let flyingHearts = [];
let pulseRings = [];


let brokenHearts = [];
let platforms = [
  { x: 60, y: 160, width: 60, height: 23, type: "moving", direction: 0.5 },
  { x: 150, y: 80, width: 60, height: 23, type: "moving", direction: 1 },
  { x: 300, y: 250, width: 60, height: 23, type: "moving", direction: 1.2 },
  { x: 320, y: 295, width: 48, height: 27, type: "bouncer" },
  { x: 200, y: 100, width: 73, height: 40, type: "falling", timer: 0, falling: false }
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

function startGameLoopOnce() {
  if (!loopStarted) {
    loopStarted = true;
    requestAnimationFrame(gameLoop);
  }
}


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
  isPaused = true;
  gameStarted = false;
  document.getElementById("pause-menu").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";
  bgMusic.pause();
  bgMusic.currentTime = 0;
  // loopStarted DEĞİŞTİRME!
}



  // ESC menüsü kapansın
  document.getElementById("pause-menu").style.display = "none";

  // Ana menü ekranı gelsin
  document.getElementById("start-screen").style.display = "flex";

  // 🎵 Müzik dursun
  if (bgMusic && !bgMusic.paused) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  // İsteğe bağlı: oyun baştan başlasın
  // location.reload();




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
      score++;// 💫 Yukarı uçan kalp
      flyingHearts.push({
        x: h.x,
        y: h.y,
        start: Date.now(),
        life: 600
      });
      
      // 🌟 Parıltı halkası
      pulseRings.push({
        x: h.x + 16,
        y: h.y + 16,
        start: Date.now(),
        life: 400
      });
      document.getElementById("heart-count").textContent = score;

      const sound = document.getElementById("bloop-sound");
      sound.volume = 1.0;
      sound.currentTime = 0;
      sound.play().catch(e => {
      console.log("Ses çalınamadı:", e);
});

// 💫 Yukarı uçan kalp
flyingHearts.push({
  x: h.x,
  y: h.y,
  start: Date.now(),
  life: 600
});

// 🌟 Parıltı halkası
pulseRings.push({
  x: h.x + 16,
  y: h.y + 16,
  start: Date.now(),
  life: 400
});

      // 💓 Skor kutusu nabız
      const scoreBox = document.getElementById("score-board");
      scoreBox.classList.remove("pulse");
      void scoreBox.offsetWidth;
      scoreBox.classList.add("pulse");




// Kalp zıplama efekti
const heartEmoji = document.getElementById("heart-emoji");
heartEmoji.classList.remove("animate"); // önce çıkar
void heartEmoji.offsetWidth; // reflow ile sıfırla
heartEmoji.classList.add("animate"); // sonra tekrar ekle

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
      if (!gamePaused) {
        const wrongSound = document.getElementById("wrong-sound");
        if (wrongSound) {
          try {
            wrongSound.pause();
            wrongSound.currentTime = 0;
            wrongSound.play().catch((e) =>
              console.warn("Kırık kalp sesi çalınamadı:", e)
            );
          } catch (err) {
            console.error("Ses hatası:", err);
          }
        } else {
          console.warn("wrong-sound elementi bulunamadı");
        }
      }
      
      const alert = document.getElementById("alert-effect");
      alert.style.display = "block";
      alert.style.animation = "popEffect 0.4s ease";
      setTimeout(() => {
        alert.style.display = "none";
        alert.style.animation = "none";
      }, 1000);
    }
  });

  // Skor 22 olunca yeni sayfaya geç
  if (score >= 3) {
  window.location.href = "oyun2.html"; // yönlendirme yapılacak sayfa
  }

}

function draw() {

  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  const spriteWidth = 32;
const spriteHeight = 69;
const drawWidth = 24;
const drawHeight = 51;
const directionMap = {
  0: 0, // önden
  1: 3, // sola bakan kare → 4. kare
  2: 1, // arkası dönük kare → 2. kare
  3: 2  // sağa bakan kare → 3. kare
};
const spriteIndex = directionMap[characterDirection] || 0;

ctx.drawImage(
  characterImg,
  spriteIndex * spriteWidth, 0,
  spriteWidth, spriteHeight,
  character.x, character.y,
  drawWidth, drawHeight
);

platforms.forEach(p => {
  let img;

  if (p.type === "moving") img = movingPlatformImg;
  else if (p.type === "bouncer") img = bouncerPlatformImg;
  else if (p.type === "falling") img = fallingPlatformImg;

  if (img) {
    ctx.drawImage(img, p.x, p.y, p.width, p.height);
  }
});


  
  
  hearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.opacity;
    ctx.restore();
  });

  brokenHearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.opacity;
    ctx.restore();
  });

  // 🔴 TEST MODU: Kalpleri emojiyle de göster
  hearts.forEach(h => {
    ctx.save();
  
    const t = Date.now() / 300 + h.x;
    const pulse = 1 + 0.12 * Math.sin(t); // sadece nabız efekti
  
    ctx.globalAlpha = h.opacity; // sabit görünürlük
    ctx.translate(h.x + 16, h.y + 16);
    ctx.scale(pulse, pulse);
    ctx.font = "16px Arial";
    ctx.fillText("❤️", -8, +6); 
  
    ctx.restore();
  });
    
    
    
    

  brokenHearts.forEach(h => {

    ctx.save();
  
    const t = Date.now() / 400 + h.x;
    const pulse = 1 + 0.05 * Math.sin(t);
    const shake = Math.sin(t * 8) * 1.5;
  
    ctx.globalAlpha = h.opacity ;
    ctx.translate(h.x + 16 + shake, h.y + 16);
    ctx.scale(pulse, pulse);
    ctx.font = "16px Arial";
    ctx.fillText("💔", -8, +6);
    ctx.restore();
  });

  flyingHearts = flyingHearts.filter(f => {
    const t = Date.now() - f.start;
    if (t > f.life) return false;
    const progress = t / f.life;
    const y = f.y - progress * 40;
    const alpha = 1 - progress;
  
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "20px Arial";
    ctx.fillText("❤️", f.x + 8, y);
    ctx.restore();
  
    return true;
  });

  pulseRings = pulseRings.filter(r => {
    const t = Date.now() - r.start;
    if (t > r.life) return false;
    const progress = t / r.life;
    const radius = 5 + 20 * progress;
    const alpha = 1 - progress;
  
    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 192, 203, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  
    return true;
  });
  
  
  document.getElementById("heart-count").textContent = score;

  

}

function gameLoop() {

 
  if (isPaused) {
    requestAnimationFrame(gameLoop);
    return;
  }
  if (!gameStarted) return;
  updatePlatforms();
  updateCharacter();
  updateHearts();
  checkCollisions();
  draw();
  // ❤️ Normal kalp oluşturma kontrolü
if (Date.now() - lastHeartTime > heartSpawnDelay && hearts.length < 2) {
  spawnHeart();
  lastHeartTime = Date.now();
}

// 💔 Kırık kalp oluşturma kontrolü
if (
  Date.now() - lastBrokenTime > brokenSpawnDelay &&
  brokenHearts.length < 1 &&
  Math.random() < 0.01 // %1 ihtimal
) {
  spawnBrokenHeart();
  lastBrokenTime = Date.now();
}

  requestAnimationFrame(gameLoop);
}



document.addEventListener("keydown", () => {
  bgMusic.play().catch(() => {});
}, { once: true });

canvas.addEventListener("click", () => {
  bgMusic.play().catch(() => {});
}, { once: true });


document.body.addEventListener("click", () => {
  const s = document.getElementById("wrong-sound");
  if (s) s.play().catch(() => {});
}, { once: true });

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  bgMusic.play().catch(() => {});
  isPaused = false;
  gameStarted = true;
  startGameLoopOnce(); // ✅ sadece ilk kez çalıştırılır
});
