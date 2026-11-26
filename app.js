(function () {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
  }

  const tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
  const state = {
    name: (tgUser && tgUser.first_name) || "SavasH",
    username: (tgUser && tgUser.username) ? "@" + tgUser.username : "@bigsavash",
    avatar: "🦁",
    svh: 200,
    games: 0,
    wins: 0,
    losses: 0,
    mode: "solo",
    playerColor: "#ef4444",
    botColor: "#facc15",
    difficulty: "medium",
    totalRounds: 3,
    currentRound: 1,
    p1Score: 0,
    p2Score: 0,
    board: [],
    turn: 1,
    roundOver: false
  };

  const ROWS = 6;
  const COLS = 7;

  function showView(viewId) {
    ["view-lobby", "view-c4-modes", "view-c4-setup", "view-dice", "view-c4-game", "view-profile"].forEach((id) => {
      document.getElementById(id).classList.toggle("hidden", id !== viewId);
    });
  }

  function refreshUI() {
    document.getElementById("top-avatar").textContent = state.avatar;
    document.getElementById("top-name").textContent = state.name;
    document.getElementById("top-svh").textContent = String(state.svh);
    document.getElementById("prof-avatar-big").textContent = state.avatar;
    document.getElementById("prof-name-big").textContent = state.name;
    document.getElementById("prof-handle").textContent = state.username;
    document.getElementById("stat-games").textContent = String(state.games);
    document.getElementById("stat-wins").textContent = String(state.wins);
    document.getElementById("stat-losses").textContent = String(state.losses);
  }

  // تغییر تم
  document.getElementById("btn-theme").onclick = () => {
    document.body.classList.toggle("light");
  };

  // ناوبری پایین
  document.getElementById("nav-games").onclick = () => {
    document.getElementById("nav-games").classList.add("active");
    document.getElementById("nav-profile").classList.remove("active");
    showView("view-lobby");
  };
  document.getElementById("nav-profile").onclick = () => {
    document.getElementById("nav-profile").classList.add("active");
    document.getElementById("nav-games").classList.remove("active");
    document.getElementById("prof-name-input").value = state.name;
    showView("view-profile");
  };

  // تب‌های لابی
  document.getElementById("tab-board").onclick = () => {
    document.getElementById("tab-board").classList.add("active");
    document.getElementById("tab-card").classList.remove("active");
    document.getElementById("board-list").classList.remove("hidden");
    document.getElementById("card-list").classList.add("hidden");
  };
  document.getElementById("tab-card").onclick = () => {
    document.getElementById("tab-card").classList.add("active");
    document.getElementById("tab-board").classList.remove("active");
    document.getElementById("card-list").classList.remove("hidden");
    document.getElementById("board-list").classList.add("hidden");
  };

  // انتخاب بازی دوز چهارتایی
  document.getElementById("open-connect4").onclick = () => showView("view-c4-modes");
  document.getElementById("btn-back-lobby").onclick = () => showView("view-lobby");
  document.getElementById("btn-back-modes").onclick = () => showView("view-c4-modes");

  function openSetup(mode) {
    state.mode = mode;
    document.getElementById("difficulty-wrap").classList.toggle("hidden", mode !== "solo");
    document.getElementById("friend-id-wrap").classList.toggle("hidden", mode !== "friends");
    showView("view-c4-setup");
  }

  document.getElementById("pick-solo").onclick = () => openSetup("solo");
  document.getElementById("pick-public").onclick = () => openSetup("public");
  document.getElementById("pick-friends").onclick = () => openSetup("friends");

  // انتخاب رنگ مهره
  document.querySelectorAll(".color-opt").forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll(".color-opt").forEach((x) => x.classList.remove("selected"));
      el.classList.add("selected");
      state.playerColor = el.getAttribute("data-color");
      state.botColor = state.playerColor === "#facc15" ? "#ef4444" : "#facc15";
    };
  });

  // انتخاب سطح سختی
  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".diff-btn").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      state.difficulty = btn.getAttribute("data-diff");
    };
  });

  // انتخاب تعداد دست
  document.querySelectorAll(".round-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".round-btn").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      state.totalRounds = Number(btn.getAttribute("data-rounds"));
    };
  });

  // رفتن به تاس شروع
  document.getElementById("btn-start-c4").onclick = () => {
    if (state.mode === "friends") {
      const target = (document.getElementById("friend-id-input").value || "").trim();
      if (target && tg && typeof tg.sendData === "function") {
        try {
          tg.sendData(JSON.stringify({ action: "invite_by_id", roomId: "c4_match", target }));
        } catch (e) {}
      }
    }
    state.currentRound = 1;
    state.p1Score = 0;
    state.p2Score = 0;
    document.getElementById("dice-cube").textContent = "?";
    document.getElementById("dice-result").textContent = "";
    document.getElementById("btn-roll-dice").disabled = false;
    showView("view-dice");
  };

  // پرتاب تاس نوبت
  document.getElementById("btn-roll-dice").onclick = () => {
    const btn = document.getElementById("btn-roll-dice");
    btn.disabled = true;
    const myRoll = Math.floor(Math.random() * 6) + 1;
    const oppRoll = Math.floor(Math.random() * 6) + 1;
    document.getElementById("dice-cube").textContent = String(myRoll);
    const iStart = myRoll >= oppRoll;
    document.getElementById("dice-result").textContent = iStart
      ? `تاس شما: ${myRoll} | حریف: ${oppRoll} — شما شروع می‌کنید!`
      : `تاس شما: ${myRoll} | حریف: ${oppRoll} — حریف شروع می‌کند!`;

    setTimeout(() => {
      startRound(iStart ? 1 : 2);
    }, 1000);
  };

  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function startRound(starter) {
    state.board = createEmptyBoard();
    state.turn = starter;
    state.roundOver = false;
    document.getElementById("hud-p1").textContent = state.name;
    document.getElementById("hud-p2").textContent = state.mode === "solo" ? "ربات" : "حریف";
    document.getElementById("score-p1").textContent = String(state.p1Score);
    document.getElementById("score-p2").textContent = String(state.p2Score);
    document.getElementById("hud-round").textContent = String(state.currentRound);
    document.getElementById("hud-total-rounds").textContent = String(state.totalRounds);
    showView("view-c4-game");
    renderBoard([]);
    updateTurnText();
    if (state.turn === 2) {
      setTimeout(botPlay, 450);
    }
  }

  function updateTurnText() {
    const el = document.getElementById("turn-banner");
    if (state.roundOver) return;
    el.textContent = state.turn === 1
      ? "نوبت شماست — یک ستون را انتخاب کن"
      : "حریف در حال فکر کردن است...";
  }

  function renderBoard(winCoords) {
    const winSet = new Set(winCoords.map(([r, c]) => `${r},${c}`));
    const boardEl = document.getElementById("c4-board");
    boardEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const slot = document.createElement("div");
        slot.className = "c4-slot" + (winSet.has(`${r},${c}`) ? " win" : "");
        const val = state.board[r][c];
        if (val === 1) slot.style.background = state.playerColor;
        if (val === 2) slot.style.background = state.botColor;
        slot.onclick = () => handleColumnClick(c);
        boardEl.appendChild(slot);
      }
    }
  }

  function dropInColumn(board, col, who) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        board[r][col] = who;
        return r;
      }
    }
    return -1;
  }

  function findWin(board, who) {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== who) continue;
        for (const [dr, dc] of dirs) {
          const line = [[r, c]];
          for (let k = 1; k < 4; k++) {
            const nr = r + dr * k;
            const nc = c + dc * k;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === who) {
              line.push([nr, nc]);
            }
          }
          if (line.length === 4) return line;
        }
      }
    }
    return null;
  }

  function handleColumnClick(col) {
    if (state.roundOver || state.turn !== 1) return;
    const row = dropInColumn(state.board, col, 1);
    if (row === -1) return;

    const winLine = findWin(state.board, 1);
    renderBoard(winLine || []);
    if (winLine) {
      endRound(1);
      return;
    }
    if (state.board[0].every((x) => x !== 0)) {
      endRound(0);
      return;
    }
    state.turn = 2;
    updateTurnText();
    setTimeout(botPlay, 400);
  }

  function botPlay() {
    if (state.roundOver || state.turn !== 2) return;
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (state.board[0][c] === 0) validCols.push(c);
    }
    if (!validCols.length) return;

    let chosen = validCols[Math.floor(Math.random() * validCols.length)];
    if (state.difficulty !== "easy") {
      // اول بررسی برد فوری ربات
      for (const c of validCols) {
        const copy = state.board.map((row) => [...row]);
        dropInColumn(copy, c, 2);
        if (findWin(copy, 2)) { chosen = c; break; }
      }
      // بعد جلوگیری از برد حریف
      if (state.difficulty === "hard") {
        for (const c of validCols) {
          const copy = state.board.map((row) => [...row]);
          dropInColumn(copy, c, 1);
          if (findWin(copy, 1)) { chosen = c; break; }
        }
      }
    }

    dropInColumn(state.board, chosen, 2);
    const winLine = findWin(state.board, 2);
    renderBoard(winLine || []);
    if (winLine) {
      endRound(2);
      return;
    }
    if (state.board[0].every((x) => x !== 0)) {
      endRound(0);
      return;
    }
    state.turn = 1;
    updateTurnText();
  }

  function endRound(winner) {
    state.roundOver = true;
    const banner = document.getElementById("turn-banner");
    if (winner === 1) {
      state.p1Score += 1;
      banner.textContent = "🎉 این دست را بردی!";
    } else if (winner === 2) {
      state.p2Score += 1;
      banner.textContent = "حریف این دست را برد!";
    } else {
      banner.textContent = "این دست مساوی شد!";
    }
    document.getElementById("score-p1").textContent = String(state.p1Score);
    document.getElementById("score-p2").textContent = String(state.p2Score);

    const neededWins = Math.ceil(state.totalRounds / 2);
    if (state.p1Score >= neededWins || state.p2Score >= neededWins || state.currentRound >= state.totalRounds) {
      state.games += 1;
      if (state.p1Score > state.p2Score) {
        state.wins += 1;
        state.svh += 25;
        banner.textContent = "🏆 برنده کل بازی شدی! +۲۵ SVH";
      } else if (state.p2Score > state.p1Score) {
        state.losses += 1;
        banner.textContent = "پایان بازی — حریف برنده شد";
      } else {
        state.svh += 10;
        banner.textContent = "پایان بازی با تساوی! +۱۰ SVH";
      }
      refreshUI();
      setTimeout(() => showView("view-c4-modes"), 1800);
    } else {
      state.currentRound += 1;
      setTimeout(() => startRound(winner === 1 ? 2 : 1), 1300);
    }
  }

  document.getElementById("btn-exit-match").onclick = () => showView("view-c4-modes");

  // پروفایل و آواتار
  document.querySelectorAll(".avatar-item").forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll(".avatar-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      state.avatar = el.getAttribute("data-av");
    };
  });

  document.getElementById("btn-save-profile").onclick = () => {
    const newName = (document.getElementById("prof-name-input").value || "").trim();
    if (newName) state.name = newName;
    refreshUI();
    showView("view-lobby");
    document.getElementById("nav-games").classList.add("active");
    document.getElementById("nav-profile").classList.remove("active");
  };

  refreshUI();
})();
