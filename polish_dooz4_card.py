from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# جایگزینی کارت قبلی دوز چهار تایی با نسخه تمیز دارای آیکون هم‌سبک و عنوان "دوز چهارتایی"
clean_card = """<div id="card-dooz4" onclick="selectGameMode('dooz4')" style="margin-top:12px;padding:16px 14px;border-radius:18px;background:rgba(24,20,48,0.82);border:1px solid rgba(239,68,68,0.35);cursor:pointer;text-align:center;">
  <div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#ff4d5a;text-shadow:0 0 14px rgba(255,77,90,0.45);line-height:1.1;">4×4</div>
  <div style="font-weight:bold;font-size:17px;color:#ffffff;margin-top:6px;">دوز چهارتایی</div>
  <div style="font-size:12px;color:rgba(255,255,255,0.72);margin-top:4px;">برای انتخاب شرط و دعوت دوست کلیک کن</div>
</div>"""

src = re.sub(
    r'<div id="card-dooz4".*?</div>\s*</div>',
    clean_card,
    src,
    flags=re.DOTALL
)

# جایگزینی helper_js تا هنگام کلیک، بخش شرط‌بندی/دعوت باز و اسکرول شود و پیام وضعیت به‌روز شود
new_helper = """<script>
window.selectedGameMode = window.selectedGameMode || 'dooz';
window.selectGameMode = function(mode) {
  window.selectedGameMode = mode;
  const c1 = document.querySelector('[onclick*="dooz4"]');
  if (c1) {
    c1.style.borderColor = mode === 'dooz4' ? 'rgba(255,77,90,0.9)' : 'rgba(239,68,68,0.35)';
    c1.style.boxShadow = mode === 'dooz4' ? '0 0 18px rgba(255,77,90,0.28)' : 'none';
  }
  const betBox = document.querySelector('[class*="bet"], [id*="bet"]') ||
                 Array.from(document.querySelectorAll('div,section')).find(el => (el.textContent || '').includes('SAV 100'));
  if (betBox) {
    betBox.style.display = '';
    betBox.classList.remove('hidden', 'hide', 'd-none');
    betBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const statusEl = document.querySelector('[style*="بازی دوز انتخاب شد"]') || document.getElementById('statusText');
  if (statusEl) {
    statusEl.textContent = mode === 'dooz4'
      ? 'بازی دوز چهارتایی انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.'
      : 'بازی دوز انتخاب شد — شرط را انتخاب کن و دوستت را دعوت کن.';
  }
};
</script>"""

src = re.sub(r'<script>\s*window\.selectedGameMode[\s\S]*?</script>', new_helper, src, count=1)

p.write_text(src, encoding="utf-8")
print("Polished Dooz 4 card icon, label, and click behavior")
