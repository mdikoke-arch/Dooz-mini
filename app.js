(function () {
  const DATABASE_URL = "https://YOUR-PROJECT-default-rtdb.europe-west1.firebasedatabase.app";
  const BOT_USERNAME = "Starsgameir_bot";
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const params = new URLSearchParams(window.location.search);
  const startParam = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || params.get("room");

  const playerId = String(
    (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) ||
    localStorage.getItem("svh_uid") ||
    ("u_" + Math.random().toString(36).slice(2, 8))
  );
  localStorage.setItem("svh_uid", playerId);

  const playerName =
    (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) ||
    ("بازیکن " + playerId.slice(-4));

  let svhBalance = Number(localStorage.getItem("svh_balance_" + playerId) || "200");
  localStorage.setItem("svh_balance_" + playerId, String(svhBalance));

  let currentRoomId = null;
  let pollTimer = null;

  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), 2400);
  }

  function renderUserBar() {
    document.getElementById("user-label").textContent = "👤 " + playerName;
    document.getElementById("svh-balance").textContent = svhBalance;
    localStorage.setItem("svh_balance_" + playerId, String(svhBalance));
  }

  function setSvh(newAmount) {
    svhBalance = Math.max(0, newAmount);
    renderUserBar();
  }

  function showLobby() {
    clearInterval(pollTimer);
    currentRoomId = null;
    document.getElementById("lobby-menu").classList.remove("hidden");
    document.getElementById("waiting-room").classList.add("hidden");
  }

  function showWaitingRoom(roomId) {
    currentRoomId = roomId;
    document.getElementById("lobby-menu").classList.add("hidden");
    document.getElementById("waiting-room").classList.remove("hidden");
    syncRoom();
    clearInterval(pollTimer);
    pollTimer = setInterval(syncRoom, 1500);
  }

  function hasDb() {
    return DATABASE_URL && !DATABASE_URL.includes("YOUR-PROJECT");
  }

  async function dbRequest(path, method, body) {
    if (!hasDb()) {
      const key = "local_db_" + path;
      if (method === "DELETE") {
        localStorage.removeItem(key);
        return null;
      }
      if (method === "PUT") {
        localStorage.setItem(key, JSON.stringify(body));
        return body;
      }
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    const opts = { method: method || "GET", headers: { "Content-Type": "application/json" } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${DATABASE_URL}/${path}.json`, opts);
    return await res.json();
  }

  async function createRoom(maxPlayers) {
    const entryFee = maxPlayers === 6 ? 30 : 20;
    if (svhBalance < entryFee) {
      showToast(`موجودی SVH کافی نیست! (${entryFee} SVH لازم است)`);
      document.getElementById("shop-box").classList.remove("hidden");
      return;
    }
    setSvh(svhBalance - entryFee);

    const roomId = "db" + maxPlayers + "_" + Math.random().toString(36).slice(2, 7);
    const payload = {
      maxPlayers,
      entryFee,
      status: "waiting",
      createdAt: Date.now(),
      players: {
        [playerId]: { name: playerName, joinedAt: Date.now() }
      }
    };
    await dbRequest(`daberna_rooms/${roomId}`, "PUT", payload);
    showToast(`میز ${maxPlayers} نفره ساخته شد (${entryFee} SVH)`);
    showWaitingRoom(roomId);
  }

  async function joinRoom(roomId) {
    const room = await dbRequest(`daberna_rooms/${roomId}`, "GET");
    if (!room) {
      showToast("میز پیدا نشد یا بسته شده است.");
      showLobby();
      return;
    }
    const players = room.players || {};
    const count = Object.keys(players).length;
    if (!players[playerId] && count >= room.maxPlayers) {
      showToast("ظرفیت این میز تکمیل است.");
      showLobby();
      return;
    }
    const fee = room.entryFee || 20;
    if (!players[playerId]) {
      if (svhBalance < fee) {
        showToast(`برای ورود به این میز ${fee} SVH نیاز دارید.`);
        return;
      }
      setSvh(svhBalance - fee);
      await dbRequest(`daberna_rooms/${roomId}/players/${playerId}`, "PUT", {
        name: playerName,
        joinedAt: Date.now()
      });
    }
    showWaitingRoom(roomId);
  }

  async function syncRoom() {
    if (!currentRoomId) return;
    const room = await dbRequest(`daberna_rooms/${currentRoomId}`, "GET");
    if (!room) {
      showLobby();
      return;
    }
    const maxPlayers = room.maxPlayers || 4;
    const playersObj = room.players || {};
    const playersArr = Object.entries(playersObj).map(([id, info]) => ({ id, ...info }));
    const joined = playersArr.length;
    const needed = Math.max(0, maxPlayers - joined);

    document.getElementById("room-title").textContent = `میز دبرنا (${maxPlayers} نفره)`;
    document.getElementById("joined-count").textContent = joined;
    document.getElementById("max-count").textContent = maxPlayers;

    const remainingEl = document.getElementById("remaining-text");
    if (needed > 0) {
      remainingEl.textContent = `${needed} نفر دیگر باید اضافه شوند تا بازی شروع شود`;
    } else {
      remainingEl.textContent = "ظرفیت تکمیل شد! بازی دبرنا آماده شروع است";
      if (room.status !== "playing") {
        await dbRequest(`daberna_rooms/${currentRoomId}/status`, "PUT", "playing");
      }
    }

    document.getElementById("players-ul").innerHTML = playersArr
      .map((p, i) => `<li><span>${i + 1}. ${p.name}</span><span class="badge">متصل</span></li>`)
      .join("");
  }

  function shareRoomLink() {
    if (!currentRoomId) return;
    const webLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    const botLink = `https://t.me/${BOT_USERNAME}?startapp=${currentRoomId}`;
    const text = `بیا میز دبرنا SVH!\nورود مستقیم در ربات: ${botLink}\nلینک وب: ${webLink}`;

    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(text)}`);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(botLink);
      showToast("لینک دعوت کپی شد!");
    }
  }

  async function leaveRoom() {
    if (!currentRoomId) return;
    await dbRequest(`daberna_rooms/${currentRoomId}/players/${playerId}`, "DELETE");
    showToast("از میز خارج شدید.");
    showLobby();
  }

  function bindEvents() {
    document.getElementById("btn-create-4").addEventListener("click", () => createRoom(4));
    document.getElementById("btn-create-6").addEventListener("click", () => createRoom(6));
    document.getElementById("btn-share").addEventListener("click", shareRoomLink);
    document.getElementById("btn-leave").addEventListener("click", leaveRoom);
    document.getElementById("btn-toggle-shop").addEventListener("click", () => {
      document.getElementById("shop-box").classList.toggle("hidden");
    });

    document.querySelectorAll(".pack").forEach((el) => {
      el.addEventListener("click", () => {
        const addSvh = Number(el.getAttribute("data-svh") || "0");
        const stars = Number(el.getAttribute("data-stars") || "0");
        if (tg && typeof tg.sendData === "function") {
          tg.sendData(JSON.stringify({ action: "buy_svh", svh: addSvh, stars }));
        }
        setSvh(svhBalance + addSvh);
        showToast(`+${addSvh} کوین SVH به موجودی شما اضافه شد`);
      });
    });
  }

  renderUserBar();
  bindEvents();
  if (startParam) {
    joinRoom(startParam);
  }
})();
