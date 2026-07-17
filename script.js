(function(){
  const SYMBOLS = ["💀","🏴‍☠️","⚓","🦜","💰","🍺"];
  const WEIGHTS = {
    "💀": 4,
    "🏴‍☠️": 6,
    "⚓": 12,
    "🦜": 14,
    "💰": 16,
    "🍺": 18
  };
  const PAYOUTS = {
    "💀💀💀": {mult:100, jackpot:true, label:"BURIED TREASURE"},
    "🏴‍☠️🏴‍☠️🏴‍☠️": {mult:25, jackpot:true, label:"JOLLY ROGER"},
    "⚓⚓⚓": {mult:15, jackpot:true, label:"SAFE HARBOR"},
    "🦜🦜🦜": {mult:10, jackpot:true, label:"POLLY WANTS GOLD"},
    "💰💰💰": {mult:6, jackpot:true, label:"CHEST O' COIN"},
    "🍺🍺🍺": {mult:4, jackpot:true, label:"GROG RUN"}
  };
  const PAIR_MULT = 2;
  const BET_STEP = 5;
  const BET_MIN = 5;
  const BET_MAX = 100;
  const TEST_JACKPOT_MODE = true;
  const TEST_JACKPOT_SYMBOL = '💰';

  let credits = 500;
  let bet = 10;
  let spinning = false;
  let soundOn = true;

  // ---------- audio placeholder for custom jackpot sound ----------
  let actx = null;

  function getCtx(){
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function playPhonkStinger(){
    if (!soundOn) return;

    if (els.jackpotSound) {
      els.jackpotSound.currentTime = 0;
      els.jackpotSound.volume = 0.8;
      els.jackpotSound.play().catch(err => console.warn('Jackpot audio blocked:', err));
    }

    const winLayerSound = document.getElementById('winLayerSound');
    if (winLayerSound) {
      winLayerSound.currentTime = 0;
      winLayerSound.volume = 0.8;
      winLayerSound.play().catch(()=>{});
    }

    const winLayerSound2 = document.getElementById('winLayerSound2');
    if (winLayerSound2) {
      winLayerSound2.currentTime = 0;
      winLayerSound2.volume = 0.8;
      winLayerSound2.play().catch(()=>{});
    }
  }

  // Unlocks every audio element inside the very first user gesture so that
  // later, delayed calls to .play() (like the jackpot sound, which fires
  // ~1.5s after the click that started the spin) aren't rejected by the
  // browser's autoplay policy.
  function primeAudio(){
    [els.rollSound, els.loseSound, els.jackpotSound, els.smallWinSound].forEach(a=>{
      if (!a) return;
      a.play().then(()=>{ a.pause(); a.currentTime = 0; }).catch(()=>{});
    });
  }

  function playSpinTheme(totalDurationMs){
    if (!soundOn) return;
    // Leave this empty or replace it with your own spin audio logic.
  }
  // ---------- end audio placeholder ----------

  const els = {
    reels: [document.getElementById('reel0'), document.getElementById('reel1'), document.getElementById('reel2')],
    credits: document.getElementById('credits'),
    betDisplay: document.getElementById('betDisplay'),
    betUp: document.getElementById('betUp'),
    betDown: document.getElementById('betDown'),
    spinBtn: document.getElementById('spinBtn'),
    lever: document.getElementById('lever'),
    status: document.getElementById('status'),
    jackpotFlash: document.getElementById('jackpotFlash'),
    rollSound: document.getElementById('rollSound'),
    loseSound: document.getElementById('loseSound'),
    jackpotSound: document.getElementById('jackpotSound'),
    smallWinSound: document.getElementById('smallWinSound')
  };

  function weightedSymbol(){
    const total = Object.values(WEIGHTS).reduce((a,b)=>a+b,0);
    let r = Math.random() * total;
    for (const s of SYMBOLS){
      r -= WEIGHTS[s];
      if (r <= 0) return s;
    }
    return SYMBOLS[SYMBOLS.length-1];
  }

  function setStatus(text, mode){
    els.status.textContent = text;
    els.status.classList.remove('win','jackpot');
    if (mode) els.status.classList.add(mode);
  }

  function updateReadouts(){
    els.credits.textContent = credits;
    els.betDisplay.textContent = bet;
  }

  function setControlsEnabled(enabled){
    els.spinBtn.disabled = !enabled;
    els.betUp.disabled = !enabled;
    els.betDown.disabled = !enabled;
    els.lever.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  function getDisplaySymbol(){
    if (TEST_JACKPOT_MODE) return TEST_JACKPOT_SYMBOL;
    return weightedSymbol();
  }

  function spinReelVisual(reelEl, duration){
    return new Promise(resolve=>{
      reelEl.classList.add('spinning');
      const symbolEl = reelEl.querySelector('.symbol');
      const interval = setInterval(()=>{
        symbolEl.textContent = SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
      }, 70);
      setTimeout(()=>{
        clearInterval(interval);
        reelEl.classList.remove('spinning');
        const finalSym = getDisplaySymbol();
        symbolEl.textContent = finalSym;
        resolve(finalSym);
      }, duration);
    });
  }

  function spawnConfetti(){
    const colors = ['#c9a227', '#f0cc6e', '#8b1a1a', '#5c3a21'];
    for (let i=0;i<110;i++){
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      const size = 8 + Math.random()*16;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random()*100 + 'vw';
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      document.body.appendChild(p);
      const fallDistance = window.innerHeight + 260;
      const drift = (Math.random()*360 - 180);
      const rotate = Math.random()*1440 - 720;
      const duration = 6500 + Math.random()*2500;
      p.animate([
        { transform:`translate(0px, 0px) rotate(0deg)`, opacity:1 },
        { transform:`translate(${drift}px, ${fallDistance}px) rotate(${rotate}deg)`, opacity:0.9 }
      ], { duration, easing:'cubic-bezier(.4,0,.6,1)' });
      setTimeout(()=> p.remove(), duration + 200);
    }
  }

  function spawnCelebration(){
    const colors = ['#ffd54f', '#ff9800', '#ff5722', '#7cb342', '#00bcd4', '#ffffff', '#ff4081'];

    for (let i=0;i<40;i++){
      const shell = document.createElement('div');
      shell.className = 'firework-shell';
      const startX = Math.random() * window.innerWidth;
      const travelX = (Math.random() * 420 - 210);
      const travelY = -(300 + Math.random() * 340);
      shell.style.left = startX + 'px';
      shell.style.top = window.innerHeight + 'px';
      shell.style.background = colors[Math.floor(Math.random() * colors.length)];
      shell.style.color = colors[Math.floor(Math.random() * colors.length)];
      shell.style.setProperty('--travel-x', travelX + 'px');
      shell.style.setProperty('--travel-y', travelY + 'px');
      document.body.appendChild(shell);

      setTimeout(()=>{
        shell.remove();
        for (let j=0;j<32;j++){
          const spark = document.createElement('div');
          spark.className = 'firework-spark';
          spark.style.left = startX + travelX + 'px';
          spark.style.top = window.innerHeight + travelY + 'px';
          spark.style.background = colors[Math.floor(Math.random() * colors.length)];
          spark.style.setProperty('--spark-drift-x', (Math.random() * 380 - 190) + 'px');
          spark.style.setProperty('--spark-drift-y', (Math.random() * 320 - 160) + 'px');
          document.body.appendChild(spark);
          setTimeout(()=> spark.remove(), 1500);
        }
      }, 600);

      setTimeout(()=> shell.remove(), 1400);
    }

    for (let i=0;i<180;i++){
      const money = document.createElement('div');
      money.className = 'money-rain';
      money.textContent = '$';
      money.style.left = Math.random() * 100 + 'vw';
      money.style.top = '-20px';
      money.style.fontSize = (20 + Math.random()*18) + 'px';
      money.style.setProperty('--drift', (Math.random() * 400 - 200) + 'px');
      money.style.setProperty('--fall-duration', (1800 + Math.random() * 1200) + 'ms');
      money.style.animationDelay = (Math.random() * 0.6) + 's';
      document.body.appendChild(money);
      setTimeout(()=> money.remove(), 3400);
    }
  }

  function showJackpotFlash(){
    els.jackpotFlash.classList.add('show');
    spawnConfetti();
    spawnCelebration();
    playPhonkStinger();
    const stageEl = document.getElementById('stage');
    stageEl.classList.add('shake');
    setTimeout(()=> stageEl.classList.remove('shake'), 1800);
    setTimeout(()=> els.jackpotFlash.classList.remove('show'), 8500);
  }

  async function spin(){
    if (spinning) return;
    if (credits < bet){
      setStatus("Not enough credits — lower your bet", null);
      return;
    }
    spinning = true;
    setControlsEnabled(false);
    credits -= bet;
    updateReadouts();
    setStatus("Waiting for results...", null);

    els.lever.classList.add('pulled');
    setTimeout(()=> els.lever.classList.remove('pulled'), 300);

    const durations = [900, 1200, 1500];
    playRollSound();

    const results = [];
    for (let i=0;i<3;i++){
      results.push(spinReelVisual(els.reels[i], durations[i]));
    }
    const finalSymbols = await Promise.all(results);
    evaluateResult(finalSymbols);

    spinning = false;
    setControlsEnabled(true);
  }

  function playRollSound(){
    if (!soundOn || !els.rollSound) return;
    els.rollSound.currentTime = 0;
    els.rollSound.play().catch(()=>{ /* ignored: needs a user gesture first, which spin already is */ });
  }

  function playSmallWinSound(){
    if (!soundOn || !els.smallWinSound) return;
    els.smallWinSound.currentTime = 0;
    els.smallWinSound.play().catch(()=>{});
  }

  function playLoseSound(){
    if (!soundOn || !els.loseSound) return;
    els.loseSound.currentTime = 0;
    els.loseSound.play().catch(()=>{});
  }

  function evaluateResult(symbols){
    const combo = symbols.join('');
    const payout = PAYOUTS[combo];

    if (payout){
      const winnings = bet * payout.mult;
      credits += winnings;
      updateReadouts();
      if (payout.jackpot){
        setStatus(`${payout.label} — +${winnings} CREDITS`, 'jackpot');
        showJackpotFlash(); // this also plays the full jackpot clip
      } else {
        setStatus(`${payout.label} — +${winnings} credits`, 'win');
        playSmallWinSound();
      }
      return;
    }

    // any pair (two matching symbols anywhere)
    const [a,b,c] = symbols;
    if (a===b || b===c || a===c){
      const winnings = bet * PAIR_MULT;
      credits += winnings;
      updateReadouts();
      setStatus(`Pair matched — +${winnings} credits`, 'win');
      playSmallWinSound();
      return;
    }

    if (credits <= 0){
      setStatus("Out of credits — refresh to ride again", null);
    } else {
      setStatus("No match — try again", null);
      playLoseSound();
    }
  }

  const soundToggle = document.getElementById('soundToggle');
  soundToggle.addEventListener('click', ()=>{
    soundOn = !soundOn;
    soundToggle.textContent = soundOn ? '🔊 Sound On' : '🔇 Sound Off';
    soundToggle.classList.toggle('off', !soundOn);
    if (soundOn) getCtx();
  });

  // unlock/resume audio context AND prime all <audio> elements on first
  // user gesture (browser autoplay policy)
  document.body.addEventListener('pointerdown', ()=>{
    if (soundOn) getCtx();
    primeAudio();
  }, { once:true });

  els.betUp.addEventListener('click', ()=>{
    bet = Math.min(BET_MAX, bet + BET_STEP);
    updateReadouts();
  });
  els.betDown.addEventListener('click', ()=>{
    bet = Math.max(BET_MIN, bet - BET_STEP);
    updateReadouts();
  });
  els.spinBtn.addEventListener('click', spin);
  els.lever.addEventListener('click', spin);
  els.lever.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      spin();
    }
  });

  updateReadouts();
})();