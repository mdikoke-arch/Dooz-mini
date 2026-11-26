from pathlib import Path

p = Path.home() / "Dooz-mini" / "dooz4" / "dooz4.html"
src = p.read_text(encoding="utf-8")

sync_script = """
  <script>
    const DB_BASE = "https://dooz-mini-default-rtdb.europe-west1.firebasedatabase.app";
    const roomRefUrl = `${DB_BASE}/rooms4/${encodeURIComponent(roomId)}.json`;
    let lastSyncTs = 0;

    async function pushRoomState(winCells = []) {
      if (!roomId || roomId === "local4") return;
      const payload = {
        grid,
        turn,
        gameOver,
        winCells,
        bet: Number(bet || 0),
        updatedAt: Date.now()
      };
      lastSyncTs = payload.updatedAt;
      try {
        await fetch(roomRefUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (_) {}
    }

    async function pullRoomState() {
      if (!roomId || roomId === "local4") return;
      try {
        const res = await fetch(roomRefUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !Array.isArray(data.grid)) return;
        if (data.updatedAt && data.updatedAt <= lastSyncTs) return;
        lastSyncTs = data.updatedAt || Date.now();
        grid = data.grid;
        turn = Number(data.turn || 1);
        gameOver = Boolean(data.gameOver);
        const wCells = Array.isArray(data.winCells) ? data.winCells : [];
        if (gameOver && wCells.length) {
          document.getElementById("statusBox").textContent = `اتمام بازی — برنده تایید شد!`;
        } else {
          document.getElementById("statusBox").textContent =
            turn === mySymbol ? "نوبت شماست! ستون را انتخاب کنید" : "در انتظار حرکت حریف...";
        }
        render(wCells);
      } catch (_) {}
    }
  </script>
"""

src = src.replace("</body>", sync_script + "\n</body>")
p.write_text(src, encoding="utf-8")
print("Appended Firebase sync helpers to dooz4.html")
