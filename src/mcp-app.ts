import { App } from "@modelcontextprotocol/ext-apps";
import WordCloud from "wordcloud";
import { PREFERENCE_TREE, briefMessage, idea, type Brief, type Idea } from "./brief.ts";
import "./mcp-app.css";

const destinationSuggestions = {
  exact: ["Italy", "Japan", "Portugal", "Mexico"],
  flexible: ["Warm beach", "Culture and food", "Mountains", "Nature escape"],
};

const plum = { color: "oklch(0.42 0.11 318)", tint: "oklch(0.96 0.024 318)" };
const ocean = { color: "oklch(0.35 0.09 250)", tint: "oklch(0.95 0.018 250)" };
const vermillion = { color: "oklch(0.56 0.2 29)", tint: "oklch(0.96 0.025 29)" };
const teal = { color: "oklch(0.42 0.1 166)", tint: "oklch(0.95 0.025 166)" };
const ochre = { color: "oklch(0.48 0.11 76)", tint: "oklch(0.96 0.035 76)" };
const branchPalette: Record<string, { color: string; tint: string }> = {
  culture: plum, coast: ocean, food: vermillion, nature: teal, adventure: ochre,
  city: plum, slow: ocean, wellness: teal, romance: vermillion, nightlife: plum,
};

const partyBoosts: Record<string, string[]> = {
  Single: ["adventure", "city", "wellness"],
  Couple: ["romance", "food", "culture"],
  Family: ["coast", "nature", "slow"],
  Friends: ["food", "adventure", "nightlife"],
  Group: ["culture", "coast", "city"],
};
const partyDefaults: Record<string, number> = { Single: 1, Couple: 2, Family: 4, Friends: 4, Group: 8 };

type DestinationMode = "exact" | "flexible";

const state = {
  party: "",
  travellers: 1,
  destinationMode: "exact" as DestinationMode,
  destinationExact: "",
  destinationFlexible: "",
  budget: "",
  budgetMin: 2000,
  budgetMax: 6000,
  path: [] as string[],
  selected: new Map<string, Idea>(),
  customByPath: new Map<string, Idea[]>(),
  pan: { x: 0, y: 0 },
  sending: false,
  // The message text of the last successful send. The same brief is not sent twice.
  lastSent: "",
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const el = {
  cloudPanel: $("cloudPanel"),
  cloudWorld: $("cloudWorld"),
  wordCloud: $<HTMLCanvasElement>("wordCloud"),
  hoverWord: $("hoverWord"),
  cloudFallback: $("cloudFallback"),
  branchTrail: $("branchTrail"),
  resetViewButton: $("resetViewButton"),
  questionState: $("questionState"),
  reviewState: $("reviewState"),
  travellersDetails: $<HTMLDetailsElement>("travellersDetails"),
  destinationDetails: $<HTMLDetailsElement>("destinationDetails"),
  budgetDetails: $<HTMLDetailsElement>("budgetDetails"),
  travellersSummary: $("travellersSummary"),
  destinationSummaryText: $("destinationSummaryText"),
  budgetSummaryText: $("budgetSummaryText"),
  partyOptions: $("partyOptions"),
  decreaseTravellers: $("decreaseTravellers"),
  increaseTravellers: $("increaseTravellers"),
  travellerCount: $("travellerCount"),
  destinationModes: $("destinationModes"),
  destinationModeHint: $("destinationModeHint"),
  destinationInput: $<HTMLInputElement>("destinationInput"),
  destinationSuggestions: $("destinationSuggestions"),
  budgetOptions: $("budgetOptions"),
  customBudget: $("customBudget"),
  budgetMin: $<HTMLInputElement>("budgetMin"),
  budgetMax: $<HTMLInputElement>("budgetMax"),
  budgetMinOutput: $("budgetMinOutput"),
  budgetMaxOutput: $("budgetMaxOutput"),
  applyBudgetRange: $("applyBudgetRange"),
  capturedCount: $("capturedCount"),
  depthLabel: $("depthLabel"),
  questionTitle: $("questionTitle"),
  questionHelp: $("questionHelp"),
  choices: $("choices"),
  customTagForm: $<HTMLFormElement>("customTagForm"),
  customTagInput: $<HTMLInputElement>("customTagInput"),
  fieldMessage: $("fieldMessage"),
  backButton: $("backButton"),
  anotherBranchButton: $("anotherBranchButton"),
  reviewBriefButton: $("reviewBriefButton"),
  briefGroups: $("briefGroups"),
  briefStatus: $("briefStatus"),
  reviewList: $("reviewList"),
  sendBriefButton: $<HTMLButtonElement>("sendBriefButton"),
  sendStatus: $("sendStatus"),
  editBriefButton: $("editBriefButton"),
  newTripButton: $("newTripButton"),
  toast: $("toast"),
  selectionAnnouncement: $("selectionAnnouncement"),
};

let suppressTreeClick = false;
let cloudTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let syncingAccordion = false;
const setupDetails = [el.travellersDetails, el.destinationDetails, el.budgetDetails];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const pathKey = () => state.path.join("/") || "root";

function nodeAtPath(depth = state.path.length): Idea {
  let node = PREFERENCE_TREE;
  for (const id of state.path.slice(0, depth)) node = node.children.find((c) => c.id === id) ?? node;
  return node;
}

const currentOptions = () => [...nodeAtPath().children, ...(state.customByPath.get(pathKey()) ?? [])];

const destinationValue = () =>
  (state.destinationMode === "exact" ? state.destinationExact : state.destinationFlexible).trim();

function destinationSummary() {
  const value = destinationValue();
  if (state.destinationMode === "exact") return value;
  return value ? `Flexible: ${value}` : "Flexible destination";
}

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatBudget = (n: number) => usd.format(n);

const budgetSummary = () =>
  state.budget === "custom" ? `${formatBudget(state.budgetMin)} to ${formatBudget(state.budgetMax)}` : state.budget;

const currentBrief = (): Brief => ({
  party: state.party,
  travellers: state.travellers,
  destination: destinationSummary(),
  budget: budgetSummary(),
  preferences: [...state.selected.values()].map((n) => n.label),
});

function openSetupStep(step: string | null) {
  syncingAccordion = true;
  for (const d of setupDetails) d.open = d.dataset.setupStep === step;
  syncingAccordion = false;
}

const paletteFor = (node: Idea) => branchPalette[state.path[0] || node.id] ?? ocean;

function adjustedWeight(node: Idea) {
  let weight = node.weight;
  if (state.path.length === 0 && partyBoosts[state.party]?.includes(node.id)) weight += 3;
  if (state.selected.has(node.id)) weight += 2;
  return weight;
}

function selectAndFollow(node: Idea) {
  if (!state.selected.has(node.id)) {
    state.selected.set(node.id, node);
    announce(`${node.label} added.`);
  }
  if (node.children.length) {
    state.path.push(node.id);
    resetPan();
    el.fieldMessage.textContent = "";
    announce(`${node.label} added. Showing more specific ideas.`);
  }
  renderAll();
  scheduleCloud(true);
}

function removePreference(id: string) {
  const removed = state.selected.get(id);
  state.selected.delete(id);
  renderAll();
  scheduleCloud(false);
  if (removed) announce(`${removed.label} removed.`);
}

function goToPathDepth(depth: number) {
  state.path = state.path.slice(0, depth);
  resetPan();
  renderAll();
  scheduleCloud(true);
  el.questionTitle.focus();
}

function renderTrail() {
  const nodes = [PREFERENCE_TREE];
  for (let depth = 1; depth <= state.path.length; depth++) nodes.push(nodeAtPath(depth));
  const pieces: HTMLElement[] = [];
  nodes.forEach((node, index) => {
    if (index > 0) {
      const sep = document.createElement("span");
      sep.className = "crumb-separator";
      sep.textContent = "/";
      sep.setAttribute("aria-hidden", "true");
      pieces.push(sep);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crumb";
    button.textContent = node.label;
    if (index === nodes.length - 1) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => goToPathDepth(index));
    pieces.push(button);
  });
  el.branchTrail.replaceChildren(...pieces);
}

function renderTreeControls() {
  const current = nodeAtPath();
  const depth = state.path.length;
  const destination = destinationValue();

  el.depthLabel.textContent = depth === 0 ? "Starting wide" : depth === 1 ? `Exploring ${current.label}` : "Getting specific";
  if (depth === 0) {
    el.questionTitle.textContent =
      state.destinationMode === "flexible"
        ? destination ? `What matters most for ${destination.toLowerCase()}?` : "What should the destination offer?"
        : destination ? `What would make ${destination} feel right?` : "What should shape the trip?";
  } else if (depth === 1) {
    el.questionTitle.textContent = `What kind of ${current.label.toLowerCase()}?`;
  } else {
    el.questionTitle.textContent = `Make ${current.label.toLowerCase()} more specific.`;
  }
  el.questionHelp.textContent = "Choose a word to keep it and open the next branch.";
  el.backButton.hidden = depth === 0;
  el.anotherBranchButton.hidden = depth === 0;
  el.capturedCount.textContent = plural(state.selected.size, "preference");

  el.choices.replaceChildren(
    ...currentOptions().map((node) => {
      const button = document.createElement("button");
      const selected = state.selected.has(node.id);
      const palette = paletteFor(node);
      button.className = "choice";
      button.type = "button";
      button.style.setProperty("--choice-color", palette.color);
      button.style.setProperty("--choice-tint", palette.tint);
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", node.children.length ? `${node.label}. Add and open more specific ideas.` : `${node.label}. Add preference.`);
      button.innerHTML = `<span class="choice-label"><span class="choice-dot" aria-hidden="true"></span><span>${esc(node.label)}</span></span><span class="choice-kind" aria-hidden="true">${selected ? "✓" : node.children.length ? "→" : "+"}</span>`;
      button.dataset.id = node.id;
      button.addEventListener("click", () => {
        selectAndFollow(node);
        // The buttons were rebuilt. Keep keyboard focus in the panel.
        if (node.children.length) el.questionTitle.focus();
        else el.choices.querySelector<HTMLButtonElement>(`[data-id="${CSS.escape(node.id)}"]`)?.focus();
      });
      return button;
    }),
  );
}

function renderBasics() {
  el.partyOptions.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.party === state.party));
  });
  el.travellerCount.textContent = String(state.travellers);
  el.travellersSummary.textContent = state.party
    ? `${state.party} · ${state.travellers} ${state.travellers === 1 ? "person" : "people"}`
    : "Choose party";
  el.destinationModes.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.destinationMode === state.destinationMode));
  });
  el.destinationModeHint.textContent = state.destinationMode === "exact" ? "Exact place" : "Describe the fit";
  el.destinationInput.value = destinationValue();
  el.destinationInput.placeholder = state.destinationMode === "exact" ? "City, country, or region" : "Beach, warm in February, short flight...";
  el.destinationSummaryText.textContent = destinationValue()
    ? destinationSummary()
    : state.destinationMode === "flexible" ? "Flexible · add preferences" : "Not set";

  el.destinationSuggestions.replaceChildren(
    ...destinationSuggestions[state.destinationMode].map((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(destinationValue() === label));
      button.addEventListener("click", () => setDestinationSuggestion(label));
      return button;
    }),
  );

  el.budgetOptions.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.budget === state.budget));
  });
  el.budgetSummaryText.textContent = budgetSummary() || "Not set";
  el.customBudget.hidden = state.budget !== "custom";
  el.budgetMin.value = String(state.budgetMin);
  el.budgetMax.value = String(state.budgetMax);
  el.budgetMinOutput.textContent = formatBudget(state.budgetMin);
  el.budgetMaxOutput.textContent = formatBudget(state.budgetMax);
  el.budgetMin.setAttribute("aria-valuetext", formatBudget(state.budgetMin));
  el.budgetMax.setAttribute("aria-valuetext", formatBudget(state.budgetMax));
}

function renderBrief() {
  const preferences = [...state.selected.values()];
  const basicsSet = Boolean(state.party || destinationSummary() || budgetSummary());
  el.briefStatus.textContent = preferences.length
    ? `${plural(preferences.length, "preference")} captured across any branches you explore.`
    : basicsSet
      ? "Trip basics captured. Choose any word to start exploring."
      : "Add the travellers, then follow any branch that matters.";

  const groups = [
    { label: "Party", values: state.party ? [state.party] : [] },
    { label: "People", values: [String(state.travellers)] },
    { label: "Destination", values: destinationSummary() ? [destinationSummary()] : [] },
    { label: "Budget", values: budgetSummary() ? [budgetSummary()] : [] },
  ];
  const sections = groups.map((group) => {
    const section = document.createElement("section");
    section.className = "brief-group";
    section.innerHTML = `<p class="brief-label">${group.label}</p><div class="brief-values">${group.values.length ? group.values.map((v) => `<span class="brief-chip">${esc(v)}</span>`).join("") : '<span class="brief-empty">Not set</span>'}</div>`;
    return section;
  });

  const prefs = document.createElement("section");
  prefs.className = "brief-group";
  prefs.innerHTML = `<p class="brief-label">Preferences</p><div class="brief-values">${preferences.length ? preferences.map((n) => `<button class="brief-chip is-removable" type="button" data-remove-id="${esc(n.id)}" aria-label="Remove ${esc(n.label)}"><span>${esc(n.label)}</span><span class="remove-mark" aria-hidden="true">×</span></button>`).join("") : '<span class="brief-empty">Choose a word from the cloud</span>'}</div>`;
  prefs.querySelectorAll<HTMLButtonElement>("[data-remove-id]").forEach((b) => {
    b.addEventListener("click", () => removePreference(b.dataset.removeId!));
  });
  sections.push(prefs);
  el.briefGroups.replaceChildren(...sections);
}

function renderAll() {
  renderTrail();
  renderBasics();
  renderTreeControls();
  renderBrief();
  if (!el.reviewState.hidden) renderReview();
}

function scheduleCloud(refresh = true) {
  clearTimeout(cloudTimer);
  clearWordHover();
  if (refresh) el.cloudWorld.classList.add("is-refreshing");
  cloudTimer = setTimeout(() => {
    renderCloud();
    el.cloudWorld.classList.remove("is-refreshing");
  }, refresh ? 120 : 20);
}

const fontSize = (weight: number, scale: number) => Math.max(17, Math.pow(weight, 1.45) * 0.72 * scale);
const isBold = (node: Idea | undefined) => Boolean(node && (node.children.length || state.selected.has(node.id)));

function renderCloud() {
  const options = currentOptions();
  const width = el.wordCloud.clientWidth;
  const height = el.wordCloud.clientHeight;
  const scale = Math.max(0.85, Math.min(1.35, width / 860));
  const byLabel = new Map(options.map((node) => [node.label, node]));

  el.wordCloud.width = Math.max(1, Math.floor(width));
  el.wordCloud.height = Math.max(1, Math.floor(height));
  el.wordCloud.hidden = false;
  el.cloudFallback.classList.remove("is-visible");
  el.cloudFallback.replaceChildren();

  if (!WordCloud.isSupported) return renderFallback(options);
  try {
    WordCloud(el.wordCloud, {
      list: options.map((node) => [node.label, adjustedWeight(node)]),
      gridSize: Math.max(8, Math.round(width / 120)),
      weightFactor: (weight) => fontSize(weight, scale),
      fontFamily: '"Playfair Display", Georgia, serif',
      // wordcloud2 accepts a function here; @types/wordcloud only types a string.
      fontWeight: ((word: string) => (isBold(byLabel.get(word)) ? "600" : "500")) as unknown as string,
      color: (word) => (byLabel.has(word) ? paletteFor(byLabel.get(word)!).color : "oklch(0.19 0.012 264)"),
      backgroundColor: "oklch(1 0 0)",
      rotateRatio: 0,
      shuffle: false,
      shape: "square",
      ellipticity: 0.7,
      clearCanvas: true,
      shrinkToFit: true,
      hover: (item, dimension) => {
        if (el.cloudPanel.classList.contains("is-dragging")) return;
        const node = item ? byLabel.get(item[0]) : undefined;
        if (item && dimension && node) showWordHover(item, dimension, node, scale);
        else clearWordHover();
      },
      click: (item) => {
        const node = item ? byLabel.get(item[0]) : undefined;
        if (!suppressTreeClick && node) selectAndFollow(node);
      },
    });
  } catch (error) {
    console.warn("Word cloud rendering fell back to the accessible layout.", error);
    renderFallback(options);
  }
}

function renderFallback(options: Idea[]) {
  el.wordCloud.hidden = true;
  el.cloudFallback.classList.add("is-visible");
  for (const node of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fallback-word";
    button.textContent = node.label;
    button.setAttribute("aria-pressed", String(state.selected.has(node.id)));
    button.style.fontSize = `${Math.max(1.15, adjustedWeight(node) / 7)}rem`;
    button.style.color = paletteFor(node).color;
    button.addEventListener("click", () => selectAndFollow(node));
    el.cloudFallback.append(button);
  }
}

function showWordHover(item: WordCloud.ListEntry, dim: WordCloud.Dimension, node: Idea, scale: number) {
  el.hoverWord.textContent = item[0];
  el.hoverWord.style.left = `${dim.x + dim.w / 2}px`;
  el.hoverWord.style.top = `${dim.y + dim.h / 2}px`;
  el.hoverWord.style.fontSize = `${fontSize(item[1], scale)}px`;
  el.hoverWord.style.fontWeight = isBold(node) ? "600" : "500";
  el.hoverWord.style.color = paletteFor(node).color;
  el.hoverWord.classList.add("is-visible");
  el.cloudPanel.style.cursor = "pointer";
}

function clearWordHover() {
  el.hoverWord.classList.remove("is-visible");
  el.cloudPanel.style.cursor = "grab";
}

function setupPanning() {
  let pointer: { id: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null = null;
  el.cloudPanel.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || (e.target as Element).closest?.("button, input, .cloud-toolbar")) return;
    pointer = { id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: state.pan.x, originY: state.pan.y, moved: false };
    suppressTreeClick = false;
  });
  el.cloudPanel.addEventListener("pointermove", (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    const dx = e.clientX - pointer.startX;
    const dy = e.clientY - pointer.startY;
    if (!pointer.moved && Math.hypot(dx, dy) < 7) return;
    pointer.moved = true;
    suppressTreeClick = true;
    clearWordHover();
    el.cloudPanel.classList.add("is-dragging");
    el.cloudPanel.setPointerCapture(e.pointerId);
    const limitX = el.cloudPanel.clientWidth * 0.18;
    const limitY = el.cloudPanel.clientHeight * 0.18;
    state.pan.x = Math.max(-limitX, Math.min(limitX, pointer.originX + dx));
    state.pan.y = Math.max(-limitY, Math.min(limitY, pointer.originY + dy));
    applyPan();
  });
  const finish = (e: PointerEvent) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    el.cloudPanel.classList.remove("is-dragging");
    pointer = null;
    setTimeout(() => (suppressTreeClick = false), 0);
  };
  el.cloudPanel.addEventListener("pointerup", finish);
  el.cloudPanel.addEventListener("pointercancel", finish);
  el.cloudPanel.addEventListener("pointerleave", clearWordHover);
}

function applyPan() {
  el.cloudWorld.style.setProperty("--pan-x", `${state.pan.x}px`);
  el.cloudWorld.style.setProperty("--pan-y", `${state.pan.y}px`);
  el.resetViewButton.classList.toggle("is-visible", Math.abs(state.pan.x) > 2 || Math.abs(state.pan.y) > 2);
}

function resetPan() {
  state.pan.x = 0;
  state.pan.y = 0;
  applyPan();
}

function setParty(party: string) {
  state.party = party;
  state.travellers = partyDefaults[party] ?? state.travellers;
  renderAll();
  openSetupStep("destination");
  requestAnimationFrame(() => el.destinationInput.focus());
  if (state.path.length === 0) scheduleCloud(false);
  announce(`${party} trip, ${state.travellers} people.`);
}

function changeTravellers(amount: number) {
  state.travellers = Math.max(1, Math.min(20, state.travellers + amount));
  renderBasics();
  renderBrief();
  announce(`${state.travellers} people.`);
}

function setDestinationMode(mode: DestinationMode) {
  if (mode === state.destinationMode) return;
  state.destinationMode = mode;
  renderBasics();
  renderTreeControls();
  renderBrief();
  el.destinationInput.focus();
  announce(mode === "exact" ? "Exact destination selected." : "Flexible destination selected.");
}

function setDestinationSuggestion(label: string) {
  if (state.destinationMode === "exact") state.destinationExact = label;
  else state.destinationFlexible = label;
  renderBasics();
  renderTreeControls();
  renderBrief();
  openSetupStep("budget");
  requestAnimationFrame(() => el.budgetOptions.querySelector("button")?.focus());
  announce(`${label} selected.`);
}

function setBudget(budget: string) {
  state.budget = state.budget === budget ? "" : budget;
  renderBasics();
  renderBrief();
  if (state.budget && state.budget !== "custom") {
    openSetupStep(null);
    requestAnimationFrame(() => el.questionTitle.focus());
  } else {
    openSetupStep("budget");
  }
  announce(state.budget ? `${budgetSummary()} budget selected.` : "Budget cleared.");
}

function updateCustomBudget(changedEnd: "minimum" | "maximum") {
  let minimum = Number(el.budgetMin.value);
  let maximum = Number(el.budgetMax.value);
  if (changedEnd === "minimum" && minimum >= maximum) minimum = maximum - 500;
  if (changedEnd === "maximum" && maximum <= minimum) maximum = minimum + 500;
  state.budget = "custom";
  state.budgetMin = minimum;
  state.budgetMax = maximum;
  renderBasics();
  renderBrief();
}

const normalizeTag = (value: string) =>
  value.trim().replace(/\s+/g, " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

function addCustomTag(event: SubmitEvent) {
  event.preventDefault();
  const label = normalizeTag(el.customTagInput.value);
  if (!label) {
    el.customTagInput.setAttribute("aria-invalid", "true");
    el.fieldMessage.textContent = "Enter a preference first.";
    el.customTagInput.focus();
    return;
  }
  const duplicate = [...state.selected.values(), ...currentOptions()].some((n) => n.label.toLowerCase() === label.toLowerCase());
  if (duplicate) {
    el.customTagInput.setAttribute("aria-invalid", "true");
    el.fieldMessage.textContent = `${label} is already here.`;
    return;
  }
  const node = idea(`custom-${Date.now()}`, label, 12);
  state.customByPath.set(pathKey(), [...(state.customByPath.get(pathKey()) ?? []), node]);
  state.selected.set(node.id, node);
  el.customTagInput.value = "";
  el.customTagInput.removeAttribute("aria-invalid");
  el.fieldMessage.textContent = `${label} added to this branch.`;
  renderAll();
  scheduleCloud(true);
  announce(`${label} added.`);
}

// The brief dock stays editable during review, so the rows and the send state follow the live brief.
function renderReview() {
  const sent = state.lastSent === briefMessage(currentBrief());
  el.sendBriefButton.disabled = state.sending || sent;
  el.sendBriefButton.textContent = state.sending ? "Sending…" : sent ? "Sent to chat" : "Send brief to chat";
  const b = currentBrief();
  const rows = [
    ["Travel party", b.party || "Open"],
    ["Number of people", String(b.travellers)],
    ["Destination", b.destination || "Not set"],
    ["Budget per person", b.budget || "Not set"],
    ["Preferences", b.preferences.join(", ") || "Open"],
  ];
  el.reviewList.replaceChildren(
    ...rows.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "review-row";
      row.innerHTML = `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
      return row;
    }),
  );
}

function openReview() {
  el.questionState.hidden = true;
  el.reviewState.hidden = false;
  el.sendStatus.textContent = "";
  renderReview();
  announce("Trip brief ready for review.");
}

function editBrief() {
  el.questionState.hidden = false;
  el.reviewState.hidden = true;
  renderAll();
  scheduleCloud(false);
}

function newTrip() {
  Object.assign(state, {
    party: "", travellers: 1, destinationMode: "exact", destinationExact: "", destinationFlexible: "",
    budget: "", budgetMin: 2000, budgetMax: 6000, path: [],
  });
  state.selected.clear();
  state.customByPath.clear();
  el.customTagInput.value = "";
  el.questionState.hidden = false;
  el.reviewState.hidden = true;
  el.fieldMessage.textContent = "";
  openSetupStep("travellers");
  resetPan();
  renderAll();
  scheduleCloud(true);
  announce("New travel brief started.");
}

function showToast(message: string) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2600);
}

function announce(message: string) {
  el.selectionAnnouncement.textContent = "";
  setTimeout(() => (el.selectionAnnouncement.textContent = message), 20);
}

const app = new App({ name: "Travel Brief", version: "1.0.0" });

async function sendBrief() {
  const text = briefMessage(currentBrief());
  if (state.sending || state.lastSent === text) return;
  state.sending = true;
  el.sendStatus.textContent = "Sending the brief to the chat.";
  renderReview();
  try {
    const result = await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    if (result.isError) {
      el.sendStatus.textContent = "The host rejected the message, so nothing was sent. Try again, or paste the brief in the chat.";
    } else {
      // Keep the text sent, not a flag: the advisor can change or reset the brief while the send is pending.
      state.lastSent = text;
      el.sendStatus.textContent = "Brief sent to the chat. Change the brief to send it again.";
    }
  } catch (err) {
    el.sendStatus.textContent = `Could not send the brief: ${err instanceof Error ? err.message : String(err)}. Try again.`;
  } finally {
    state.sending = false;
    renderReview();
  }
}

el.partyOptions.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.addEventListener("click", () => setParty(b.dataset.party!)));
el.decreaseTravellers.addEventListener("click", () => changeTravellers(-1));
el.increaseTravellers.addEventListener("click", () => changeTravellers(1));
el.destinationModes.querySelectorAll<HTMLButtonElement>("button").forEach((b) =>
  b.addEventListener("click", () => setDestinationMode(b.dataset.destinationMode as DestinationMode)),
);
el.destinationInput.addEventListener("input", () => {
  if (state.destinationMode === "exact") state.destinationExact = el.destinationInput.value;
  else state.destinationFlexible = el.destinationInput.value;
  el.destinationSuggestions.querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.textContent === destinationValue()));
  });
  renderTreeControls();
  renderBrief();
});
el.destinationInput.addEventListener("change", () => {
  if (!destinationValue()) return;
  renderBasics();
  openSetupStep("budget");
  requestAnimationFrame(() => el.budgetOptions.querySelector("button")?.focus());
  announce(`${destinationSummary()} selected.`);
});
el.budgetOptions.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.addEventListener("click", () => setBudget(b.dataset.budget!)));
el.budgetMin.addEventListener("input", () => updateCustomBudget("minimum"));
el.budgetMax.addEventListener("input", () => updateCustomBudget("maximum"));
el.budgetMin.addEventListener("change", () => announce(`${budgetSummary()} budget selected.`));
el.budgetMax.addEventListener("change", () => announce(`${budgetSummary()} budget selected.`));
el.applyBudgetRange.addEventListener("click", () => {
  openSetupStep(null);
  requestAnimationFrame(() => el.questionTitle.focus());
  announce(`${budgetSummary()} budget selected.`);
});
// Only one setup step is open at a time.
for (const details of setupDetails) {
  details.addEventListener("toggle", () => {
    if (syncingAccordion || !details.open) return;
    openSetupStep(details.dataset.setupStep!);
  });
}
el.customTagForm.addEventListener("submit", addCustomTag);
el.customTagInput.addEventListener("input", () => {
  el.customTagInput.removeAttribute("aria-invalid");
  el.fieldMessage.textContent = "";
});
el.backButton.addEventListener("click", () => goToPathDepth(Math.max(0, state.path.length - 1)));
el.anotherBranchButton.addEventListener("click", () => goToPathDepth(0));
el.reviewBriefButton.addEventListener("click", openReview);
el.editBriefButton.addEventListener("click", editBrief);
el.sendBriefButton.addEventListener("click", sendBrief);
el.newTripButton.addEventListener("click", newTrip);
el.resetViewButton.addEventListener("click", resetPan);
// The host can resize the iframe at any time, so watch the canvas, not the window.
new ResizeObserver(() => scheduleCloud(false)).observe(el.wordCloud);

setupPanning();
renderAll();

app.connect().catch((err) =>
  showToast(`Could not connect to the host: ${err instanceof Error ? err.message : String(err)}`),
);
