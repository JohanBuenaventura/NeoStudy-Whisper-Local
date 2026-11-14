(() => {
  if (window.__neoWhisperInstalled) return;
  window.__neoWhisperInstalled = true;

  const style = document.createElement("style");
  style.textContent = `
  #nwh-panel{position:fixed;right:18px;bottom:18px;width:330px;max-height:65vh;z-index:2147483647;
    background:#171923;color:#f5f5f5;border:1px solid #45495a;border-radius:12px;
    box-shadow:0 8px 28px #0008;font:13px Arial,sans-serif;display:flex;flex-direction:column}
  #nwh-head{padding:11px 13px;display:flex;justify-content:space-between;align-items:center;background:#24283a;border-radius:12px 12px 0 0}
  #nwh-body{padding:12px;overflow:auto}
  #nwh-panel button,#nwh-panel select{background:#30364a;color:white;border:1px solid #596078;border-radius:6px;padding:8px;cursor:pointer}
  #nwh-panel button{width:100%;margin:5px 0}
  #nwh-transcript{white-space:pre-wrap;background:#10131c;border:1px solid #34394a;border-radius:7px;
    padding:9px;min-height:100px;max-height:230px;overflow:auto;line-height:1.5}
  #nwh-status{color:#b8c7ed;margin:8px 0}
  `;
  document.documentElement.appendChild(style);

  const panel = document.createElement("section");
  panel.id = "nwh-panel";
  panel.innerHTML = `
    <div id="nwh-head"><strong>NeoStudy Helper · Local Whisper</strong><button id="nwh-hide" style="width:auto">−</button></div>
    <div id="nwh-body">
      <label>Video speed </label>
      <select id="nwh-speed">
        <option value="1">1×</option><option value="1.25">1.25×</option>
        <option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2" selected>2×</option>
      </select>
      <div id="nwh-status">Checking local Whisper server…</div>
      <p><b>Live transcript</b></p>
      <div id="nwh-transcript">Start the local server, then click the extension icon in the browser toolbar to capture this tab's audio.</div>
      <button id="nwh-copy">Copy transcript</button>
      <button id="nwh-save">Download transcript (.txt)</button>
    </div>`;
  document.body.appendChild(panel);

  const transcript = panel.querySelector("#nwh-transcript");
  const status = panel.querySelector("#nwh-status");
  let hidden = false;
  let speed = 2;
  let lastText = "";

  function applySpeed() {
    document.querySelectorAll("video").forEach(v => {
      v.playbackRate = speed;
      v.defaultPlaybackRate = speed;
    });
  }
  panel.querySelector("#nwh-speed").addEventListener("change", e => {
    speed = Number(e.target.value); applySpeed();
  });
  new MutationObserver(applySpeed).observe(document.body, {childList:true,subtree:true});
  document.addEventListener("loadedmetadata", e => {
    if (e.target instanceof HTMLVideoElement) applySpeed();
  }, true);
  applySpeed();

  panel.querySelector("#nwh-hide").addEventListener("click", () => {
    hidden = !hidden;
    panel.querySelector("#nwh-body").style.display = hidden ? "none" : "block";
    panel.querySelector("#nwh-hide").textContent = hidden ? "+" : "−";
  });

  async function checkServer() {
    try {
      const r = await fetch("http://127.0.0.1:8765/health");
      const data = await r.json();
      status.textContent = data.ready ? `Local Whisper ready · ${data.model}` : "Local server is starting…";
    } catch {
      status.textContent = "Local Whisper offline. Start start-whisper.bat first.";
    }
  }
  checkServer();

  async function refreshTranscript() {
    try {
      const r = await fetch("http://127.0.0.1:8765/transcript");
      if (!r.ok) return;
      const data = await r.json();
      if (data.text && data.text !== lastText) {
        lastText = data.text;
        transcript.textContent = lastText;
        transcript.scrollTop = transcript.scrollHeight;
      }
    } catch {}
  }
  setInterval(refreshTranscript, 1500);

  panel.querySelector("#nwh-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(transcript.textContent); status.textContent = "Transcript copied."; }
    catch { status.textContent = "Copy failed; select the transcript manually."; }
  });
  panel.querySelector("#nwh-save").addEventListener("click", () => {
    const blob = new Blob([transcript.textContent], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="neostudy-transcript.txt"; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === "CAPTURE_STATE") {
      status.textContent = msg.active ? "Capturing tab audio…" : "Capture stopped.";
    }
  });
})();