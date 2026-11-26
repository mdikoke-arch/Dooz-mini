(function () {
  const FIREBASE_DB_URL = "https://YOUR-PROJECT-ID.europe-west1.firebasedatabase.app";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;

  const myId = tgUser && tgUser.id ? String(tgUser.id) : "guest_local";
  const myUsername = (tgUser && tgUser.username ? tgUser.username : "bigsavash")
    .toLowerCase()
    .replace(/^@+/, "");

  function cleanHandle(val) {
    return String(val || "").trim().toLowerCase().replace(/^@+/, "");
  }

  async function dbRequest(path, method = "GET", body = null) {
    const url = `${FIREBASE_DB_URL}/${path}.json`;
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body !== null) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error("Firebase request failed");
    return await res.json();
  }

  async function sendFriendRequest(rawTarget) {
    const target = cleanHandle(rawTarget);
    const msgEl = document.getElementById("friend-msg");
    if (!target) return;
    if (target === myUsername) {
      if (msgEl) msgEl.textContent = "نمی‌تونی به خودت درخواست بدی";
      return;
    }

    const payload = {
      fromId: myId,
      fromUsername: "@" + myUsername,
      to: target,
      status: "pending",
      createdAt: Date.now()
    };

    try {
      await dbRequest(`friend_requests/incoming/${target}/${myId}`, "PUT", payload);
      await dbRequest(`friend_requests/sent/${myId}/${target}`, "PUT", payload);
      if (msgEl) msgEl.textContent = `درخواست برای @${target} ارسال شد`;
      await loadRequests();
    } catch (e) {
      if (msgEl) msgEl.textContent = "خطا در ارسال درخواست؛ آدرس دیتابیس را چک کن";
    }
  }

  async function loadRequests() {
    const incomingBox = document.getElementById("incoming-req-list");
    const sentBox = document.getElementById("sent-req-list");

    try {
      const incomingData = await dbRequest(`friend_requests/incoming/${myUsername}`);
      const sentData = await dbRequest(`friend_requests/sent/${myId}`);

      if (incomingBox) {
        const items = incomingData ? Object.values(incomingData) : [];
        if (!items.length) {
          incomingBox.innerHTML = "درخواست دوستی جدیدی ندارید";
        } else {
          incomingBox.innerHTML = "";
          items.forEach((req) => {
            const row = document.createElement("div");
            row.className = "friend-row";
            row.innerHTML = `<span>${req.fromUsername || req.fromId}</span>`;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "mini-btn";
            btn.textContent = "قبول";
            btn.onclick = async () => {
              await dbRequest(`friends/${myId}/${req.fromId}`, "PUT", {
                username: req.fromUsername || req.fromId,
                since: Date.now()
              });
              await dbRequest(`friend_requests/incoming/${myUsername}/${req.fromId}`, "DELETE");
              await loadRequests();
            };
            row.appendChild(btn);
            incomingBox.appendChild(row);
          });
        }
      }

      if (sentBox) {
        const sItems = sentData ? Object.values(sentData) : [];
        if (!sItems.length) {
          sentBox.innerHTML = "درخواست ارسالی ندارید";
        } else {
          sentBox.innerHTML = "";
          sItems.forEach((req) => {
            const row = document.createElement("div");
            row.className = "friend-row";
            row.innerHTML = `<span>@${req.to}</span><span>در انتظار</span>`;
            sentBox.appendChild(row);
          });
        }
      }
    } catch (e) {
      if (incomingBox) incomingBox.innerHTML = "امکان دریافت درخواست‌ها نیست";
    }
  }

  const sendBtn = document.getElementById("btn-send-req");
  const inputEl = document.getElementById("friend-search-input");
  if (sendBtn && inputEl) {
    sendBtn.onclick = () => {
      const v = inputEl.value;
      inputEl.value = "";
      sendFriendRequest(v);
    };
  }

  const reqTab = document.getElementById("ftab-req");
  if (reqTab) {
    reqTab.addEventListener("click", loadRequests);
  }

  loadRequests();
})();
