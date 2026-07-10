// ============ Настройки ============
// Секрет делает ID непубличными: посторонний не сможет позвонить, не зная его.
const SECRET = "vq7k2rp9";

const FAMILY = {
  egor:     { name: "Егор",    emoji: "🧑‍💻" },
  mama:     { name: "Мама",     emoji: "👩" },
  babushka: { name: "Бабушка",  emoji: "👵" },
};

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: [
        "turn:staticauth.openrelay.metered.ca:80",
        "turn:staticauth.openrelay.metered.ca:443",
        "turn:staticauth.openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const peerId = (role) => `zvonok-${SECRET}-${role}`;
const roleFromId = (id) => id.split("-").pop();

// ============ Состояние ============
let myRole = null;
let peer = null;
let localStream = null;
let activeCall = null;      // MediaConnection во время разговора/вызова
let incomingCall = null;    // ждущий ответа входящий
let facingMode = "user";
let callTimerInt = null;
let outgoingTimeout = null;
let wakeLock = null;
let ringer = null;
let presenceInt = null;
const online = {};          // role -> bool

// ============ Утилиты UI ============
const $ = (id) => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
}

let toastTimeout = null;
function toast(msg, ms = 3500) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove("show"), ms);
}

// ============ Звук звонка (WebAudio) ============
function makeRinger(incoming) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let stopped = false;
  let vibeInt = null;

  function beep(when, freq, dur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.4, when + 0.03);
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(ctx.destination);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  function cycle() {
    if (stopped) return;
    const t = ctx.currentTime;
    if (incoming) {
      // Трель как у телефона
      beep(t, 880, 0.35); beep(t + 0.45, 880, 0.35);
    } else {
      // Длинные гудки
      beep(t, 425, 1.0);
    }
    setTimeout(cycle, incoming ? 2000 : 4000);
  }

  ctx.resume().then(cycle).catch(() => {});
  if (incoming && navigator.vibrate) {
    navigator.vibrate([400, 200, 400]);
    vibeInt = setInterval(() => navigator.vibrate([400, 200, 400]), 2000);
  }

  return {
    stop() {
      stopped = true;
      clearInterval(vibeInt);
      if (navigator.vibrate) navigator.vibrate(0);
      ctx.close().catch(() => {});
    },
  };
}

function stopRinger() {
  if (ringer) { ringer.stop(); ringer = null; }
}

// ============ Медиа ============
async function getMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    return localStream;
  } catch (e) {
    toast("Нет доступа к камере или микрофону. Разрешите доступ в настройках браузера.");
    throw e;
  }
}

function stopMedia() {
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
}

async function requestWakeLock() {
  try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

// ============ Peer / соединение ============
function setConnStatus(state) {
  const el = $("conn-status");
  el.classList.remove("ok", "bad");
  if (state === "ok") { el.textContent = "На связи"; el.classList.add("ok"); }
  else if (state === "bad") { el.textContent = "Нет связи"; el.classList.add("bad"); }
  else { el.textContent = "Подключение…"; }
}

function initPeer() {
  peer = new Peer(peerId(myRole), { config: ICE_CONFIG, debug: 1 });

  peer.on("open", () => {
    setConnStatus("ok");
    checkPresence();
  });

  peer.on("call", (call) => {
    if (activeCall || incomingCall) {
      call.close(); // уже разговариваем — занято
      return;
    }
    incomingCall = call;
    const from = (call.metadata && call.metadata.from) || roleFromId(call.peer);
    const info = FAMILY[from] || { name: "Свои", emoji: "📞" };
    $("in-emoji").textContent = info.emoji;
    $("in-name").textContent = info.name;
    showScreen("incoming");
    stopRinger();
    ringer = makeRinger(true);
    call.on("close", () => {
      // звонящий отменил вызов
      if (incomingCall === call) {
        incomingCall = null;
        stopRinger();
        showScreen("home");
        toast("Звонок отменён");
      }
    });
  });

  // Входящие data-соединения — проверка «в сети» от других
  peer.on("connection", (conn) => {
    conn.on("open", () => setTimeout(() => conn.close(), 500));
  });

  peer.on("disconnected", () => {
    setConnStatus("wait");
    setTimeout(() => { if (peer && !peer.destroyed) peer.reconnect(); }, 1000);
  });

  peer.on("error", (err) => {
    if (err.type === "peer-unavailable") {
      const role = roleFromId(String(err).match(/zvonok-[\w]+-(\w+)/)?.[0] || "");
      if (role && FAMILY[role]) { online[role] = false; renderContacts(); }
      // если мы в состоянии исходящего вызова к недоступному — сообщаем
      if ($("screen-outgoing").classList.contains("active")) {
        cancelOutgoing(false);
        toast("Не в сети. Попросите открыть приложение «Звонок домой».", 5000);
      }
    } else if (err.type === "unavailable-id") {
      setConnStatus("bad");
      toast("Приложение уже открыто на другом устройстве или в другой вкладке.", 6000);
    } else if (["network", "server-error", "socket-error", "socket-closed"].includes(err.type)) {
      setConnStatus("bad");
    }
  });
}

// Проверка, кто в сети: пробуем открыть data-соединение
function checkPresence() {
  if (!peer || peer.disconnected) return;
  Object.keys(FAMILY).filter((r) => r !== myRole).forEach((role) => {
    const conn = peer.connect(peerId(role));
    if (!conn) return;
    const timer = setTimeout(() => { try { conn.close(); } catch (e) {} }, 4000);
    conn.on("open", () => {
      clearTimeout(timer);
      online[role] = true;
      renderContacts();
      setTimeout(() => { try { conn.close(); } catch (e) {} }, 300);
    });
  });
}

// ============ Контакты ============
function renderContacts() {
  const box = $("contact-buttons");
  box.innerHTML = "";
  Object.entries(FAMILY)
    .filter(([role]) => role !== myRole)
    .forEach(([role, info]) => {
      const btn = document.createElement("button");
      const isOn = !!online[role];
      btn.className = "contact-btn" + (isOn ? "" : " offline");
      btn.innerHTML = `
        <span class="emoji">${info.emoji}</span>
        <span class="label">
          <span class="name">${info.name}</span>
          <span class="status">${isOn ? "в сети — можно звонить" : "сейчас не в сети"}</span>
        </span>
        <span class="phone-ico">📞</span>`;
      btn.onclick = () => startCall(role);
      box.appendChild(btn);
    });
}

// ============ Исходящий звонок ============
async function startCall(role) {
  if (!peer || peer.disconnected) { toast("Нет связи с сервером. Проверьте интернет."); return; }
  const info = FAMILY[role];
  try { await getMedia(); } catch (e) { return; }

  $("out-emoji").textContent = info.emoji;
  $("out-name").textContent = info.name;
  showScreen("outgoing");
  stopRinger();
  ringer = makeRinger(false);
  requestWakeLock();

  activeCall = peer.call(peerId(role), localStream, { metadata: { from: myRole } });

  outgoingTimeout = setTimeout(() => {
    cancelOutgoing(false);
    toast(`${info.name} не отвечает. Попробуйте позже.`, 5000);
  }, 45000);

  activeCall.on("stream", (remote) => onCallConnected(role, remote));
  activeCall.on("close", () => endCall(false));
  activeCall.on("error", () => endCall(false));
}

function cancelOutgoing(showHomeToast = true) {
  clearTimeout(outgoingTimeout);
  stopRinger();
  if (activeCall) { try { activeCall.close(); } catch (e) {} activeCall = null; }
  stopMedia();
  releaseWakeLock();
  showScreen("home");
  if (showHomeToast) toast("Звонок отменён");
}

// ============ Входящий: ответ / отклонение ============
async function answerCall() {
  if (!incomingCall) return;
  stopRinger();
  const call = incomingCall;
  incomingCall = null;
  try { await getMedia(); } catch (e) { try { call.close(); } catch (_) {} showScreen("home"); return; }
  activeCall = call;
  requestWakeLock();
  call.answer(localStream);
  const from = (call.metadata && call.metadata.from) || roleFromId(call.peer);
  call.on("stream", (remote) => onCallConnected(from, remote));
  call.on("close", () => endCall(false));
  call.on("error", () => endCall(false));
}

function declineCall() {
  stopRinger();
  if (incomingCall) { try { incomingCall.close(); } catch (e) {} incomingCall = null; }
  showScreen("home");
}

// ============ Разговор ============
function onCallConnected(role, remoteStream) {
  clearTimeout(outgoingTimeout);
  stopRinger();
  const info = FAMILY[role] || { name: "Свои" };
  $("call-peer-name").textContent = info.name;
  $("remote-video").srcObject = remoteStream;
  $("local-video").srcObject = localStream;
  // сбрасываем кнопки в исходное
  $("btn-mute").classList.remove("off");
  $("btn-cam").classList.remove("off");
  showScreen("call");

  const started = Date.now();
  clearInterval(callTimerInt);
  callTimerInt = setInterval(() => {
    const s = Math.floor((Date.now() - started) / 1000);
    $("call-timer").textContent =
      String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 1000);
}

function endCall(closeConn = true) {
  clearTimeout(outgoingTimeout);
  clearInterval(callTimerInt);
  stopRinger();
  if (activeCall) {
    const c = activeCall;
    activeCall = null;
    if (closeConn) { try { c.close(); } catch (e) {} }
  }
  $("remote-video").srcObject = null;
  $("local-video").srcObject = null;
  stopMedia();
  releaseWakeLock();
  if (!$("screen-home").classList.contains("active")) {
    showScreen("home");
    toast("Звонок завершён");
  }
  checkPresence();
}

// ============ Кнопки управления ============
function toggleMute() {
  if (!localStream) return;
  const track = localStream.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  $("btn-mute").classList.toggle("off", !track.enabled);
  toast(track.enabled ? "Микрофон включён" : "Микрофон выключен", 1500);
}

function toggleCam() {
  if (!localStream) return;
  const track = localStream.getVideoTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  $("btn-cam").classList.toggle("off", !track.enabled);
  toast(track.enabled ? "Камера включена" : "Камера выключена", 1500);
}

async function flipCamera() {
  if (!activeCall || !localStream) return;
  facingMode = facingMode === "user" ? "environment" : "user";
  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    const newTrack = newStream.getVideoTracks()[0];
    const sender = activeCall.peerConnection
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");
    if (sender) await sender.replaceTrack(newTrack);
    const oldTrack = localStream.getVideoTracks()[0];
    if (oldTrack) { localStream.removeTrack(oldTrack); oldTrack.stop(); }
    localStream.addTrack(newTrack);
    $("local-video").srcObject = localStream;
  } catch (e) {
    facingMode = facingMode === "user" ? "environment" : "user";
    toast("Не удалось переключить камеру");
  }
}

// ============ Выбор роли и запуск ============
function renderSetup() {
  const box = $("setup-buttons");
  box.innerHTML = "";
  Object.entries(FAMILY).forEach(([role, info]) => {
    const btn = document.createElement("button");
    btn.className = "setup-btn";
    btn.innerHTML = `<span class="emoji">${info.emoji}</span> Я — ${info.name}`;
    btn.onclick = () => { localStorage.setItem("zvonok-role", role); boot(role); };
    box.appendChild(btn);
  });
}

function boot(role) {
  myRole = role;
  const info = FAMILY[role];
  $("me-badge").textContent = `${info.emoji} ${info.name}`;
  renderContacts();
  showScreen("home");
  initPeer();
  clearInterval(presenceInt);
  presenceInt = setInterval(checkPresence, 12000);
}

function main() {
  // ссылка вида ?ya=mama сама настраивает телефон
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get("ya");
  if (fromUrl && FAMILY[fromUrl]) {
    localStorage.setItem("zvonok-role", fromUrl);
    history.replaceState(null, "", location.pathname);
  }
  const saved = localStorage.getItem("zvonok-role");
  if (saved && FAMILY[saved]) boot(saved);
  else { renderSetup(); showScreen("setup"); }

  $("btn-cancel-call").onclick = () => cancelOutgoing();
  $("btn-answer").onclick = answerCall;
  $("btn-decline").onclick = declineCall;
  $("btn-hangup").onclick = () => endCall(true);
  $("btn-mute").onclick = toggleMute;
  $("btn-cam").onclick = toggleCam;
  $("btn-flip").onclick = flipCamera;

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && peer && peer.disconnected && !peer.destroyed) peer.reconnect();
    if (!document.hidden && activeCall) requestWakeLock();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

main();
