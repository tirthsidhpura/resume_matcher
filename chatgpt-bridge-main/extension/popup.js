const dot    = document.getElementById('dot');
const status = document.getElementById('status');
const btn    = document.getElementById('btn');
const warn   = document.getElementById('warn');

function setConnected() {
  dot.className      = 'dot connected';
  status.textContent = 'Connected — http://localhost:4000';
  btn.textContent    = 'Reconnect';
  btn.disabled       = false;
  warn.style.display = 'none';
}

function setDisconnected() {
  dot.className      = 'dot disconnected';
  status.textContent = 'Not connected';
  btn.textContent    = 'Connect to server';
  btn.disabled       = false;
  warn.style.display = 'none';
}

function setChecking() {
  dot.className      = 'dot';
  status.textContent = 'Connecting...';
  btn.disabled       = true;
  warn.style.display = 'none';
}

function checkStatus() {
  chrome.runtime.sendMessage({ type: 'STATUS_REQUEST' }, res => {
    if (res?.status === 'connected') setConnected();
    else setDisconnected();
  });
}

btn.addEventListener('click', () => {
  setChecking();
  chrome.runtime.sendMessage({ type: 'CONNECT_REQUEST' }, res => {
    if (!res?.ok && res?.error === 'no_tab') {
      setDisconnected();
      warn.style.display = 'block';
      return;
    }
    setTimeout(checkStatus, 1000);
  });
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'STATUS') {
    if (msg.status === 'connected') setConnected();
    else setDisconnected();
  }
});

checkStatus();
