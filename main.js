const app = require("premierepro");
const fs = require("uxp").storage.localFileSystem;
const $ = (id) => document.getElementById(id);
let styles = [];
let lastAudioUrl = null;
let lastPreviewFile = null;
let connected = false;
let activeSlider = null;

function sliderValue(id) { return Number($(`${id}Out`).textContent); }
function setSliderValue(control, value) {
  const min = Number(control.dataset.min), max = Number(control.dataset.max), step = Number(control.dataset.step);
  const precision = Number(control.dataset.precision);
  const snapped = Math.max(min, Math.min(max, min + Math.round((Number(value) - min) / step) * step));
  const normalized = Number(snapped.toFixed(precision));
  const percent = ((normalized - min) / (max - min)) * 100;
  control.dataset.value = String(normalized);
  const slider = control.querySelector(".slider");
  slider.setAttribute("aria-valuenow", String(normalized));
  slider.querySelector(".slider-fill").style.width = `${percent}%`;
  slider.querySelector(".slider-thumb").style.left = `${percent}%`;
  $(`${control.dataset.id}Out`).textContent = normalized.toFixed(precision);
}
function editSliderValue(control) {
  const output = $(`${control.dataset.id}Out`);
  const heading = output.parentNode;
  if (heading.querySelector(".value-edit")) return;
  const input = document.createElement("input");
  input.type = "number";
  input.className = "value-edit";
  input.min = control.dataset.min;
  input.max = control.dataset.max;
  input.step = control.dataset.step;
  input.value = control.dataset.value;
  input.setAttribute("aria-label", `${control.querySelector(".slider").getAttribute("aria-label")}の数値`);
  output.style.display = "none";
  heading.insertBefore(input, output);
  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    if (commit && input.value !== "") setSliderValue(control, Number(input.value));
    input.remove();
    output.style.display = "";
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); finish(true); }
    else if (event.key === "Escape") { event.preventDefault(); finish(false); }
  });
  input.addEventListener("blur", () => finish(true));
  input.focus();
  input.select();
}
function updateSliderFromMouse(control, clientX) {
  const slider = control.querySelector(".slider");
  $(`${control.dataset.id}Out`).addEventListener("dblclick", () => editSliderValue(control));
  const rect = slider.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const min = Number(control.dataset.min), max = Number(control.dataset.max);
  setSliderValue(control, min + ratio * (max - min));
}
function sliderMouseMove(event) {
  if (activeSlider) updateSliderFromMouse(activeSlider, event.clientX);
}
function sliderMouseUp() {
  activeSlider = null;
  document.removeEventListener("mousemove", sliderMouseMove);
  document.removeEventListener("mouseup", sliderMouseUp);
}

function base() {
  const raw = $("baseUrl").value.trim().replace(/\/$/, "");
  const url = new URL(raw);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "50021" || url.username || url.password) {
    throw new Error("Engine URLは http://127.0.0.1:50021 または http://localhost:50021 のみ利用できます");
  }
  return url.origin;
}
function status(message, kind = "") { $("status").textContent = message; $("status").className = `status ${kind}`; }
function currentStyle() { return styles.find((s) => String(s.id) === $("style").value); }
function setBusy(busy) { $("connect").disabled = busy; $("preview").disabled = busy || !connected; $("generate").disabled = busy || !connected; }

async function loadSpeakers() {
  const response = await fetch(`${base()}/speakers`);
  if (!response.ok) throw new Error(`/speakers: HTTP ${response.status}`);
  const speakers = await response.json();
  styles = speakers.flatMap((speaker) => (speaker.styles || []).map((style) => ({
    id: style.id, name: style.name, speakerName: speaker.name, speakerUuid: speaker.speaker_uuid
  })));
  const speakerNames = [...new Set(styles.map((s) => s.speakerName))];
  $("speaker").innerHTML = speakerNames.map((name) => `<option>${escapeHtml(name)}</option>`).join("");
  updateStyles();
}
function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function updateStyles() {
  const speakerName = $("speaker").value;
  const choices = styles.filter((s) => s.speakerName === speakerName);
  $("style").innerHTML = choices.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
}
async function connect() {
  setBusy(true); status("VOICEVOXに接続中…");
  try { await loadSpeakers(); connected = true; status(`接続しました（${styles.length}スタイル）`, "ok"); }
  catch (error) { connected = false; status(`接続できません: ${error.message} — VOICEVOX本体とEngine APIを確認してください`, "error"); }
  finally { setBusy(false); }
}
function settings() {
  const style = currentStyle();
  if (!style) throw new Error("話者スタイルを選択してください");
  const text = $("text").value.trim();
  if (!text) throw new Error("読み上げテキストを入力してください");
  return { text, style, speed: sliderValue("speed"), pitch: sliderValue("pitch"),
    intonation: sliderValue("intonation"), volume: sliderValue("volume"),
    preSilence: Math.max(0, +$("preSilence").value || 0), postSilence: Math.max(0, +$("postSilence").value || 0) };
}
async function synthesize() {
  const cfg = settings();
  const queryResponse = await fetch(`${base()}/audio_query?text=${encodeURIComponent(cfg.text)}&speaker=${cfg.style.id}`, { method: "POST" });
  if (!queryResponse.ok) throw new Error(`音声クエリ: HTTP ${queryResponse.status}`);
  const query = await queryResponse.json();
  query.speedScale = cfg.speed; query.pitchScale = cfg.pitch;
  query.intonationScale = cfg.intonation; query.volumeScale = cfg.volume;
  query.prePhonemeLength = cfg.preSilence; query.postPhonemeLength = cfg.postSilence;
  const audioResponse = await fetch(`${base()}/synthesis?speaker=${cfg.style.id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(query)
  });
  if (!audioResponse.ok) throw new Error(`音声合成: HTTP ${audioResponse.status}`);
  return await audioResponse.blob();
}
async function preview() {
  setBusy(true); status("音声を生成しています…");
  try {
    const blob = await synthesize();
    const player = $("player");
    player.pause();
    player.removeAttribute("src");
    player.load();
    if (lastAudioUrl) { URL.revokeObjectURL(lastAudioUrl); lastAudioUrl = null; }
    const tempFolder = await fs.getTemporaryFolder();
    const tempFile = await tempFolder.createFile(`VOX_preview_${Date.now()}.wav`, { overwrite: true });
    await tempFile.write(await blob.arrayBuffer());
    lastPreviewFile = tempFile;
    player.src = tempFile.url;
    player.muted = false;
    player.volume = 1;
    player.load();
    $("previewPlayer").style.display = "block";
    status("試聴音声を読み込みました。自動再生を試しています。聞こえない場合は「▶ 再生」を押してください", "ok");
    try {
      const playback = player.play();
      if (playback && typeof playback.catch === "function") playback.catch((error) => status(`自動再生できませんでした。「▶ 再生」を押してください: ${error.message}`, "error"));
    } catch (playError) {
      status(`自動再生できませんでした。「▶ 再生」を押してください: ${playError.message}`, "error");
    }
  } catch (error) { status(error.message, "error"); }
  finally { setBusy(false); }
}
async function saveAndImport(blob) {
  const folder = await fs.getFolder();
  if (!folder) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = await folder.createFile(`VOICEVOX_${stamp}.wav`, { overwrite: true });
  await file.write(await blob.arrayBuffer());
  const project = await app.Project.getActiveProject();
  if (!project) throw new Error("Premiereでプロジェクトを開いてください");
  const targetBin = await project.getInsertionBin();
  const imported = await project.importFiles([file.nativePath], true, targetBin, false);
  if (!imported) throw new Error("Premiereプロジェクトへの読み込みに失敗しました");
  const sequence = await project.getActiveSequence();
  if (!sequence) return { file, placed: false, reason: "アクティブシーケンスがありません" };
  const root = await project.getRootItem();
  const item = await findItem(root, file.name);
  if (!item) return { file, placed: false, reason: "読み込み済み音声を特定できませんでした" };
  const time = await sequence.getPlayerPosition();
  const editor = app.SequenceEditor.getEditor(sequence);
  project.lockedAccess(() => {
    project.executeTransaction((compoundAction) => {
      compoundAction.addAction(editor.createInsertProjectItemAction(item, time, 0, 0, false));
    }, "VOICEVOX音声をタイムラインに追加");
  });
  return { file, placed: true };
}
async function findItem(folder, name) {
  const items = await folder.getItems();
  for (const item of items) {
    if (item.name === name) return item;
    try { const nested = await findItem(app.FolderItem.cast(item), name); if (nested) return nested; } catch (_) { /* clip item */ }
  }
  return null;
}
async function generate() {
  setBusy(true); status("生成してPremiereに追加しています…");
  try {
    const blob = await synthesize();
    const result = await saveAndImport(blob);
    if (!result) { status("保存先が選択されませんでした", "error"); return; }
    if (result.placed) status("WAVを保存し、プロジェクトとA1の再生ヘッド位置に追加しました", "ok");
    else status(`WAVを保存してプロジェクトに読み込みました。${result.reason}`, "ok");
  } catch (error) { status(`追加に失敗しました: ${error.message}`, "error"); }
  finally { setBusy(false); }
}

$("connect").addEventListener("click", connect);
$("speaker").addEventListener("change", updateStyles);
$("preview").addEventListener("click", preview);
$("generate").addEventListener("click", generate);
$("player").addEventListener("error", () => {
  const mediaError = $("player").error;
  status(`プレビュー再生に失敗しました${mediaError ? ` (code ${mediaError.code})` : ""}。生成音声は保存・Premiere追加から確認できます`, "error");
});
$("player").addEventListener("loadeddata", () => {
  if (!$("player").error) status("試聴音声を読み込みました。「▶ 再生」を押してください", "ok");
});
$("player").addEventListener("play", () => { $("playPreview").textContent = "▶ 再生中"; status("試聴音声を再生中です", "ok"); });
$("player").addEventListener("pause", () => { $("playPreview").textContent = "▶ 再生"; });
$("player").addEventListener("ended", () => { $("playPreview").textContent = "▶ もう一度再生"; });
$("playPreview").addEventListener("click", () => {
  const player = $("player");
  player.muted = false; player.volume = 1;
  try {
    const result = player.play();
    if (result && typeof result.catch === "function") result.catch((error) => status(`再生できません: ${error.message}`, "error"));
  } catch (error) { status(`再生できません: ${error.message}`, "error"); }
});
$("pausePreview").addEventListener("click", () => $("player").pause());
for (const control of document.querySelectorAll(".slider-control")) {
  const slider = control.querySelector(".slider");
  slider.addEventListener("mousedown", (event) => {
    event.preventDefault();
    activeSlider = control;
    updateSliderFromMouse(control, event.clientX);
    document.addEventListener("mousemove", sliderMouseMove);
    document.addEventListener("mouseup", sliderMouseUp);
  });
  slider.addEventListener("keydown", (event) => {
    const min = Number(control.dataset.min), max = Number(control.dataset.max), step = Number(control.dataset.step);
    let value = Number(control.dataset.value);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") value -= step;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") value += step;
    else if (event.key === "Home") value = min;
    else if (event.key === "End") value = max;
    else return;
    event.preventDefault(); setSliderValue(control, value);
  });
  control.querySelector(".reset").addEventListener("click", () => setSliderValue(control, Number(control.dataset.default)));
  setSliderValue(control, Number(control.dataset.value));
}
for (const button of document.querySelectorAll(".reset-number")) {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    input.value = input.id === "preSilence" ? "0" : "0.1";
  });
}
connect();
