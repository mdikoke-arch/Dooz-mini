const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

function loadState() {
  const name = localStorage.getItem('player_name') || '';
  const uname = localStorage.getItem('player_username') || '';
  const gems = localStorage.getItem('gems_bal') || '750';
  const wins = localStorage.getItem('stats_wins') || '0';
  const losses = localStorage.getItem('stats_losses') || '0';

  document.getElementById('top-gems').innerText = gems;
  document.getElementById('wallet-gems').innerText = gems;
  document.getElementById('stat-wins').innerText = wins;
  document.getElementById('stat-losses').innerText = losses;

  if (name && uname) {
    document.getElementById('top-name').innerText = name;
    document.getElementById('top-username').innerText = '@' + uname.replace(/^@/, '');
    document.getElementById('inp-name').value = name;
    document.getElementById('inp-username').value = uname;
    document.getElementById('profile-lock-alert').style.display = 'none';
  } else {
    document.getElementById('profile-lock-alert').style.display = 'flex';
  }
}

function saveUserProfile() {
  const name = document.getElementById('inp-name').value.trim();
  const uname = document.getElementById('inp-username').value.trim().replace(/^@/, '');

  if (name.length < 2 || uname.length < 3) {
    alert('لطفاً نام (حداقل ۲ حرف) و یوزرنیم معتبر (حداقل ۳ حرف) وارد کنید!');
    return;
  }

  localStorage.setItem('player_name', name);
  localStorage.setItem('player_username', uname);
  loadState();

  if (tg) {
    try {
      tg.sendData(JSON.stringify({ action: 'save_profile', name, username: uname }));
    } catch (e) {}
  }

  alert('✅ پروفایل شما ثبت شد! حالا می‌توانید وارد بخش بازی‌ها شوید.');
  switchTab('home', document.querySelector('[data-t=home]'));
}

function isProfileReady() {
  const name = localStorage.getItem('player_name');
  const uname = localStorage.getItem('player_username');
  return Boolean(name && uname);
}

function enterCategory(cat) {
  if (!isProfileReady()) {
    alert('🔒 برای شروع بازی ابتدا باید در بخش پروفایل، نام و یوزرنیم خود را انتخاب کنید!');
    switchTab('profile', document.querySelector('[data-t=profile]'));
    return;
  }

  if (cat === 'board') {
    alert('🎲 بخش بازی‌های تخته‌ای باز شد (آماده اتصال فایل بازی تخته‌ای).');
  } else if (cat === 'cards') {
    alert('🃏 بخش بازی‌های ورق یا پاسور باز شد (آماده اتصال فایل حکم).');
  } else if (cat === 'slots') {
    alert('🎰 بخش بازی‌های اسلاتی باز شد (آماده اتصال فایل اسلات).');
  }
}

function switchTab(id, el) {
  document.querySelectorAll('.tab-sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id)?.classList.add('active');
  if (el) el.classList.add('active');
}

function requestBuy(gems, stars) {
  if (tg) {
    try { tg.sendData(JSON.stringify({ action: 'buy_stars', gems, stars })); } catch (e) {}
  }
  alert(`درخواست خرید ${gems} الماس (${stars}) به ربات ارسال شد.`);
}

function sendWalletAction(type) {
  if (tg) {
    try { tg.sendData(JSON.stringify({ action: type })); } catch (e) {}
  }
  alert(type === 'deposit_card' ? 'درخواست واریز کارت به کارت به ربات ارسال شد.' : 'درخواست واریز TON به ربات ارسال شد.');
}

function submitWithdraw() {
  const amt = parseInt(document.getElementById('withdraw-amount').value, 10);
  const dest = document.getElementById('withdraw-dest').value.trim();
  const bal = parseInt(localStorage.getItem('gems_bal') || '750', 10);

  if (!amt || amt < 100) { alert('حداقل مقدار برداشت ۱۰۰ الماس است.'); return; }
  if (amt > bal) { alert('موجودی الماس شما کافی نیست.'); return; }
  if (dest.length < 6) { alert('شماره کارت یا آدرس ولت معتبر وارد کنید.'); return; }

  if (tg) {
    try { tg.sendData(JSON.stringify({ action: 'withdraw', amount: amt, destination: dest })); } catch (e) {}
  }
  alert('✅ درخواست برداشت شما ثبت شد.');
}

loadState();
