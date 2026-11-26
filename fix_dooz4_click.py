from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# حذف هر کارت قبلی دوز چهارتایی
src = re.sub(
    r'<div id="card-dooz4"[\s\S]*?</div>\s*(?=</div>|<div|$)',
    '',
    src,
    count=1
)

# پیدا کردن بلاک کارت دوز اصلی برای کپی کردن ساختار و رویداد کلیک آن
m = re.search(
    r'(<div[^>]*>[\s\S]*?برای انتخاب شرط و دعوت دوست کلیک کن[\s\S]*?</div>\s*</div>)',
    src
)

if m:
    dooz_block = m.group(1)
    # ساخت کارت دوز چهارتایی با ساختار مشابه کارت دوز
    d4_block = dooz_block.replace("OX", "4×4").replace("دوز", "دوز چهارتایی")
    d4_block = re.sub(
        r'(<div\b)([^>]*)>',
        r'\1 id="card-dooz4" data-mode="dooz4"\2>',
        d4_block,
        count=1
    )
    src = src[: m.end()] + "\n" + d4_block + src[m.end() :]
else:
    # فال‌بک اگر ساختار دیو متفاوت بود
    fallback = """
<div id="card-dooz4" data-mode="dooz4" style="margin-top:12px;padding:16px;border-radius:18px;background:rgba(24,20,48,0.85);border:1px solid rgba(255,77,90,0.45);cursor:pointer;text-align:center;">
  <div style="font-size:26px;font-weight:900;color:#ff4d5a;">4×4</div>
  <div style="font-weight:bold;font-size:17px;color:#fff;margin-top:6px;">دوز چهارتایی</div>
  <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">برای انتخاب شرط و دعوت دوست کلیک کن</div>
</div>"""
    src = src.replace("</body>", fallback + "\n</body>")

# شنونده کلیک مستقیم روی کارت دوز چهارتایی و دوز اصلی
click_binder = """
<script>
(function() {
  window.selectedGameMode = window.selectedGameMode || 'dooz';
  function activateMode(mode) {
    window.selectedGameMode = mode;
    const c4 = document.getElementById('card-dooz4');
    if (c4) {
      c4.style.borderColor = mode === 'dooz4' ? '#ff4d5a' : 'rgba(255,77,90,0.35)';
      c4.style.boxShadow = mode === 'dooz4' ? '0 0 18px rgba(255,77,90,0.35)' : 'none';
    }
    const statusNodes = Array.from(document.querySelectorAll('div,p,span')).filter(
      el => (el.textContent || '').includes('انتخاب کن') || (el.textContent || '').includes('انتخاب شد')
    );
    statusNodes.forEach(el => {
      if (el.children.length === 0 && (el.textContent || '').includes('انتخاب شد')) {
        el.textContent = mode === 'dooz4'
          ? 'بازی دوز چهارتایی انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.'
          : 'بازی دوز انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.';
      }
    });
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }
  document.addEventListener('click', function(e) {
    const card4 = e.target.closest('#card-dooz4, [data-mode="dooz4"]');
    if (card4) {
      activateMode('dooz4');
      const betSection = Array.from(document.querySelectorAll('div,section')).find(
        el => (el.textContent || '').includes('SAV 100')
      );
      if (betSection) {
        betSection.style.display = '';
        betSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, true);
})();
</script>
"""

src = src.replace("</body>", click_binder + "\n</body>")
p.write_text(src, encoding="utf-8")
print("Bound click handler directly to #card-dooz4 in index.html")
