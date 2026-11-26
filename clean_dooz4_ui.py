from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# حذف اسکریپت‌های قبلی که ما اضافه کردیم تا تکراری نشوند
src = re.sub(r'\n?<script>\s*\(function\(\)\s*\{\s*window\.selectedGameMode[\s\S]*?</script>', '', src)
src = re.sub(r'\n?<script>\s*window\.selectedGameMode\s*=\s*window\.selectedGameMode[\s\S]*?</script>', '', src)

# حذف هر کارت یا باکس اضافه دوز چهارتایی
src = re.sub(r'\n?<div id="card-dooz4"[\s\S]*?</div>\s*</div>', '', src)
src = re.sub(r'\n?<div[^>]*data-mode="dooz4"[\s\S]*?</div>\s*</div>', '', src)

# پیدا کردن کارت اصلی دوز (با "OX" و "برای انتخاب شرط و دعوت دوست کلیک کن")
m = re.search(
    r'(<div[^>]*>(?:(?!<div[^>]*>).)*?OX[\s\S]*?برای انتخاب شرط و دعوت دوست کلیک کن[\s\S]*?</div>)',
    src
)

d4_card = """
<div id="card-dooz4" data-mode="dooz4" style="margin-top:12px;padding:16px 14px;border-radius:18px;background:rgba(24,20,48,0.85);border:1px solid rgba(255,77,90,0.4);cursor:pointer;text-align:center;">
  <div style="display:flex;justify-content:center;gap:6px;margin-bottom:8px;">
    <span style="width:14px;height:14px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.8);"></span>
    <span style="width:14px;height:14px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.8);"></span>
    <span style="width:14px;height:14px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.8);"></span>
    <span style="width:14px;height:14px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.8);"></span>
  </div>
  <div style="font-weight:900;font-size:18px;color:#ff4d5a;text-shadow:0 0 12px rgba(255,77,90,0.35);">دوز چهارتایی</div>
</div>"""

if m:
    src = src[: m.end()] + d4_card + src[m.end() :]
else:
    src = src.replace("</body>", d4_card + "\n</body>")

clean_js = """
<script>
(function() {
  window.selectedGameMode = window.selectedGameMode || 'dooz';
  document.addEventListener('click', function(e) {
    const card4 = e.target.closest('#card-dooz4');
    if (!card4) return;
    window.selectedGameMode = 'dooz4';
    card4.style.borderColor = '#ff4d5a';
    card4.style.boxShadow = '0 0 18px rgba(255,77,90,0.35)';
    const doozCard = Array.from(document.querySelectorAll('div')).find(
      el => el.children.length > 0 && (el.textContent || '').includes('OX') && (el.textContent || '').includes('دوز') && !(el.textContent || '').includes('چهارتایی')
    );
    if (doozCard) doozCard.click();
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }, true);
})();
</script>
"""

src = src.replace("</body>", clean_js + "\n</body>")
p.write_text(src, encoding="utf-8")
print("Cleaned duplicate UI and added single clean Dooz 4 card")
