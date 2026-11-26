from pathlib import Path
import re

p = Path.home() / "Dooz-mini" / "index.html"
src = p.read_text(encoding="utf-8", errors="ignore")

# حذف کارت قبلی دوز چهار تایی در صورت وجود
src = re.sub(
    r'<div onclick="selectGameMode\(\'dooz4\'\)".*?</div>\s*</div>',
    '',
    src,
    flags=re.DOTALL
)

# پیدا کردن پایان باکس اصلی بازی دوز (پس از "برای انتخاب شرط و دعوت دوست کلیک کن")
anchor = "برای انتخاب شرط و دعوت دوست کلیک کن"
idx = src.find(anchor)
if idx != -1:
    end_dooz_box = src.find("</div>", src.find("</div>", idx) + 1)
    if end_dooz_box != -1:
        separate_card = """
<div id="card-dooz4" onclick="selectGameMode('dooz4')" style="margin-top:12px;padding:14px;border-radius:16px;background:rgba(30,41,59,0.75);border:1px solid rgba(99,102,241,0.45);cursor:pointer;">
  <div style="font-weight:bold;font-size:17px;color:#a5b4fc;">دوز چهار تایی</div>
  <div style="font-size:12px;opacity:0.85;margin-top:4px;">بازی جداگانه • اتصال ۴ مهره در یک ردیف</div>
</div>"""
        src = src[: end_dooz_box + 6] + separate_card + src[end_dooz_box + 6 :]

p.write_text(src, encoding="utf-8")
print("Separated Dooz (3-in-a-row) and Dooz 4 cards in index.html")
