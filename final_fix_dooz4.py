from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# ۱. پاک کردن اسکریپت‌های کمکی قبلی اضافه شده توسط ما
src = re.sub(
    r'\n?<script>\s*\(function\(\)\s*\{\s*window\.selectedGameMode[\s\S]*?</script>',
    '',
    src
)
src = re.sub(
    r'\n?<script>\s*window\.selectedGameMode\s*=\s*window\.selectedGameMode[\s\S]*?</script>',
    '',
    src
)

# ۲. حذف دیوهای حاوی card-dooz4 یا SAV 0 با شمارش دقیق تگ‌های div
def drop_div_containing(html: str, needle: str) -> str:
    while needle in html:
        pos = html.find(needle)
        start = html.rfind("<div", 0, pos)
        if start == -1:
            break
        depth = 0
        end = -1
        for m in re.finditer(r'</?div\b[^>]*>', html[start:]):
            tok = m.group(0)
            if tok.startswith("</div"):
                depth -= 1
                if depth == 0:
                    end = start + m.end()
                    break
            elif not tok.endswith("/>"):
                depth += 1
        if end != -1:
            html = html[:start] + html[end:]
        else:
            break
    return html

src = drop_div_containing(src, 'id="card-dooz4"')
src = drop_div_containing(src, "SAV 0")

# ۳. قرار دادن کارت مستقل "دوز چهارتایی" بلافاصله پس از کارت اصلی دوز
d4_card = """
<div id="card-dooz4" data-mode="dooz4" style="margin-top:12px;padding:16px 14px;border-radius:18px;background:rgba(24,20,48,0.88);border:1px solid rgba(255,77,90,0.45);cursor:pointer;text-align:center;">
  <div style="display:flex;justify-content:center;gap:6px;margin-bottom:8px;">
    <span style="width:13px;height:13px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.85);"></span>
    <span style="width:13px;height:13px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.85);"></span>
    <span style="width:13px;height:13px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.85);"></span>
    <span style="width:13px;height:13px;border-radius:50%;background:#ff4d5a;box-shadow:0 0 10px rgba(255,77,90,0.85);"></span>
  </div>
  <div style="font-weight:900;font-size:18px;color:#ff4d5a;text-shadow:0 0 12px rgba(255,77,90,0.35);">دوز چهارتایی</div>
</div>"""

anchor_idx = src.find("برای انتخاب شرط و دعوت دوست کلیک کن")
if anchor_idx != -1:
    d1 = src.find("</div>", anchor_idx)
    d2 = src.find("</div>", d1 + 6) if d1 != -1 else -1
    insert_at = d2 + 6 if d2 != -1 else d1 + 6
    if insert_at > 5:
        src = src[:insert_at] + d4_card + src[insert_at:]
else:
    src = src.replace("</body>", d4_card + "\n</body>")

# ۴. اسکریپت نهایی فعال‌سازی دوز چهارتایی و باز کردن بخش شرط‌بندی هنگام کلیک
final_js = """
<script>
(function() {
  window.selectedGameMode = window.selectedGameMode || 'dooz';

  function openBetAndInviteForMode(mode) {
    window.selectedGameMode = mode;
    const c4 = document.getElementById('card-dooz4');
    if (c4) {
      c4.style.borderColor = mode === 'dooz4' ? '#ff4d5a' : 'rgba(255,77,90,0.45)';
      c4.style.boxShadow = mode === 'dooz4' ? '0 0 20px rgba(255,77,90,0.45)' : 'none';
    }

    // اگر تابع داخلی برای انتخاب بازی در صفحه وجود داشته باشد صدا زده می‌شود
    for (const fnName of ['selectGame', 'chooseGame', 'setGame', 'openBetSection', 'showBetBox']) {
      if (typeof window[fnName] === 'function') {
        try { window[fnName](mode); } catch (_) {}
      }
    }

    // نمایش بخش‌های شرط‌بندی یا دعوت دوست در صورت مخفی بودن
    const allEls = Array.from(document.querySelectorAll('div,section,form'));
    const targets = allEls.filter(el => {
      if (el.id === 'card-dooz4' || el.closest('#card-dooz4')) return false;
      const txt = el.textContent || '';
      return txt.includes('SAV 100') || txt.includes('دعوت');
    }).sort((a, b) => a.innerHTML.length - b.innerHTML.length);

    let scrollTarget = targets[0] || null;
    for (const el of targets) {
      let cur = el;
      while (cur && cur !== document.body) {
        const st = window.getComputedStyle(cur);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) {
          cur.style.display = 'block';
          cur.style.visibility = 'visible';
          cur.style.opacity = '1';
          cur.classList.remove('hidden', 'hide', 'd-none', 'invisible');
        }
        cur = cur.parentElement;
      }
    }

    if (scrollTarget) {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }

  document.addEventListener('click', function(e) {
    const card4 = e.target.closest('#card-dooz4');
    if (!card4) return;
    openBetAndInviteForMode('dooz4');
  }, true);
})();
</script>
"""

src = src.replace("</body>", final_js + "\n</body>")
p.write_text(src, encoding="utf-8")
print("Applied final clean Dooz 4 UI and click handler")
