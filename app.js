'use strict';

var STATES = ['idle', 'waiting', 'failed', 'done'];

var LABELS = {
  idle: 'Idle',
  waiting: 'Waiting on you',
  failed: 'Failed',
  done: 'Done'
};

// Stub fetch for a later Duo writer. Off in v1.
// ./status.json shape: { state, capsule_id, updated }
var STATUS_POLL_ENABLED = false;
var STATUS_POLL_MS = 5000;

var LOG_KEY = 'dee-face-log';
var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

var capsuleEl = document.getElementById('capsule');
var stateWordEl = document.getElementById('state-word');
var actionsEl = document.getElementById('actions');

var capsuleId = makeCapsuleId();
var state = stateFromLocation();

function makeCapsuleId() {
  var bytes = new Uint8Array(6);
  if (globalThis.crypto && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (var i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  var id = 'c-';
  for (var n = 0; n < bytes.length; n += 1) {
    id += ALPHABET[bytes[n] % ALPHABET.length];
  }
  return id;
}

function stateFromLocation() {
  var requested = new URLSearchParams(location.search).get('state');
  if (!requested) return 'idle';
  var normalized = requested.trim().toLowerCase();
  return STATES.indexOf(normalized) === -1 ? 'idle' : normalized;
}

function render() {
  document.body.dataset.state = state;
  capsuleEl.textContent = capsuleId;
  stateWordEl.textContent = LABELS[state];
  actionsEl.hidden = state !== 'waiting';
}

function setState(next) {
  if (STATES.indexOf(next) === -1) return;
  state = next;
  render();
}

function remember(next) {
  var url = new URL(location.href);
  url.searchParams.set('state', next);
  history.replaceState(null, '', url);
}

function answer(value) {
  // Later this will send {capsule_id, answer} only.
  var message = { capsule_id: capsuleId, answer: value };
  console.info(message);
  try {
    var previous = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    var entries = Array.isArray(previous) ? previous : [];
    entries.push(message);
    localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-20)));
  } catch (error) {
    console.warn('Dee could not write the local log', error);
  }
  var next = value === 'yes' ? 'done' : 'idle';
  setState(next);
  remember(next);
}

document.getElementById('demo').addEventListener('click', function () {
  var index = STATES.indexOf(state);
  var next = STATES[(index + 1) % STATES.length];
  setState(next);
  remember(next);
});

document.getElementById('yes').addEventListener('click', function () {
  answer('yes');
});

document.getElementById('no').addEventListener('click', function () {
  answer('no');
});

function pullStatus() {
  fetch('./status.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) return null;
      return response.json();
    })
    .then(function (data) {
      if (!data || typeof data !== 'object') return;
      if (typeof data.capsule_id === 'string' && /^c-[A-Za-z0-9]{6}$/.test(data.capsule_id)) {
        capsuleId = data.capsule_id;
      }
      if (STATES.indexOf(data.state) !== -1) {
        state = data.state;
      }
      // `updated` is part of the file contract and is not displayed.
      render();
    })
    .catch(function (error) {
      console.warn('Dee status.json is unavailable', error);
    });
}

if (STATUS_POLL_ENABLED) {
  pullStatus();
  window.setInterval(pullStatus, STATUS_POLL_MS);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (error) {
      console.warn('Dee service worker did not register', error);
    });
  });
}

render();
