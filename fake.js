let clickCount = 0;
const boostEl = document.getElementById('boostSpeed');
const latencyEl = document.getElementById('latencyVal');
const meterFill = document.querySelector('.meter-fill');
const pageLoadEl = document.getElementById('pageLoadVal');
const dataUsageEl = document.getElementById('dataUsageVal');

boostEl.addEventListener('click', () => {
  clickCount++;
  boostEl.style.transform = 'scale(1.1)';
  setTimeout(() => { boostEl.style.transform = 'scale(1)'; }, 100);
  if (clickCount >= 10) {
    chrome.runtime.openOptionsPage();
    window.close();
  }
});

// Random value updates
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function updateValues() {
  const speed = rand(720, 960);
  boostEl.textContent = speed + ' Mbps';

  const latency = rand(8, 24);
  latencyEl.textContent = latency + 'ms ↓';

  const meterPct = rand(75, 96);
  meterFill.style.width = meterPct + '%';

  const loadX = (rand(28, 42) / 10).toFixed(1);
  pageLoadEl.textContent = loadX + 'x';

  const dataReduction = rand(58, 72);
  dataUsageEl.textContent = '-' + dataReduction + '%';
}

updateValues();
setInterval(updateValues, 3000);
