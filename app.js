(function () {
  var BOT_USERNAME = "Starsgameir_bot";
  var TON_WALLET = "UQ_YOUR_TON_WALLET_ADDRESS_HERE";
  var CARD_NUMBER = "6277-6014-2080-7065";
  var CARD_OWNER = "مهدی لایقی";
  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }
  var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 123456789, first_name: "بازیکن", username: "guest", photo_url: "" };
  window.APP_STATE = {
    user: user, gems: 750, wins: 14, losses: 6, selectedPack: null, selectedCat: "card",
    friends: [
      { id: 901, name: "امیرحسین", wins: 22, losses: 9, gems: 1450 },
      { id: 902, name: "سارا", wins: 11, losses: 5, gems: 680 },
      { id: 903, name: "رضا", wins: 31, losses: 12, gems: 2900 }
    ]
  };
  function byId(id) { return document.getElementById(id); }
  window.haptic = function (t) { try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(t || "light"); } catch (e) {} };
  window.openBotLink = function (p) {
    window.haptic("medium");
    var u = "https://t.me/" + BOT_USERNAME + "?start=" + encodeURIComponent(p);
    if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank");
  };
  window.switchMainTab = function (tab) {
    window.haptic("light");
    ["games", "shop", "friends"].forEach(function (t) {
      if (byId("pane-" + t)) byId("pane-" + t).classList.toggle("active", t === tab);
      if (byId("nav-" + t)) byId("nav-" + t).classList.toggle("active", t === tab);
    });
  };
  window.selectCategory = function (cat) {
    window.haptic("light");
    window.APP_STATE.selectedCat = cat;
    var chips = document.querySelectorAll(".cat-chip");
    for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i].getAttribute("data-cat") === cat);
  };
  window.openProfileModal = function () { window.haptic("light"); if (byId("profile-modal")) byId("profile-modal").classList.add("open"); };
  window.closeModal = function (id) { if (byId(id)) byId(id).classList.remove("open"); };
  window.submitWithdraw = function () {
    var a = byId("withdraw-amount") ? byId("withdraw-amount").value.trim() : "";
    var d = byId("withdraw-dest") ? byId("withdraw-dest").value.trim() : "";
    if (!a || !d) { alert("مبلغ و شماره کارت یا آدرس ولت را وارد کنید."); return; }
    window.openBotLink("withdraw_" + a + "_" + d.replace(/\s+/g, ""));
  };
  window.openBuyPackModal = function (gems, toman, ton) {
    window.haptic("medium");
    window.APP_STATE.selectedPack = { gems: gems, toman: toman, ton: ton };
    if (byId("buy-pack-title")) byId("buy-pack-title").textContent = "خرید بسته " + gems + " الماس";
    if (byId("buy-pack-sub")) byId("buy-pack-sub").textContent = "مبلغ: " + Number(toman).toLocaleString("fa-IR") + " تومان یا " + ton + " TON";
    if (byId("card-step-box")) byId("card-step-box").style.display = "none";
    if (byId("ton-step-box")) byId("ton-step-box").style.display = "none";
    if (byId("buy-modal")) byId("buy-modal").classList.add("open");
  };
  window.choosePayMethod = function (m) {
    window.haptic("light");
    var p = window.APP_STATE.selectedPack;
    if (!p) return;
    if (byId("card-step-box")) byId("card-step-box").style.display = m === "card" ? "block" : "none";
    if (byId("ton-step-box")) byId("ton-step-box").style.display = m === "ton" ? "block" : "none";
    if (m === "card") {
      if (byId("card-num-display")) byId("card-num-display").textContent = CARD_NUMBER;
      if (byId("card-owner-display")) byId("card-owner-display").textContent = CARD_OWNER;
      if (byId("card-pay-amount")) byId("card-pay-amount").textContent = Number(p.toman).toLocaleString("fa-IR") + " تومان";
    } else {
      if (byId("ton-addr-display")) byId("ton-addr-display").textContent = TON_WALLET;
      if (byId("ton-pay-amount")) byId("ton-pay-amount").textContent = p.ton + " TON";
    }
  };
  window.confirmCardPurchase = function () {
    var p = window.APP_STATE.selectedPack;
    var r = byId("buy-card-ref") ? byId("buy-card-ref").value.trim() : "";
    if (!p) return;
    if (!r) { alert("لطفاً ۴ رقم آخر کارت یا کد پیگیری را وارد کنید."); return; }
    window.openBotLink("card_" + p.toman + "_" + r + "_g" + p.gems);
  };
  window.confirmTonPurchase = function () {
    var p = window.APP_STATE.selectedPack;
    if (!p) return;
    window.open("ton://transfer/" + TON_WALLET + "?amount=" + Math.round(p.ton * 1e9) + "&text=U" + user.id + "_G" + p.gems, "_blank");
  };
  window.copyInviteLink = function () {
    window.haptic("medium");
    var link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + user.id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () { alert("لینک دعوت اختصاصی کپی شد:\n" + link); }).catch(function () { prompt("لینک دعوت شما:", link); });
    } else prompt("لینک دعوت شما:", link);
  };
  window.shareInviteLink = function () {
    window.haptic("medium");
    var link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + user.id;
    var u = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent("بیا با هم بازی کنیم و الماس ببریم!");
    if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank");
  };
  window.showFriendProfile = function (i) {
    window.haptic("light");
    var f = window.APP_STATE.friends[i];
    if (!f) return;
    if (byId("fp-name")) byId("fp-name").textContent = f.name;
    if (byId("fp-avatar")) byId("fp-avatar").textContent = f.name.charAt(0);
    if (byId("fp-wins")) byId("fp-wins").textContent = f.wins;
    if (byId("fp-losses")) byId("fp-losses").textContent = f.losses;
    if (byId("fp-gems")) byId("fp-gems").textContent = f.gems;
    if (byId("friend-modal")) byId("friend-modal").classList.add("open");
  };
  function initUI() {
    var n = user.first_name || "بازیکن";
    if (byId("header-name")) byId("header-name").textContent = n;
    if (byId("header-gems")) byId("header-gems").textContent = window.APP_STATE.gems;
    if (byId("prof-name")) byId("prof-name").textContent = n;
    if (byId("prof-wins")) byId("prof-wins").textContent = window.APP_STATE.wins;
    if (byId("prof-losses")) byId("prof-losses").textContent = window.APP_STATE.losses;
    if (byId("prof-gems")) byId("prof-gems").textContent = window.APP_STATE.gems;
    if (byId("invite-url-box")) byId("invite-url-box").textContent = "https://t.me/" + BOT_USERNAME + "?start=ref_" + user.id;
    var av = byId("header-avatar"), pav = byId("prof-avatar");
    if (user.photo_url) {
      if (av) av.innerHTML = '<img src="' + user.photo_url + '" alt="avatar" />';
      if (pav) pav.innerHTML = '<img src="' + user.photo_url + '" alt="avatar" />';
    } else {
      var ch = n.charAt(0) || "U";
      if (av) av.textContent = ch;
      if (pav) pav.textContent = ch;
    }
    var fl = byId("friends-list");
    if (fl) {
      fl.innerHTML = window.APP_STATE.friends.map(function (f, i) {
        return '<div class="friend-row" data-friend-idx="' + i + '"><div class="friend-left"><div class="mini-av">' + f.name.charAt(0) + '</div><div><div class="friend-name">' + f.name + '</div><div class="friend-sub">کلیک برای مشاهده پروفایل</div></div></div><div class="friend-gems">💎 ' + f.gems + '</div></div>';
      }).join("");
      fl.addEventListener("click", function (ev) {
        var r = ev.target.closest ? ev.target.closest(".friend-row") : null;
        if (r) window.showFriendProfile(Number(r.getAttribute("data-friend-idx")));
      });
    }
    if (byId("profile-header-btn")) byId("profile-header-btn").addEventListener("click", window.openProfileModal);
    if (byId("close-profile-btn")) byId("close-profile-btn").addEventListener("click", function () { window.closeModal("profile-modal"); });
    if (byId("withdraw-submit-btn")) byId("withdraw-submit-btn").addEventListener("click", window.submitWithdraw);
    if (byId("nav-shop")) byId("nav-shop").addEventListener("click", function () { window.switchMainTab("shop"); });
    if (byId("nav-games")) byId("nav-games").addEventListener("click", function () { window.switchMainTab("games"); });
    if (byId("nav-friends")) byId("nav-friends").addEventListener("click", function () { window.switchMainTab("friends"); });
    var chips = document.querySelectorAll(".cat-chip");
    for (var i = 0; i < chips.length; i++) chips[i].addEventListener("click", function () { window.selectCategory(this.getAttribute("data-cat")); });
    var packs = document.querySelectorAll(".pack-card");
    for (var j = 0; j < packs.length; j++) packs[j].addEventListener("click", function () { window.openBuyPackModal(Number(this.getAttribute("data-gems")), Number(this.getAttribute("data-toman")), Number(this.getAttribute("data-ton"))); });
    if (byId("pay-method-ton")) byId("pay-method-ton").addEventListener("click", function () { window.choosePayMethod("ton"); });
    if (byId("pay-method-card")) byId("pay-method-card").addEventListener("click", function () { window.choosePayMethod("card"); });
    if (byId("confirm-card-btn")) byId("confirm-card-btn").addEventListener("click", window.confirmCardPurchase);
    if (byId("confirm-ton-btn")) byId("confirm-ton-btn").addEventListener("click", window.confirmTonPurchase);
    if (byId("close-buy-btn")) byId("close-buy-btn").addEventListener("click", function () { window.closeModal("buy-modal"); });
    if (byId("copy-invite-btn")) byId("copy-invite-btn").addEventListener("click", window.copyInviteLink);
    if (byId("share-invite-btn")) byId("share-invite-btn").addEventListener("click", window.shareInviteLink);
    if (byId("close-friend-btn")) byId("close-friend-btn").addEventListener("click", function () { window.closeModal("friend-modal"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUI); else initUI();
})();
