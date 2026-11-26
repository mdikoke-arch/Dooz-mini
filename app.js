(function () {
  function safeCall(fn) {
    try {
      return fn();
    } catch (err) {
      return null;
    }
  }

  function $(id) {
    return document.getElementById(id);
  }

  const tg = safeCall(() => (window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null));
  if (tg) {
    safeCall(() => tg.ready());
    safeCall(() => tg.expand());
  }

  const tgUser = safeCall(() => (tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null));

  const state = {
    name: (tgUser && tgUser.first_name) ? String(tgUser.first_name) : "SavasH",
    username: (tgUser && tgUser.username) ? "@" + String(tgUser.username) : "@bigsavash",
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
    roundOver: false,
    botTimer: null
  };

  const ROWS = 6;
  const COLS = 7;
  const ALL_VIEWS = [
    "view-lobby",
    "view-c4-modes",
    "view-c4-setup",
    "view-dice",
    "view-c4-game",
    "view-profile"
  ];

  function clearBotTimer() {
    if (state.botTimer) {
      clearTimeout(state.botTimer);
      state.botTimer = null;
    }
  }

  function setText(id, val) {
    const el = $(id);
    if (el) el.textContent = String(val);
  }

  function showView(viewId) {
    if (viewId !== "view-c4-game") {
      clearBotTimer();
    }
    ALL_VIEWS.forEach((id) => {
      const el = $(id);
      if (!el) return;
      if (id === viewId) {
        el.classList.remove("hidden");
        el.style.display = "block";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });
  }

  function setNavActive(activeId) {
    ["nav-games", "nav-profile"].forEach((id) => {
      const btn = $(id);
      if (!btn) return;
      if (id === activeId) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  function refreshUI() {
    safeCall(() => {
      setText("top-avatar", state.avatar);
      setText("top-name", state.name);
      setText("top-svh", state.svh);
      setText("prof-avatar-big", state.avatar);
      setText("prof-name-big", state.name);
      setText("prof-handle", state.username);
      setText("stat-games", state.games);
      setText("stat-wins", state.wins);
      setText("stat-losses", state.losses);
    });
  }

  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
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
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];
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

  function updateTurnText() {
    if (state.roundOver) return;
    setText(
      "turn-banner",
      state.turn === 1
        ? "نوبت شماست — روی یکی از ستون‌ها بزن"
        : "حریف در حال حرکت است..."
    );
  }

  function renderBoard(winCoords) {
    const boardEl = $("c4-board");
    if (!boardEl) return;
    const winSet = new Set((winCoords || []).map(([r, c]) => r + "," + c));
    boardEl.innerHTML = "";

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = "c4-slot" + (winSet.has(r + "," + c) ? " win" : "");
        const val = state.board[r][c];
        if (val === 1) slot.style.background = state.playerColor;
        else if (val === 2) slot.style.background = state.botColor;
        else slot.style.background = "#0b1120";
        slot.onclick = () => handleColumnClick(c);
        boardEl.appendChild(slot);
      }
    }
  }

  function startRound(starter) {
    clearBotTimer();
    state.board = createEmptyBoard();
    state.turn = starter === 2 ? 2 : 1;
    state.roundOver = false;

    setText("hud-p1", state.name);
    setText("hud-p2", state.mode === "solo" ? "ربات" : "حریف");
    setText("score-p1", state.p1Score);
    setText("score-p2", state.p2Score);
    setText("hud-round", state.currentRound);
    setText("hud-total-rounds", state.totalRounds);

    showView("view-c4-game");
    renderBoard([]);
    updateTurnText();

    if (state.turn === 2) {
      state.botTimer = setTimeout(botPlay, 450);
    }
  }

  function endRound(winner) {
    clearBotTimer();
    state.roundOver = true;

    if (winner === 1) {
      state.p1Score += 1;
      setText("turn-banner", "🎉 این دست را بردی!");
    } else if (winner === 2) {
      state.p2Score += 1;
      setText("turn-banner", "حریف این دست را برد!");
    } else {
      setText("turn-banner", "این دست مساوی شد!");
    }

    setText("score-p1", state.p1Score);
    setText("score-p2", state.p2Score);

    const neededWins = Math.ceil(state.totalRounds / 2);
    const matchFinished =
      state.p1Score >= neededWins ||
      state.p2Score >= neededWins ||
      state.currentRound >= state.totalRounds;

    if (matchFinished) {
      state.games += 1;
      if (state.p1Score > state.p2Score) {
        state.wins += 1;
        state.svh += 25;
        setText("turn-banner", "🏆 برنده کل بازی شدی! +۲۵ SVH");
      } else if (state.p2Score > state.p1Score) {
        state.losses += 1;
        setText("turn-banner", "پایان بازی — حریف برنده شد");
      } else {
        state.svh += 10;
        setText("turn-banner", "پایان بازی با تساوی! +۱۰ SVH");
      }
      refreshUI();
      setTimeout(() => showView("view-c4-modes"), 1700);
    } else {
      state.currentRound += 1;
      setTimeout(() => startRound(winner === 1 ? 2 : 1), 1200);
    }
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
      for (const c of validCols) {
        const copy = state.board.map((row) => row.slice());
        dropInColumn(copy, c, 2);
        if (findWin(copy, 2)) {
          chosen = c;
          break;
        }
      }
      if (state.difficulty === "hard") {
        for (const c of validCols) {
          const copy = state.board.map((row) => row.slice());
          dropInColumn(copy, c, 1);
          if (findWin(copy, 1)) {
            chosen = c;
            break;
          }
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
    state.botTimer = setTimeout(botPlay, 400);
  }

  function openSetup(mode) {
    state.mode = mode;
    const diffWrap = $("difficulty-wrap");
    const friendWrap = $("friend-id-wrap");
    if (diffWrap) diffWrap.style.display = mode === "solo" ? "block" : "none";
    if (friendWrap) friendWrap.style.display = mode === "friends" ? "block" : "none";
    showView("view-c4-setup");
  }

  function bindAllEvents() {
    safeCall(() => {
      const themeBtn = $("btn-theme");
      if (themeBtn) {
        themeBtn.onclick = () => document.body.classList.toggle("light");
      }

      const navGames = $("nav-games");
      if (navGames) {
        navGames.onclick = () => {
          setNavActive("nav-games");
          showView("view-lobby");
        };
      }

      const navProfile = $("nav-profile");
      if (navProfile) {
        navProfile.onclick = () => {
          setNavActive("nav-profile");
          const inp = $("prof-name-input");
          if (inp) inp.value = state.name;
          showView("view-profile");
        };
      }

      const tabBoard = $("tab-board");
      const tabCard = $("tab-card");
      const boardList = $("board-list");
      const cardList = $("card-list");
      if (tabBoard && tabCard && boardList && cardList) {
        tabBoard.onclick = () => {
          tabBoard.classList.add("active");
          tabCard.classList.remove("active");
          boardList.style.display = "grid";
          cardList.style.display = "none";
        };
        tabCard.onclick = () => {
          tabCard.classList.add("active");
          tabBoard.classList.remove("active");
          cardList.style.display = "grid";
          boardList.style.display = "none";
        };
      }

      if ($("open-connect4")) $("open-connect4").onclick = () => showView("view-c4-modes");
      if ($("btn-back-lobby")) $("btn-back-lobby").onclick = () => showView("view-lobby");
      if ($("btn-back-modes")) $("btn-back-modes").onclick = () => showView("view-c4-modes");
      if ($("pick-solo")) $("pick-solo").onclick = () => openSetup("solo");
      if ($("pick-public")) $("pick-public").onclick = () => openSetup("public");
      if ($("pick-friends")) $("pick-friends").onclick = () => openSetup("friends");

      document.querySelectorAll(".color-opt").forEach((el) => {
        el.onclick = () => {
          document.querySelectorAll(".color-opt").forEach((x) => x.classList.remove("selected"));
          el.classList.add("selected");
          const c = el.getAttribute("data-color") || "#ef4444";
          state.playerColor = c;
          state.botColor = c === "#facc15" ? "#ef4444" : "#facc15";
        };
      });

      document.querySelectorAll(".diff-btn").forEach((btn) => {
        btn.onclick = () => {
          document.querySelectorAll(".diff-btn").forEach((x) => x.classList.remove("active"));
          btn.classList.add("active");
          state.difficulty = btn.getAttribute("data-diff") || "medium";
        };
      });

      document.querySelectorAll(".round-btn").forEach((btn) => {
        btn.onclick = () => {
          document.querySelectorAll(".round-btn").forEach((x) => x.classList.remove("active"));
          btn.classList.add("active");
          state.totalRounds = Number(btn.getAttribute("data-rounds") || "3");
        };
      });

      const startBtn = $("btn-start-c4");
      if (startBtn) {
        startBtn.onclick = () => {
          if (state.mode === "friends") {
            const fInp = $("friend-id-input");
            const target = fInp ? String(fInp.value || "").trim() : "";
            if (target && tg && typeof tg.sendData === "function") {
              safeCall(() =>
                tg.sendData(JSON.stringify({ action: "invite_by_id", roomId: "c4_match", target }))
              );
            }
          }
          state.currentRound = 1;
          state.p1Score = 0;
          state.p2Score = 0;
          setText("dice-cube", "?");
          setText("dice-result", "");
          const rollBtn = $("btn-roll-dice");
          if (rollBtn) rollBtn.disabled = false;
          showView("view-dice");
        };
      }

      const rollBtn = $("btn-roll-dice");
      if (rollBtn) {
        rollBtn.onclick = () => {
          rollBtn.disabled = true;
          const myRoll = Math.floor(Math.random() * 6) + 1;
          const oppRoll = Math.floor(Math.random() * 6) + 1;
          setText("dice-cube", myRoll);
          const iStart = myRoll >= oppRoll;
          setText(
            "dice-result",
            iStart
              ? `تاس شما: ${myRoll} | حریف: ${oppRoll} — شما شروع می‌کنید!`
              : `تاس شما: ${myRoll} | حریف: ${oppRoll} — حریف شروع می‌کند!`
          );
          setTimeout(() => startRound(iStart ? 1 : 2), 950);
        };
      }

      if ($("btn-exit-match")) {
        $("btn-exit-match").onclick = () => showView("view-c4-modes");
      }

      document.querySelectorAll(".avatar-item").forEach((el) => {
        el.onclick = () => {
          document.querySelectorAll(".avatar-item").forEach((x) => x.classList.remove("active"));
          el.classList.add("active");
          state.avatar = el.getAttribute("data-av") || "🦁";
        };
      });

      const saveProfBtn = $("btn-save-profile");
      if (saveProfBtn) {
        saveProfBtn.onclick = () => {
          const inp = $("prof-name-input");
          const val = inp ? String(inp.value || "").trim() : "";
          if (val) state.name = val;
          refreshUI();
          setNavActive("nav-games");
          showView("view-lobby");
        };
      }
    });
  }

  function init() {
    refreshUI();
    bindAllEvents();
    showView("view-lobby");
    setNavActive("nav-games");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
