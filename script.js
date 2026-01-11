const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const fighterButtons = document.getElementById("fighterButtons");
const fighterNameEl = document.getElementById("fighterName");
const healthEl = document.getElementById("health");
const killsEl = document.getElementById("kills");
const specialEl = document.getElementById("special");
const specialBtn = document.getElementById("specialBtn");

const fighters = [
  { name: "Jason", palette: "jason", special: "Crystal Lake Cleaver" },
  { name: "Freddy", palette: "freddy", special: "Nightmare Slash" },
  { name: "Michael", palette: "michael", special: "Silent Stab" },
  { name: "Art", palette: "art", special: "Terrifier Twirl" },
  { name: "Pennywise", palette: "pennywise", special: "Deadlights Lunge" },
  { name: "Chucky", palette: "chucky", special: "Doll Rage" },
];

const spritePalettes = {
  base: {
    ".": null,
    S: "#1a1a1a",
    F: "#f1d8c5",
    M: "#e5e5e5",
    R: "#b21f24",
    B: "#1f3a93",
    G: "#215c3b",
    Y: "#d6a319",
    O: "#f08f3c",
    W: "#f7f7f7",
    H: "#7a4f2f",
  },
  jason: {
    S: "#1a1a1a",
    F: "#e9d4be",
    M: "#efe9e2",
    R: "#ad1b1b",
    G: "#2b6b3f",
    B: "#4c6a82",
    H: "#4b2f1e",
  },
  freddy: {
    S: "#1a1a1a",
    F: "#e5c6a7",
    M: "#6b3b1e",
    R: "#a3161e",
    O: "#f08f3c",
    G: "#2d5a3a",
    H: "#7a4f2f",
  },
  michael: {
    S: "#1a1a1a",
    F: "#e1e1e1",
    M: "#f2f2f2",
    B: "#1f2f3f",
    G: "#203a2b",
  },
  art: {
    S: "#111111",
    F: "#f1f1f1",
    M: "#ffffff",
    R: "#ad1b1b",
    W: "#f7f7f7",
  },
  pennywise: {
    S: "#1a1a1a",
    F: "#f3d8c4",
    M: "#f8f3ef",
    R: "#b21f24",
    O: "#f08f3c",
    W: "#f7f7f7",
  },
  chucky: {
    S: "#1a1a1a",
    F: "#f1c9a6",
    M: "#e8d5c4",
    R: "#b21f24",
    B: "#2f4f8f",
    G: "#2d6b3d",
    Y: "#d6a319",
    O: "#f08f3c",
    H: "#7a4f2f",
  },
  npcFlee: {
    S: "#1a1a1a",
    F: "#d9c6b5",
    M: "#f0f0f0",
    B: "#4f7cff",
    G: "#3c6f4c",
  },
  npcFight: {
    S: "#1a1a1a",
    F: "#d9c6b5",
    M: "#f0f0f0",
    R: "#e05a5a",
    G: "#4c3a2a",
  },
};

const spriteTemplate = [
  "..SSSSSS..",
  ".SMMMMMMS.",
  ".SMFFFFMS.",
  ".SMFRRFMS.",
  ".SMFFFFMS.",
  "..SSSSSS..",
  "...GGG....",
  "..GGBGG...",
  ".GGGBBGG..",
  ".GGGBBGG..",
  ".GBBBBBG..",
  "..BBBBB...",
  "..B...B...",
  ".BB...BB..",
];

const state = {
  player: {
    x: 120,
    y: 380,
    width: 40,
    height: 70,
    speed: 3.2,
    health: 100,
    facing: 1,
    attackCooldown: 0,
    specialReady: false,
    kills: 0,
    fighter: fighters[0],
  },
  npcs: [],
  worldWidth: 2400,
  scrollX: 0,
  lastSpawn: 0,
  message: "",
  messageTimer: 0,
  groundHeight: 120,
  groundY: 420,
};

const controls = {
  left: false,
  right: false,
  attack: false,
  special: false,
};

function spawnNpc() {
  const spawnX = state.scrollX + canvas.width + 120 + Math.random() * 300;
  const behavior = Math.random() < 0.55 ? "flee" : "fight";
  state.npcs.push({
    x: spawnX,
    y: state.groundY - 60,
    width: 30,
    height: 60,
    health: 30,
    behavior,
    attackCooldown: 0,
  });
}

function updateHud() {
  fighterNameEl.textContent = `Fighter: ${state.player.fighter.name}`;
  healthEl.textContent = `Health: ${Math.max(0, Math.round(state.player.health))}`;
  killsEl.textContent = `Kills: ${state.player.kills}`;
  if (state.player.specialReady) {
    specialEl.textContent = `Special: ${state.player.fighter.special} READY`;
    specialBtn.classList.add("ready");
  } else {
    specialEl.textContent = "Special: Not ready";
    specialBtn.classList.remove("ready");
  }
}

function handleInput() {
  if (controls.left) {
    state.player.x -= state.player.speed;
    state.player.facing = -1;
  }
  if (controls.right) {
    state.player.x += state.player.speed;
    state.player.facing = 1;
  }
  state.player.x = Math.max(40, Math.min(state.player.x, state.worldWidth - 80));

  if (controls.attack && state.player.attackCooldown <= 0) {
    performAttack(false);
    state.player.attackCooldown = 30;
  }

  if (controls.special && state.player.specialReady) {
    performAttack(true);
    state.player.specialReady = false;
    controls.special = false;
  } else if (controls.special && !state.player.specialReady) {
    controls.special = false;
  }
}

function performAttack(isSpecial) {
  const range = isSpecial ? 160 : 70;
  const damage = isSpecial ? 100 : 20;
  const centerX = state.player.x + state.player.width / 2 + state.player.facing * 20;
  const hitTargets = state.npcs.filter((npc) =>
    Math.abs(npc.x - centerX) < range
  );

  hitTargets.forEach((npc) => {
    npc.health -= damage;
  });

  if (isSpecial) {
    state.message = `${state.player.fighter.special}!`;
    state.messageTimer = 90;
  }
}

function updateNpcs() {
  const playerCenter = state.player.x + state.player.width / 2;
  state.npcs.forEach((npc) => {
    const npcCenter = npc.x + npc.width / 2;
    if (npc.behavior === "flee") {
      const direction = npcCenter < playerCenter ? -1 : 1;
      npc.x += direction * 2.4;
    } else {
      const direction = npcCenter < playerCenter ? 1 : -1;
      npc.x += direction * 1.6;
      const distance = Math.abs(npcCenter - playerCenter);
      if (distance < 60 && npc.attackCooldown <= 0) {
        state.player.health -= 6;
        npc.attackCooldown = 50;
      }
    }
    npc.attackCooldown = Math.max(0, npc.attackCooldown - 1);
  });
}

function cleanupNpcs() {
  const before = state.npcs.length;
  state.npcs = state.npcs.filter((npc) => {
    if (npc.health <= 0) {
      state.player.kills += 1;
      if (state.player.kills % 10 === 0) {
        state.player.specialReady = true;
      }
      return false;
    }
    return npc.x > -200 && npc.x < state.worldWidth + 200;
  });
  if (before !== state.npcs.length) {
    updateHud();
  }
}

function updateScroll() {
  const targetScroll = state.player.x - canvas.width * 0.4;
  state.scrollX = Math.max(0, Math.min(targetScroll, state.worldWidth - canvas.width));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1d0f0f";
  ctx.fillRect(0, state.groundY, canvas.width, state.groundHeight);

  ctx.fillStyle = "#2a1b1b";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 160 - state.scrollX * 0.3) % 1200;
    ctx.fillRect(x, state.groundY - 120, 80, 120);
  }

  drawPlayer();
  drawNpcs();

  if (state.messageTimer > 0) {
    ctx.fillStyle = "#ff3344";
    ctx.font = "bold 28px Trebuchet MS";
    ctx.fillText(state.message, 40, 60);
    state.messageTimer -= 1;
  }
}

function drawPlayer() {
  const player = state.player;
  const drawX = player.x - state.scrollX;
  drawPixelSprite({
    x: drawX,
    y: player.y,
    width: player.width,
    height: player.height,
    paletteName: player.fighter.palette,
  });

  ctx.fillStyle = "#fff";
  ctx.font = "12px Trebuchet MS";
  ctx.fillText(player.fighter.name, drawX - 8, player.y - 6);
}

function drawNpcs() {
  state.npcs.forEach((npc) => {
    const drawX = npc.x - state.scrollX;
    drawPixelSprite({
      x: drawX,
      y: npc.y,
      width: npc.width,
      height: npc.height,
      paletteName: npc.behavior === "flee" ? "npcFlee" : "npcFight",
    });
  });
}

function drawPixelSprite({ x, y, width, height, paletteName }) {
  const sprite = spriteTemplate;
  const palette = {
    ...spritePalettes.base,
    ...spritePalettes[paletteName],
  };
  const rows = sprite.length;
  const cols = sprite[0].length;
  const pixelWidth = width / cols;
  const pixelHeight = height / rows;

  sprite.forEach((row, rowIndex) => {
    [...row].forEach((cell, colIndex) => {
      const color = palette[cell];
      if (!color) {
        return;
      }
      ctx.fillStyle = color;
      ctx.fillRect(
        x + colIndex * pixelWidth,
        y + rowIndex * pixelHeight,
        pixelWidth + 0.2,
        pixelHeight + 0.2
      );
    });
  });
}

function update() {
  handleInput();

  state.player.attackCooldown = Math.max(0, state.player.attackCooldown - 1);
  updateNpcs();
  cleanupNpcs();
  updateScroll();

  if (state.player.health <= 0) {
    state.player.health = 100;
    state.player.kills = 0;
    state.player.specialReady = false;
    state.npcs = [];
    state.message = "You were overwhelmed. Try again!";
    state.messageTimer = 120;
    updateHud();
  }

  if (Date.now() - state.lastSpawn > 1500) {
    spawnNpc();
    state.lastSpawn = Date.now();
  }

  draw();
  requestAnimationFrame(update);
}

function setControl(element, key) {
  const start = () => {
    controls[key] = true;
  };
  const end = () => {
    controls[key] = false;
  };
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();
    start();
  });
  element.addEventListener("touchend", (event) => {
    event.preventDefault();
    end();
  });
  element.addEventListener("mousedown", start);
  element.addEventListener("mouseup", end);
  element.addEventListener("mouseleave", end);
}

function initControls() {
  setControl(document.getElementById("left"), "left");
  setControl(document.getElementById("right"), "right");

  const attackBtn = document.getElementById("attack");
  setControl(attackBtn, "attack");

  specialBtn.addEventListener("click", () => {
    controls.special = true;
  });
  specialBtn.addEventListener("touchstart", (event) => {
    event.preventDefault();
    controls.special = true;
  });
}

function initFighterSelection() {
  fighters.forEach((fighter, index) => {
    const button = document.createElement("button");
    button.textContent = fighter.name;
    if (index === 0) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => {
      state.player.fighter = fighter;
      document.querySelectorAll(".fighter-buttons button").forEach((btn) => {
        btn.classList.remove("active");
      });
      button.classList.add("active");
      updateHud();
    });
    fighterButtons.appendChild(button);
  });
}

function resizeCanvas() {
  const ratio = 16 / 9;
  const maxWidth = Math.min(window.innerWidth - 24, 960);
  canvas.width = maxWidth;
  canvas.height = Math.round(maxWidth / ratio);
  state.groundY = Math.max(canvas.height - state.groundHeight, canvas.height * 0.7);
  state.player.y = state.groundY - state.player.height;
  state.npcs.forEach((npc) => {
    npc.y = state.groundY - npc.height;
  });
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
initControls();
initFighterSelection();
updateHud();
requestAnimationFrame(update);
