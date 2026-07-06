export const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HoK Codex — Patch Admin</title>
<style>
  body { background: #0D0D0D; color: #F0F0F0; font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
  h1 { color: #E7C285; font-size: 20px; }
  .card { background: #1A1A1A; border: 1px solid rgba(194,146,76,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  input, textarea { width: 100%; box-sizing: border-box; background: #0D0D0D; color: #F0F0F0; border: 1px solid rgba(194,146,76,0.3); border-radius: 6px; padding: 10px; margin-bottom: 10px; font-size: 14px; }
  textarea { min-height: 120px; font-family: inherit; }
  button { background: #C2924C; color: #0D0D0D; border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; cursor: pointer; font-size: 14px; }
  button:disabled { opacity: 0.5; }
  button.secondary { background: transparent; color: #E7C285; border: 1px solid #C2924C; }
  .change { border-top: 1px solid rgba(194,146,76,0.1); padding: 8px 0; font-size: 13px; }
  .error { color: #E85D3A; font-size: 13px; }
  .success { color: #4ADE80; font-size: 13px; }
  label { font-size: 12px; color: #999; display: block; margin-bottom: 4px; }
  #gate { max-width: 320px; margin: 80px auto; }
  #app { display: none; max-width: 600px; margin: 0 auto; }
</style>
</head>
<body>

<div id="gate">
  <h1>HoK Codex Admin</h1>
  <div class="card">
    <label>Password</label>
    <input type="password" id="pw" onkeydown="if(event.key==='Enter') unlock()">
    <button onclick="unlock()">Unlock</button>
    <p class="error" id="gateError"></p>
  </div>
</div>

<div id="app">
  <h1>Patch Admin</h1>
  <div class="card">
    <label>Patch version / season (e.g. S15) — optional but recommended</label>
    <input type="text" id="version" placeholder="S15">
    <label>Source URL (optional)</label>
    <input type="text" id="url" placeholder="https://...">
    <label>Or paste text directly (optional)</label>
    <textarea id="text" placeholder="Paste patch notes text here..."></textarea>
    <button onclick="analyze()" id="analyzeBtn">Analyze</button>
  </div>

  <div id="previewCard" class="card" style="display:none">
    <h3 style="color:#E7C285;margin-top:0">Preview</h3>
    <div id="previewContent"></div>
    <button onclick="confirmPatch()" id="confirmBtn">Confirm and Publish</button>
    <button class="secondary" onclick="discardPreview()">Discard</button>
  </div>

  <p class="error" id="err"></p>
  <p class="success" id="ok"></p>
</div>

<script>
  let password = "";
  let currentPreview = null;
  const WORKER_BASE = window.location.origin;

  function unlock() {
    password = document.getElementById("pw").value;
    if (!password) return;
    document.getElementById("gate").style.display = "none";
    document.getElementById("app").style.display = "block";
  }

  async function analyze() {
    const version = document.getElementById("version").value.trim();
    const url = document.getElementById("url").value.trim();
    const text = document.getElementById("text").value.trim();
    document.getElementById("err").textContent = "";
    document.getElementById("ok").textContent = "";
    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("analyzeBtn").textContent = "Analyzing...";

    try {
      const res = await fetch(WORKER_BASE + "/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": password },
        body: JSON.stringify({ url: url || undefined, text: text || undefined, versionHint: version || undefined })
      });
      const data = await res.json();
      if (res.status === 401) {
        document.getElementById("err").textContent = "Wrong password.";
        document.getElementById("gate").style.display = "block";
        document.getElementById("app").style.display = "none";
        return;
      }
      if (data.error || !data.preview) {
        document.getElementById("err").textContent = data.error || "No patch could be identified from this content.";
        document.getElementById("previewCard").style.display = "none";
        return;
      }
      currentPreview = data.preview;
      renderPreview(data.preview);
    } catch (e) {
      document.getElementById("err").textContent = "Request failed: " + e;
    } finally {
      document.getElementById("analyzeBtn").disabled = false;
      document.getElementById("analyzeBtn").textContent = "Analyze";
    }
  }

  function renderPreview(p) {
    const el = document.getElementById("previewContent");
    let html = "<p><b>Version:</b> " + escapeHtml(p.patchVersion) + "</p>";
    html += "<p><b>Date:</b> " + escapeHtml(p.releaseDate) + "</p>";
    html += "<p><b>Summary:</b> " + escapeHtml(p.rawSummary) + "</p>";
    if (p.structuredChanges && p.structuredChanges.length) {
      html += "<p><b>Changes (" + p.structuredChanges.length + "):</b></p>";
      for (const c of p.structuredChanges) {
        html += "<div class='change'><b>" + escapeHtml(c.entityName) + "</b> · " + escapeHtml(c.fieldChanged) +
          "<br>" + escapeHtml(c.oldValue || "") + " &rarr; " + escapeHtml(c.newValue || "") + "</div>";
      }
    } else {
      html += "<p>No itemized changes extracted.</p>";
    }
    el.innerHTML = html;
    document.getElementById("previewCard").style.display = "block";
  }

  function discardPreview() {
    currentPreview = null;
    document.getElementById("previewCard").style.display = "none";
  }

  async function confirmPatch() {
    if (!currentPreview) return;
    document.getElementById("confirmBtn").disabled = true;
    document.getElementById("confirmBtn").textContent = "Publishing...";
    try {
      const res = await fetch(WORKER_BASE + "/api/admin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": password },
        body: JSON.stringify(currentPreview)
      });
      const data = await res.json();
      if (data.patchId) {
        document.getElementById("ok").textContent = "Published as " + data.patchId;
        document.getElementById("err").textContent = "";
        discardPreview();
        document.getElementById("url").value = "";
        document.getElementById("text").value = "";
      } else {
        document.getElementById("err").textContent = data.error || "Failed to publish.";
      }
    } catch (e) {
      document.getElementById("err").textContent = "Request failed: " + e;
    } finally {
      document.getElementById("confirmBtn").disabled = false;
      document.getElementById("confirmBtn").textContent = "Confirm and Publish";
    }
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
</script>

</body>
</html>`;
