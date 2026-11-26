from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# تزریق gameMode در آبجکت‌هایی که به /bot_outbox یا دعوت‌ها فرستاده می‌شوند
if "selectedGameMode" in src and '"game"' not in src and "'game'" not in src:
    src = re.sub(
        r'(\bbet\s*:\s*[^,\n}]+)',
        r'\1, game: (window.selectedGameMode || "dooz"), game_name: (window.selectedGameMode || "dooz")',
        src,
        count=1,
    )

p.write_text(src, encoding="utf-8")
print("Checked/wired invite payload game mode in index.html")
