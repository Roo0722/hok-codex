export const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HoK Codex Admin</title>
<style>
  body { background: #0D0D0D; color: #F0F0F0; font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
  h1 { color: #E7C285; font-size: 20px; margin-top:0; }
  h3 { color: #E7C285; margin-top:0; }
  .card { background: #1A1A1A; border: 1px solid rgba(194,146,76,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  input, textarea, select { width: 100%; box-sizing: border-box; background: #0D0D0D; color: #F0F0F0; border: 1px solid rgba(194,146,76,0.3); border-radius: 6px; padding: 10px; margin-bottom: 10px; font-size: 14px; }
  textarea { min-height: 100px; font-family: inherit; }
  button { background: #C2924C; color: #0D0D0D; border: none; border-radius: 6px; padding: 10px 16px; font-weight: 600; cursor: pointer; font-size: 14px; margin-right: 8px; margin-bottom: 8px; }
  button:disabled { opacity: 0.5; }
  button.secondary { background: transparent; color: #E7C285; border: 1px solid #C2924C; }
  button.danger { background: transparent; color: #F09880; border: 1px solid #E85D3A; }
  .change { border-top: 1px solid rgba(194,146,76,0.1); padding: 8px 0; font-size: 13px; }
  .error { color: #E85D3A; font-size: 13px; }
  .success { color: #4ADE80; font-size: 13px; }
  label { font-size: 12px; color: #999; display: block; margin-bottom: 4px; }
  #gate { max-width: 320px; margin: 80px auto; }
  #app { display: none; max-width: 640px; margin: 0 auto; }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(194,146,76,0.2); }
  .tab { padding: 10px 16px; cursor: pointer; color: #808080; font-size: 14px; border-bottom: 2px solid transparent; }
  .tab.active { color: #E7C285; border-bottom-color: #C2924C; }
  .tabpage { display: none; }
  .tabpage.active { display: block; }
  .buildCard { background: #1A1A1A; border: 1px solid rgba(194,146,76,0.15); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
  .buildCard .name { font-weight: 600; font-size: 14px; }
  .buildCard .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 10px; background: rgba(194,146,76,0.2); color: #E7C285; margin-left: 6px; }
  .buildCard .desc { font-size: 12px; color: #999; margin: 6px 0; }
  .itemChips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .chip { font-size: 11px; background: #2A2A2A; padding: 3px 8px; border-radius: 4px; }
  .slotGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
  .slot { aspect-ratio: 1; background: #2A2A2A; border: 1px dashed rgba(194,146,76,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center; padding: 4px; cursor: pointer; color: #666; position: relative; }
  .slot.filled { border-style: solid; border-color: #C2924C; color: #F0F0F0; background: #1A1A1A; }
  .slot .clearX { position: absolute; top: 2px; right: 4px; color: #E85D3A; font-weight: 700; }
  #itemPicker { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 50; overflow-y: auto; padding: 16px; }
  .itemOption { padding: 10px; border-bottom: 1px solid rgba(194,146,76,0.1); cursor: pointer; font-size: 14px; }
  .itemOption:active { background: #2A2A2A; }
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
  <h1>HoK Codex Admin</h1>
  <div class="tabs">
    <div class="tab active" id="tabPatchesBtn" onclick="switchTab('patches')">Patches</div>
    <div class="tab" id="tabBuildsBtn" onclick="switchTab('builds')">Builds</div>
  </div>

  <div id="tabPatches" class="tabpage active">
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
      <h3>Preview</h3>
      <div id="previewContent"></div>
      <button onclick="confirmPatch()" id="confirmBtn">Confirm and Publish</button>
      <button class="secondary" onclick="discardPreview()">Discard</button>
    </div>

    <p class="error" id="err"></p>
    <p class="success" id="ok"></p>
  </div>

  <div id="tabBuilds" class="tabpage">
    <div class="card">
      <label>Hero</label>
      <select id="heroSelect" onchange="loadBuildsForHero()">
        <option value="">Select a hero...</option>
      </select>
      <button onclick="startNewBuild()" id="addBuildBtn" disabled>Add build</button>
    </div>

    <div id="buildsList"></div>

    <div id="buildEditor" class="card" style="display:none">
      <h3 id="editorTitle">New build</h3>
      <label>Build name</label>
      <input type="text" id="buildName" placeholder="e.g. Full Tank">
      <label>Badge (optional)</label>
      <input type="text" id="buildBadge" placeholder="e.g. Safe Default">
      <label>Description (optional)</label>
      <textarea id="buildDesc" placeholder="When to use this build..."></textarea>
      <label>Items (tap a slot to pick or clear)</label>
      <div class="slotGrid" id="slotGrid"></div>
      <button onclick="saveBuild()" id="saveBuildBtn">Save build</button>
      <button class="secondary" onclick="cancelEdit()">Cancel</button>
      <p class="error" id="buildErr"></p>
      <p class="success" id="buildOk"></p>
    </div>
  </div>
</div>

<div id="itemPicker">
  <button class="secondary" onclick="closeItemPicker()">Close</button>
  <input type="text" id="itemSearch" placeholder="Search items..." oninput="filterItemPicker()" style="margin-top:10px">
  <div id="itemOptions"></div>
</div>

<script>
  let password = "";
  let currentPreview = null;
  const WORKER_BASE = window.location.origin;

  let allItems = [];
  let currentHero = "";
  let currentBuildId = null;
  let slots = new Array(12).fill(null);
  let activeSlotIndex = null;

  function unlock() {
    password = document.getElementById("pw").value;
    if (!password) return;
    document.getElementById("gate").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadHeroes();
    loadItems();
  }

  function switchTab(tab) {
    document.getElementById("tabPatches").classList.toggle("active", tab === "patches");
    document.getElementById("tabBuilds").classList.toggle("active", tab === "builds");
    document.getElementById("tabPatchesBtn").classList.toggle("active", tab === "patches");
    document.getElementById("tabBuildsBtn").classList.toggle("active", tab === "builds");
  }

  // ---------- Patches tab (unchanged behavior) ----------

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
        html += "<div class='change'><b>" + escapeHtml(c.entityName) + "</b> " + escapeHtml(c.fieldChanged) +
          "<br>" + escapeHtml(c.oldValue || "") + " to " + escapeHtml(c.newValue || "") + "</div>";
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

  // ---------- Builds tab ----------

  async function loadHeroes() {
    try {
      const res = await fetch(WORKER_BASE + "/api/heroes");
      const heroes = await res.json();
      const sel = document.getElementById("heroSelect");
      heroes.forEach(function(h) {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        sel.appendChild(opt);
      });
    } catch (e) {}
  }

  async function loadItems() {
    try {
      const res = await fetch(WORKER_BASE + "/api/items");
      allItems = await res.json();
    } catch (e) {}
  }

  async function loadBuildsForHero() {
    currentHero = document.getElementById("heroSelect").value;
    document.getElementById("addBuildBtn").disabled = !currentHero;
    document.getElementById("buildEditor").style.display = "none";
    const listEl = document.getElementById("buildsList");
    listEl.innerHTML = "";
    if (!currentHero) return;

    try {
      const res = await fetch(WORKER_BASE + "/api/builds?hero=" + encodeURIComponent(currentHero));
      const builds = await res.json();
      if (builds.length === 0) {
        listEl.innerHTML = "<p style='color:#808080;font-size:13px'>No builds yet for " + escapeHtml(currentHero) + ".</p>";
        return;
      }
      builds.forEach(function(b) {
        const div = document.createElement("div");
        div.className = "buildCard";
        const chips = (b.items || []).filter(function(i) { return i; }).map(function(i) {
          return "<span class='chip'>" + escapeHtml(i.name) + "</span>";
        }).join("");
        div.innerHTML =
          "<div class='name'>" + escapeHtml(b.buildName) + (b.badge ? "<span class='badge'>" + escapeHtml(b.badge) + "</span>" : "") + "</div>" +
          (b.description ? "<div class='desc'>" + escapeHtml(b.description) + "</div>" : "") +
          "<div class='itemChips'>" + chips + "</div>" +
          "<button class='secondary' onclick='editBuild(" + JSON.stringify(b.buildId) + ")'>Edit</button>" +
          "<button class='danger' onclick='deleteBuildConfirm(" + JSON.stringify(b.buildId) + ")'>Delete</button>";
        listEl.appendChild(div);
        div._buildData = b;
      });
      window._currentBuilds = builds;
    } catch (e) {
      listEl.innerHTML = "<p class='error'>Failed to load builds.</p>";
    }
  }

  function startNewBuild() {
    currentBuildId = null;
    slots = new Array(12).fill(null);
    document.getElementById("editorTitle").textContent = "New build for " + currentHero;
    document.getElementById("buildName").value = "";
    document.getElementById("buildBadge").value = "";
    document.getElementById("buildDesc").value = "";
    document.getElementById("buildErr").textContent = "";
    document.getElementById("buildOk").textContent = "";
    renderSlots();
    document.getElementById("buildEditor").style.display = "block";
  }

  function editBuild(buildId) {
    const b = (window._currentBuilds || []).find(function(x) { return x.buildId === buildId; });
    if (!b) return;
    currentBuildId = buildId;
    slots = (b.items || []).slice(0, 12);
    while (slots.length < 12) slots.push(null);
    document.getElementById("editorTitle").textContent = "Edit build";
    document.getElementById("buildName").value = b.buildName || "";
    document.getElementById("buildBadge").value = b.badge || "";
    document.getElementById("buildDesc").value = b.description || "";
    document.getElementById("buildErr").textContent = "";
    document.getElementById("buildOk").textContent = "";
    renderSlots();
    document.getElementById("buildEditor").style.display = "block";
  }

  function cancelEdit() {
    document.getElementById("buildEditor").style.display = "none";
  }

  function renderSlots() {
    const grid = document.getElementById("slotGrid");
    grid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const s = slots[i];
      const div = document.createElement("div");
      div.className = "slot" + (s ? " filled" : "");
      div.textContent = s ? s.name : String(i + 1);
      div.onclick = (function(idx) { return function() { onSlotClick(idx); }; })(i);
      if (s) {
        const x = document.createElement("span");
        x.className = "clearX";
        x.textContent = "x";
        x.onclick = (function(idx) { return function(ev) { ev.stopPropagation(); slots[idx] = null; renderSlots(); }; })(i);
        div.appendChild(x);
      }
      grid.appendChild(div);
    }
  }

  function onSlotClick(idx) {
    activeSlotIndex = idx;
    openItemPicker();
  }

  function openItemPicker() {
    document.getElementById("itemPicker").style.display = "block";
    document.getElementById("itemSearch").value = "";
    renderItemOptions(allItems);
  }

  function closeItemPicker() {
    document.getElementById("itemPicker").style.display = "none";
    activeSlotIndex = null;
  }

  function filterItemPicker() {
    const q = document.getElementById("itemSearch").value.toLowerCase();
    const filtered = allItems.filter(function(it) { return it.name.toLowerCase().includes(q); });
    renderItemOptions(filtered);
  }

  function renderItemOptions(items) {
    const el = document.getElementById("itemOptions");
    el.innerHTML = "";
    items.forEach(function(it) {
      const div = document.createElement("div");
      div.className = "itemOption";
      div.textContent = it.name + " (" + it.price + "g)";
      div.onclick = function() {
        if (activeSlotIndex !== null) {
          slots[activeSlotIndex] = { id: it.itemId, name: it.name };
          renderSlots();
        }
        closeItemPicker();
      };
      el.appendChild(div);
    });
  }

  async function saveBuild() {
    const buildName = document.getElementById("buildName").value.trim();
    if (!buildName) {
      document.getElementById("buildErr").textContent = "Build name is required.";
      return;
    }
    document.getElementById("saveBuildBtn").disabled = true;
    try {
      const res = await fetch(WORKER_BASE + "/api/admin/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": password },
        body: JSON.stringify({
          buildId: currentBuildId || undefined,
          heroName: currentHero,
          buildName: buildName,
          badge: document.getElementById("buildBadge").value.trim() || undefined,
          description: document.getElementById("buildDesc").value.trim() || undefined,
          items: slots
        })
      });
      const data = await res.json();
      if (res.status === 401) {
        document.getElementById("buildErr").textContent = "Wrong password.";
        return;
      }
      document.getElementById("buildOk").textContent = "Saved.";
      document.getElementById("buildErr").textContent = "";
      loadBuildsForHero();
      setTimeout(function() { document.getElementById("buildEditor").style.display = "none"; }, 600);
    } catch (e) {
      document.getElementById("buildErr").textContent = "Save failed: " + e;
    } finally {
      document.getElementById("saveBuildBtn").disabled = false;
    }
  }

  async function deleteBuildConfirm(buildId) {
    if (!confirm("Delete this build?")) return;
    try {
      await fetch(WORKER_BASE + "/api/admin/builds?id=" + encodeURIComponent(buildId), {
        method: "DELETE",
        headers: { "X-Admin-Password": password }
      });
      loadBuildsForHero();
    } catch (e) {}
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function(m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
</script>

</body>
</html>`;
