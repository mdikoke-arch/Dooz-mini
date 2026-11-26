(function () {
  const DATABASE_URL = "https://YOUR-PROJECT-default-rtdb.europe-west1.firebasedatabase.app";
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
  }

  const tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
  const playerId = String((tgUser && tgUser.id) || "8359766039");
  const playerUsername = (tgUser && tgUser.username ? tgUser.username.toLowerCase() : "");
  const playerName = (tgUser && tgUser.first_name) || "Savash";

  const memStore = {};
  function readStore(k, fallback) {
    try {
      const v = window.localStorage.getItem(k);
      if (v !== null) return v;
    } catch (e) {}
    return memStore[k] !== undefined ? memStore[k] : fallback;
  }
  function writeStore(k, val) {
    const s = String(val);
    memStore[k] = s;
    try { window.localStorage.setItem(k, s); } catch (e) {}
  }

  let svhBalance = Number(readStore("svh_balance_" + playerId, "160"));
  writeStore("svh_balance_" + playerId, svhBalance);

  let currentRoomId = null;
  let pollTimer = null;

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), 2500);
  }

  function renderUserBar() {
    const uEl = document.getElementById("user-label");
    const bEl = document.getElementById("svh-balance");
    if (uEl) uEl.textContent = `${playerName} (${playerId})`;
    if (bEl) bEl.textContent = String(svhBalance);
    writeStore("svh_balance_" + playerId, svhBalance);
  }

  function setSvh(newAmount) {
    svhBalance = Math.max(0, Number(newAmount) || 0);
    renderUserBar();
  }

  function hasDb() {
    return Boolean(DATABASE_URL && !DATABASE_URL.includes("YOUR-PROJECT") && DATABASE_URL.startsWith("https://"));
  }

  async function dbRequest(path, method, body) {
    const localKey = "db_" + path;
    if (!hasDb()) {
      if (method === "DELETE") {
        delete memStore[localKey];
        try { window.localStorage.removeItem(localKey); } catch (e) {}
        return null;
      }
      if (method === "PUT") {
        const raw = JSON.stringify(body);
        writeStore(localKey, raw);
        return body;
      }
      const raw = readStore(localKey, "");
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }

    try {
      const opts = { method: method || "GET", headers: { "Content-Type": "application/json" } };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const res = await fetch(`${DATABASE_URL}/${path}.json`, opts);
      return await res.json();
    } catch (err) {
      showToast("خطای اتصال به دیتابیس: " + (err && err.message ? err.message : "نامشخص"));
      return null;
    }
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

  function getEntryFee(maxPlayers) {
    if (maxPlayers === 6) return 30;
    if (maxPlayers === 4) return 20;
    return 10;
  }

  async function createRoom(maxPlayers) {
    const entryFee = getEntryFee(maxPlayers);
    if (svhBalance < entryFee) {
      showToast(`موجودی SVH کافی نیست (${entryFee} SVH لازم است)`);
      document.getElementById("shop-box").classList.remove("hidden");
      return;
    }

    const roomId = "db" + maxPlayers + "_" + Math.random().toString(36).slice(2, 6);
    setSvh(svhBalance - entryFee);
    showWaitingRoom(roomId);
    showToast(`میز ${maxPlayers} نفره (${roomId}) باز شد`);

    const payload = {
      maxPlayers,
      entryFee,
      hostId: playerId,
      status: "waiting",
      createdAt: Date.now(),
      invited: {},
      players: {
        [playerId]: { name: playerName, joinedAt: Date.now() }
      }
    };
    await dbRequest(`daberna_rooms/${roomId}`, "PUT", payload);
    syncRoom();
  }

  async function inviteByTelegramId() {
    if (!currentRoomId) return;
    const inp = document.getElementById("invite-target");
    const rawInput = (inp && inp.value ? inp.value : "").trim();
    if (!rawInput) {
      showToast("آیدی عددی یا @username را وارد کن");
      return;
    }
    const cleanTarget = rawInput.startsWith("@") ? rawInput.slice(1).toLowerCase() : rawInput;
    const safeKey = cleanTarget.replace(/[^a-zA-Z0-9_]/g, "_");
    if (!safeKey) {
      showToast("آیدی واردشده معتبر نیست");
      return;
    }

    await dbRequest(`daberna_rooms/${currentRoomId}/invited/${safeKey}`, "PUT", {
      target: cleanTarget,
      invitedBy: playerId,
      invitedAt: Date.now()
    });

    if (tg && typeof tg.sendData === "function") {
      try {
        tg.sendData(JSON.stringify({
          action: "invite_by_id",
          roomId: currentRoomId,
          target: cleanTarget
        }));
      } catch (e) {}
    }

    inp.value = "";
    showToast(`آیدی ${cleanTarget} دعوت شد`);
    syncRoom();
  }

  async function checkAutoInvitedRoom() {
    const allRooms = await dbRequest("daberna_rooms", "GET");
    if (!allRooms || typeof allRooms !== "object") return;

    for (const [roomId, room] of Object.entries(allRooms)) {
      if (!room || room.status !== "waiting") continue;
      const invited = room.invited || {};
      const players = room.players || {};
      if (players[playerId]) {
        showWaitingRoom(roomId);
        return;
      }
      const isInvited = Object.values(invited).some((item) => {
        if (!item || !item.target) return false;
        const t = String(item.target).toLowerCase();
        return t === String(playerId).toLowerCase() || (playerUsername && t === playerUsername);
      });
      if (isInvited && Object.keys(players).length < (room.maxPlayers || 2)) {
        const fee = room.entryFee || 10;
        if (svhBalance >= fee) {
          setSvh(svhBalance - fee);
          await dbRequest(`daberna_rooms/${roomId}/players/${playerId}`, "PUT", {
            name: playerName,
            joinedAt: Date.now()
          });
          showToast("وارد میز دعوت‌شده شدید!");
          showWaitingRoom(roomId);
          return;
        }
      }
    }
  }

  async function syncRoom() {
    if (!currentRoomId) return;
    const room = await dbRequest(`daberna_rooms/${currentRoomId}`, "GET");
    if (!room) {
      document.getElementById("room-title").textContent = `میز ${currentRoomId}`;
      document.getElementById("joined-count").textContent = "1";
      document.getElementById("max-count").textContent = currentRoomId.startsWith("db6") ? "6" : currentRoomId.startsWith("db4") ? "4" : "2";
      document.getElementById("remaining-text").textContent = "در انتظار ورود بازیکن بعدی با آیدی...";
      return;
    }
    const maxPlayers = room.maxPlayers || 2;
    const playersObj = room.players || {};
    const playersArr = Object.entries(playersObj).map(([id, info]) => ({ id, ...info }));
    const joined = Math.max(1, playersArr.length);
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

    const invitedArr = Object.values(room.invited || {}).map((x) => x.target).filter(Boolean);
    document.getElementById("invited-list").textContent = invitedArr.length
      ? "آیدی‌های دعوت‌شده: " + invitedArr.join(" ، ")
      : "هنوز آیدی‌ای دعوت نشده است.";

    document.getElementById("players-ul").innerHTML = (playersArr.length ? playersArr : [{ name: playerName }])
      .map((p, i) => `<li><span>${i + 1}. ${p.name}</span><span class="badge">متصل</span></li>`)
      .join("");
  }

  async function leaveRoom() {
    if (!currentRoomId) return;
    await dbRequest(`daberna_rooms/${currentRoomId}/players/${playerId}`, "DELETE");
    showToast("از میز خارج شدید");
    showLobby();
  }

  function bindEvents() {
    document.getElementById("btn-create-2").onclick = () => createRoom(2);
    document.getElementById("btn-create-4").onclick = () => createRoom(4);
    document.getElementById("btn-create-6").onclick = () => createRoom(6);
    document.getElementById("btn-invite-id").onclick = inviteByTelegramId;
    document.getElementById("btn-leave").onclick = leaveRoom;
    document.getElementById("btn-toggle-shop").onclick = () => {
      document.getElementById("shop-box").classList.toggle("hidden");
    };

    document.querySelectorAll(".pack").forEach((el) => {
      el.onclick = () => {
        const addSvh = Number(el.getAttribute("data-svh") || "0");
        const stars = Number(el.getAttribute("data-stars") || "0");
        if (tg && typeof tg.sendData === "function") {
          try { tg.sendData(JSON.stringify({ action: "buy_svh", svh: addSvh, stars })); } catch (e) {}
        }
        setSvh(svhBalance + addSvh);
        showToast(`+${addSvh} کوین SVH اضافه شد`);
      };
    });
  }

  renderUserBar();
  bindEvents();
  checkAutoInvitedRoom();
})();
