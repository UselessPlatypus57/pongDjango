const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const PADDLE_W = 10, PADDLE_H = 80, BALL = 10, WIN = 5;
const PX = 20, AX = W - 20 - PADDLE_W;

const player = { y: 0, score: 0 };
const ai = { y: 0, score: 0 };
let ball, running = false, over = false;
const keys = {};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  keys[e.key] = true;
  if ([" ", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
  if (e.key === " " && !running) start();
});
addEventListener("keyup", e => { keys[e.key] = false; });

function resetBall(dir) {
  const angle = (Math.random() - 0.5) * Math.PI / 3;
  const speed = 6;
  ball = { x: W / 2, y: H / 2, vx: dir * speed * Math.cos(angle), vy: speed * Math.sin(angle) };
}

function start() {
  player.score = ai.score = 0;
  player.y = ai.y = H / 2 - PADDLE_H / 2;
  over = false;
  running = true;
  resetBall(Math.random() < 0.5 ? 1 : -1);
}

function bounce(p, x, dir) {
  const hit = ball.y + BALL > p.y && ball.y < p.y + PADDLE_H &&
              ball.x < x + PADDLE_W && ball.x + BALL > x;
  if (!hit) return;
  const rel = (ball.y + BALL / 2 - (p.y + PADDLE_H / 2)) / (PADDLE_H / 2);
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.05, 14);
  const angle = rel * Math.PI / 4;
  ball.vx = dir * speed * Math.cos(angle);
  ball.vy = speed * Math.sin(angle);
}

function update() {
  if (keys["ArrowUp"] || keys["w"]) player.y -= 7;
  if (keys["ArrowDown"] || keys["s"]) player.y += 7;
  player.y = clamp(player.y, 0, H - PADDLE_H);

  // Simple AI: chase the ball, but with a capped speed so it can lose
  ai.y += clamp(ball.y - PADDLE_H / 2 - ai.y, -4.5, 4.5);
  ai.y = clamp(ai.y, 0, H - PADDLE_H);

  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.y < 0 || ball.y > H - BALL) {
    ball.vy *= -1;
    ball.y = clamp(ball.y, 0, H - BALL);
  }

  if (ball.vx < 0) bounce(player, PX, 1);
  else bounce(ai, AX, -1);

  if (ball.x < -BALL) { ai.score++; resetBall(1); }
  if (ball.x > W) { player.score++; resetBall(-1); }

  if (player.score >= WIN || ai.score >= WIN) endGame();
}

function endGame() {
  running = false;
  over = true;
  saveScore();
}

async function saveScore() {
  const name = document.getElementById("name").value.trim() || "Anonymous";
  await fetch("/api/scores/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRFToken": CSRF_TOKEN },
    body: JSON.stringify({ player_name: name, player_score: player.score, ai_score: ai.score }),
  });
  loadScores();
}

async function loadScores() {
  const res = await fetch("/api/scores/");
  const data = await res.json();
  const list = document.getElementById("board");
  list.innerHTML = "";
  data.scores.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name}: ${s.player} - ${s.ai}`;  // textContent avoids XSS
    list.appendChild(li);
  });
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";

  for (let y = 0; y < H; y += 30) ctx.fillRect(W / 2 - 2, y, 4, 15); // center line
  ctx.fillRect(PX, player.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(AX, ai.y, PADDLE_W, PADDLE_H);
  if (ball) ctx.fillRect(ball.x, ball.y, BALL, BALL);

  ctx.font = "48px monospace";
  ctx.textAlign = "center";
  ctx.fillText(player.score, W / 2 - 60, 60);
  ctx.fillText(ai.score, W / 2 + 60, 60);

  ctx.font = "24px sans-serif";
  if (!running) {
    const msg = over ? (player.score > ai.score ? "You win!" : "You lose!") : "";
    if (msg) ctx.fillText(msg, W / 2, H / 2 - 20);
    ctx.fillText("Press SPACE to play", W / 2, H / 2 + 20);
  }
}

function loop() {
  if (running) update();
  draw();
  requestAnimationFrame(loop);
}

player.y = ai.y = H / 2 - PADDLE_H / 2;
loadScores();
loop();