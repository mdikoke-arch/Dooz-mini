from pathlib import Path

base = Path.home() / "Dooz-mini"
candidates = [base / "index.html", base / "dooz.html"]
target = next((f for f in candidates if f.exists()), None)

if not target:
    print("No index.html or dooz.html found in ~/Dooz-mini")
    raise SystemExit(1)

src = target.read_text(encoding="utf-8", errors="ignore")

if "دوز چهار تایی" not in src:
    # اگر بلوک انتخاب بازی دوز وجود داشت، کارت دوز چهار تایی را بلافاصله بعد از آن اضافه می‌کنیم
    anchor = "برای انتخاب شرط و دعوت دوست کلیک کن"
    idx = src.find(anchor)
    if idx != -1:
        end_card = src.find("</div>", idx)
        if end_card != -1:
            extra_card = """
<div onclick="selectGameMode('dooz4')" style="margin-top:10px;padding:12px;border-radius:14px;background:rgba(99,102,241,0.14);border:1px solid rgba(129,140,248,0.45);cursor:pointer;">
  <div style="font-weight:bold;font-size:16px;">4×4 / دوز چهار تایی</div>
  <div style="font-size:12px;opacity:0.85;margin-top:4px;">اتصال ۴ مهره در یک ردیف • شرط‌بندی با دوست</div>
</div>"""
            src = src[: end_card + 6] + extra_card + src[end_card + 6 :]

    helper_js = """
<script>
window.selectedGameMode = window.selectedGameMode || 'dooz';
window.selectGameMode = function(mode) {
  window.selectedGameMode = mode;
  const statusEl = document.querySelector('[style*="بازی دوز انتخاب شد"]') || document.getElementById('statusText');
  if (statusEl) {
    statusEl.textContent = mode === 'dooz4'
      ? 'بازی دوز چهار تایی انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.'
      : 'بازی دوز انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.';
  }
};
</script>
"""
    src = src.replace("</body>", helper_js + "\n</body>")
    target.write_text(src, encoding="utf-8")
    print("Added Dooz 4 UI card to:", target)
else:
    print("Dooz 4 option already exists in:", target)
