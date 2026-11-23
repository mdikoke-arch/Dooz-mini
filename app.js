(function () {
  const BOT_USERNAME = "Starsgameir_bot";

  function getCardInputs() {
    const inputs = Array.from(document.querySelectorAll("input, select"));
    let amountEl =
      document.getElementById("deposit-amount") ||
      document.getElementById("card-amount") ||
      document.getElementById("amount");
    let refEl =
      document.getElementById("card-ref") ||
      document.getElementById("ref-code") ||
      document.getElementById("tracking-code") ||
      document.getElementById("last4");

    if (!amountEl) {
      amountEl = inputs.find((el) =>
        /amount|price|toman|rial|مبلغ|واریز/i.test(
          (el.id || "") + " " + (el.name || "") + " " + (el.placeholder || "")
        )
      );
    }
    if (!refEl) {
      refEl = inputs.find((el) =>
        /ref|track|code|card|پیگیری|کارت|شماره|رقم/i.test(
          (el.id || "") + " " + (el.name || "") + " " + (el.placeholder || "")
        )
      );
    }
    return { amountEl, refEl };
  }

  window.submitCardDeposit = function (customAmount, customRef) {
    const { amountEl, refEl } = getCardInputs();
    const rawAmount =
      customAmount !== undefined
        ? String(customAmount)
        : amountEl
        ? amountEl.value
        : "100000";
    const rawRef =
      customRef !== undefined ? String(customRef) : refEl ? refEl.value : "";

    const refClean = rawRef.trim();
    if (!refClean) {
      alert("لطفاً ۴ رقم آخر کارت یا کد پیگیری را وارد کنید.");
      if (refEl && typeof refEl.focus === "function") refEl.focus();
      return false;
    }

    const amountClean = rawAmount.replace(/[^0-9]/g, "") || "100000";
    const safeRef = encodeURIComponent(refClean.replace(/\s+/g, "-"));
    const payload = `card_${amountClean}_${safeRef}`;
    const botUrl = `https://t.me/${BOT_USERNAME}?start=${payload}`;

    const tg = window.Telegram && window.Telegram.WebApp;
    if (tg) {
      try {
        tg.HapticFeedback && tg.HapticFeedback.impactOccurred("medium");
      } catch (e) {}
      try {
        tg.openTelegramLink(botUrl);
        return true;
      } catch (e) {}
    }

    window.open(botUrl, "_blank");
    return true;
  };

  function attachCardListeners() {
    const candidates = Array.from(
      document.querySelectorAll("button, [role='button'], a.btn, .btn, input[type='button'], input[type='submit']")
    );
    candidates.forEach((el) => {
      const text = (el.innerText || el.textContent || el.value || "").trim();
      const meta = (
        (el.getAttribute("onclick") || "") +
        " " +
        (el.id || "") +
        " " +
        (el.className || "")
      ).toLowerCase();

      const isCardAction =
        /کارت|واریز|ثبت|تایید|card|deposit/i.test(text + " " + meta) &&
        !/stars|ton|tonkeeper|استارز|کیف پول|wallet/i.test(text);

      if (isCardAction && !el.dataset.cardDepositBound) {
        el.dataset.cardDepositBound = "1";
        el.addEventListener("click", function (ev) {
          if (!el.getAttribute("onclick")) {
            ev.preventDefault();
            window.submitCardDeposit();
          }
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachCardListeners);
  } else {
    attachCardListeners();
  }
})();
