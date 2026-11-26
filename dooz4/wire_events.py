from pathlib import Path

p = Path.home() / "Dooz-mini" / "dooz4" / "dooz4.html"
src = p.read_text(encoding="utf-8")

src = src.replace(
    "render(winLine);\n            return;",
    "render(winLine);\n            pushRoomState(winLine);\n            return;",
    1
)

src = src.replace(
    "turn = mySymbol === 1 ? 2 : 1;\n          document.getElementById(\"statusBox\").textContent = `نوبت بازیکن ${turn}`;",
    "turn = mySymbol === 1 ? 2 : 1;\n          document.getElementById(\"statusBox\").textContent = \"در انتظار حرکت حریف...\";",
    1
)

src = src.replace(
    "render();\n          return;",
    "render();\n          pushRoomState([]);\n          return;",
    1
)

src = src.replace(
    "resetLocalBoard();\n  </script>",
    "resetLocalBoard();\n    pullRoomState();\n    setInterval(pullRoomState, 800);\n  </script>",
    1
)

p.write_text(src, encoding="utf-8")
print("Wired dropPiece and polling loop in dooz4.html")
