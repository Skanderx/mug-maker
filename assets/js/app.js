import { play as playSound, set as configureSound } from "../vendor/foley-2.9.0.js";
import {
  DEFAULT_MOUSE_PAD_LAYOUT,
  MOUSE_PAD_EXPORT_HEIGHT,
  MOUSE_PAD_EXPORT_WIDTH,
  MOUSE_PAD_HEIGHT_MM,
  MOUSE_PAD_LAYOUTS,
  MOUSE_PAD_WIDTH_MM,
  OUTLINE_PRESETS,
  clampPosition,
  getDefaultOutlineColor,
  getMousePadGuideLines,
  getMousePadPhotoSlots,
  getMousePadZones,
  getOutlineColorOptions,
  getPositionFromPercent,
  getPositionPercent,
  getTonalOutlineColor,
  normalizeHex,
} from "./mug-core.js";

(() => {
  const PRODUCT_MUG = "mug";
  const PRODUCT_MOUSEPAD = "mousepad";
  const MUG_EXPORT_WIDTH = 2550;
  const MUG_EXPORT_HEIGHT = 992;
  const MUG_LAYOUT_PRESETS = {
    classic: {
      left: { x: 0, y: 0, width: 900, height: MUG_EXPORT_HEIGHT },
      center: { x: 900, y: 0, width: 750, height: MUG_EXPORT_HEIGHT },
      right: { x: 1650, y: 0, width: 900, height: MUG_EXPORT_HEIGHT },
    },
    equal: {
      left: { x: 0, y: 0, width: 850, height: MUG_EXPORT_HEIGHT },
      center: { x: 850, y: 0, width: 850, height: MUG_EXPORT_HEIGHT },
      right: { x: 1700, y: 0, width: 850, height: MUG_EXPORT_HEIGHT },
    },
    textWide: {
      left: { x: 0, y: 0, width: 750, height: MUG_EXPORT_HEIGHT },
      center: { x: 750, y: 0, width: 1050, height: MUG_EXPORT_HEIGHT },
      right: { x: 1800, y: 0, width: 750, height: MUG_EXPORT_HEIGHT },
    },
    imagesWide: {
      left: { x: 0, y: 0, width: 1050, height: MUG_EXPORT_HEIGHT },
      center: { x: 1050, y: 0, width: 450, height: MUG_EXPORT_HEIGHT },
      right: { x: 1500, y: 0, width: 1050, height: MUG_EXPORT_HEIGHT },
    },
  };
  const DEFAULT_LAYOUT = "classic";
  const PRODUCT_LABELS = {
    [PRODUCT_MUG]: {
      currentLabel: "Mode mug · 229 × 89 mm",
      switchLabel: "Tapis souris",
      switchIcon: "rectangle-horizontal",
      switchAria: "Passer au mode tapis souris",
      controlsAria: "Commandes de création du mug",
      previewAria: "Aperçu du visuel pour mug",
      previewMeta: "Image gauche, texte central, image droite",
      sizeMeta: "9 × 3,5 po · 229 × 89 mm (mug 11 oz)",
      printTitle: "Impression du mug",
      downloadName: "creation-mug",
      queueItemLabel: "Création",
    },
    [PRODUCT_MOUSEPAD]: {
      currentLabel: "Mode tapis souris · 220 × 180 mm",
      switchLabel: "Mode mug",
      switchIcon: "circle-dot",
      switchAria: "Revenir au mode mug",
      controlsAria: "Commandes de création du tapis souris",
      previewAria: "Aperçu du visuel pour tapis souris",
      previewMeta: "Fond facultatif, photos, texte près du bas",
      sizeMeta: "220 × 180 mm (tapis souris)",
      printTitle: "Impression du tapis souris",
      downloadName: "creation-tapis-souris",
      queueItemLabel: "Tapis",
    },
  };
  const SHEET_LAYOUTS = {
    "3up": { perPage: 3, widthMm: 210, heightMm: 82, gapMm: 8 },
    "4up": { perPage: 4, widthMm: 210, heightMm: 74, gapMm: 0 },
  };
  const PREFERENCES_STORAGE_KEY = "mugCreator.defaultPreferences.v1";
  const MUG_WIZARD_STEPS = ["left", "right", "text", "done"];
  const MUG_IMAGE_SLOTS = ["left", "center", "right"];
  const MOUSEPAD_PHOTO_SLOTS = ["photo1", "photo2", "photo3", "photo4"];
  const MOUSEPAD_IMAGE_SLOTS = ["background", ...MOUSEPAD_PHOTO_SLOTS];
  const MOUSEPAD_PRINT_LAYOUT = {
    perPage: 1,
    widthMm: MOUSE_PAD_WIDTH_MM,
    heightMm: MOUSE_PAD_HEIGHT_MM,
    gapMm: 0,
  };
  let activeProduct = PRODUCT_MUG;
  let printQueue = [];
  let queueIndex = 0;
  let sheetLayout = "3up";
  let wizardStep = "left";
  let quickTextEditing = false;
  const graphemeSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
  let previewScale = 1;
  let previewOffset = { x: 0, y: 0 };
  let cropDraft = null;
  let cropDrag = null;
  const DEFAULT_FIT_MODES = {
    left: "cut",
    center: "cut",
    right: "cut",
    background: "cut",
    photo1: "cut",
    photo2: "cut",
    photo3: "cut",
    photo4: "cut",
  };
  const QUICK_FIT_MODES = {
    left: "resize",
    center: "resize",
    right: "resize",
    background: "cut",
    photo1: "resize",
    photo2: "resize",
    photo3: "resize",
    photo4: "resize",
  };
  const DEFAULT_IMAGE_POSITION = { x: 0.5, y: 0.5 };
  const DEFAULT_IMAGE_POSITIONS = {
    left: { ...DEFAULT_IMAGE_POSITION },
    center: { ...DEFAULT_IMAGE_POSITION },
    right: { ...DEFAULT_IMAGE_POSITION },
    background: { ...DEFAULT_IMAGE_POSITION },
    photo1: { ...DEFAULT_IMAGE_POSITION },
    photo2: { ...DEFAULT_IMAGE_POSITION },
    photo3: { ...DEFAULT_IMAGE_POSITION },
    photo4: { ...DEFAULT_IMAGE_POSITION },
  };
  const FULL_CROP = { left: 0, top: 0, right: 1, bottom: 1 };
  const OPPOSITE_EDGE = { left: "right", right: "left", top: "bottom", bottom: "top" };
  const DEFAULT_IMAGE_SCALE = 1;
  const DEFAULT_IMAGE_SCALES = {
    left: DEFAULT_IMAGE_SCALE,
    center: DEFAULT_IMAGE_SCALE,
    right: DEFAULT_IMAGE_SCALE,
    background: DEFAULT_IMAGE_SCALE,
    photo1: DEFAULT_IMAGE_SCALE,
    photo2: DEFAULT_IMAGE_SCALE,
    photo3: DEFAULT_IMAGE_SCALE,
    photo4: DEFAULT_IMAGE_SCALE,
  };
  const IMAGE_SHIFT_STEP = 0.04;
  const IMAGE_SHIFT_DIRECTIONS = {
    up: { axis: "y", delta: -IMAGE_SHIFT_STEP, icon: "arrow-up", label: "Monter l'image" },
    left: { axis: "x", delta: -IMAGE_SHIFT_STEP, icon: "arrow-left", label: "Décaler l'image à gauche" },
    right: { axis: "x", delta: IMAGE_SHIFT_STEP, icon: "arrow-right", label: "Décaler l'image à droite" },
    down: { axis: "y", delta: IMAGE_SHIFT_STEP, icon: "arrow-down", label: "Descendre l'image" },
  };
  const IMAGE_SLOT_LABELS = {
    left: "gauche",
    center: "centrale",
    right: "droite",
    background: "de fond",
    photo1: "photo 1",
    photo2: "photo 2",
    photo3: "photo 3",
    photo4: "photo 4",
  };
  const IMAGE_SHAPES = {
    rectangle: { label: "Rectangle" },
    circle: { label: "Cercle" },
    square: { label: "Carré" },
    heart: { label: "Cœur" },
    apple: { label: "Pomme" },
    star: { label: "Étoile" },
    hexagon: { label: "Hexagone" },
  };
  const DEFAULT_IMAGE_SHAPE = "rectangle";
  const DEFAULT_IMAGE_SHAPES = {
    left: DEFAULT_IMAGE_SHAPE,
    center: DEFAULT_IMAGE_SHAPE,
    right: DEFAULT_IMAGE_SHAPE,
    background: DEFAULT_IMAGE_SHAPE,
    photo1: DEFAULT_IMAGE_SHAPE,
    photo2: DEFAULT_IMAGE_SHAPE,
    photo3: DEFAULT_IMAGE_SHAPE,
    photo4: DEFAULT_IMAGE_SHAPE,
  };
  const DEFAULT_FILE_LABELS = {
    left: "Aucune image choisie",
    center: "Aucune image choisie",
    right: "Aucune image choisie",
    background: "Aucun fond choisi",
    photo1: "Aucune photo choisie",
    photo2: "Aucune photo choisie",
    photo3: "Aucune photo choisie",
    photo4: "Aucune photo choisie",
  };
  const DEFAULT_TEXT_FORMAT = {
    bold: true,
    italic: false,
    outline: false,
    shadow: false,
  };
  const DEFAULT_TEXT_SHAPE = "none";
  const TEXT_SHAPES = {
    none: null,
    hearts: {
      glyphs: ["♥", "♡", "♥", "♡"],
      colors: ["#ec4899", "#fb7185", "#f472b6", "#f59e0b"],
      rotations: [-14, 12, 10, -8],
    },
    stars: {
      glyphs: ["★", "☆", "★", "☆"],
      colors: ["#f59e0b", "#2563eb", "#facc15", "#14b8a6"],
      rotations: [-10, 12, 8, -12],
    },
    sparkles: {
      glyphs: ["✦", "✧", "✦", "✧"],
      colors: ["#a855f7", "#0ea5e9", "#f59e0b", "#ec4899"],
      rotations: [-8, 12, 10, -10],
    },
  };
  const DEFAULT_FONT_SIZE = 138;
  const DEFAULT_TEXT_COLOR = "#17202a";
  const DEFAULT_TEXT_FONT = "geist";
  const FONT_OPTIONS = {
    geist: '"Geist", Arial, Helvetica, sans-serif',
    atkinson: '"Atkinson Hyperlegible", Arial, Helvetica, sans-serif',
    montserrat: '"Montserrat", Arial, Helvetica, sans-serif',
    poppins: '"Poppins", Arial, Helvetica, sans-serif',
    playfair: '"Playfair Display", Georgia, serif',
    lobster: '"Lobster", cursive',
    bebas: '"Bebas Neue", Impact, sans-serif',
    caveat: '"Caveat", cursive',
    "noto-naskh-arabic": '"Noto Naskh Arabic", "Amiri", serif',
    "noto-kufi-arabic": '"Noto Kufi Arabic", "Cairo", sans-serif',
    cairo: '"Cairo", Arial, sans-serif',
    tajawal: '"Tajawal", Arial, sans-serif',
    amiri: '"Amiri", Georgia, serif',
    changa: '"Changa", Arial, sans-serif',
  };
  const DEFAULT_OUTLINE_STYLE = { strokeScale: 0.06, letterSpacingScale: 0 };
  const OUTLINE_STYLE_BY_FONT = {
    geist: { strokeScale: 0.045, letterSpacingScale: 0 },
    atkinson: { strokeScale: 0.045, letterSpacingScale: 0 },
    montserrat: { strokeScale: 0.045, letterSpacingScale: 0 },
    poppins: { strokeScale: 0.045, letterSpacingScale: 0 },
    lobster: { strokeScale: 0.04, letterSpacingScale: 0.05 },
    bebas: { strokeScale: 0.04, letterSpacingScale: 0.04 },
  };
  const FONT_LABELS = {
    geist: "Geist (par défaut)",
    atkinson: "Atkinson Hyperlegible",
    montserrat: "Montserrat",
    poppins: "Poppins",
    playfair: "Playfair Display",
    lobster: "Lobster",
    bebas: "Bebas Neue",
    caveat: "Caveat",
    "noto-naskh-arabic": "Noto Naskh Arabic",
    "noto-kufi-arabic": "Noto Kufi Arabic",
    cairo: "Cairo",
    tajawal: "Tajawal",
    amiri: "Amiri",
    changa: "Changa",
  };
  const FONT_GROUPS = [
    {
      label: "Latin",
      keys: ["geist", "atkinson", "montserrat", "poppins", "playfair", "lobster", "bebas", "caveat"],
    },
    {
      label: "Arabe",
      keys: ["noto-naskh-arabic", "noto-kufi-arabic", "cairo", "tajawal", "amiri", "changa"],
    },
  ];
  const savedPreferences = loadDefaultPreferences();
  const productStates = {
    [PRODUCT_MUG]: createMugState(savedPreferences),
    [PRODUCT_MOUSEPAD]: createMousePadState(savedPreferences),
  };
  const productRuntime = {
    [PRODUCT_MUG]: {
      printQueue: [],
      queueIndex: 0,
      sheetLayout: savedPreferences.sheetLayout,
      wizardStep: "left",
      quickTextEditing: false,
    },
    [PRODUCT_MOUSEPAD]: {
      printQueue: [],
      queueIndex: 0,
      sheetLayout: "3up",
      wizardStep: "layout",
      quickTextEditing: false,
    },
  };
  let state = productStates[activeProduct];
  loadProductRuntime(activeProduct);
  applyQuickModeDefaults();
  buildMousePadControls();

  const elements = {
    stage: document.querySelector("#stage"),
    stageArea: document.querySelector(".stage-area"),
    controls: document.querySelector(".controls"),
    preview: document.querySelector(".preview"),
    previewTitle: document.querySelector("#previewTitle"),
    previewMeta: document.querySelector("#previewMeta"),
    previewSizeMeta: document.querySelector("#previewSizeMeta"),
    currentProductLabel: document.querySelector("#currentProductLabel"),
    productSwitchButton: document.querySelector("#productSwitchButton"),
    productSwitchIcon: document.querySelector("#productSwitchIcon"),
    productSwitchText: document.querySelector("#productSwitchText"),
    stageFrame: document.querySelector(".stage-frame"),
    imageShiftOverlay: document.querySelector("#imageShiftOverlay"),
    previewActionButton: document.querySelector("#previewActionButton"),
    previewFileInput: document.querySelector("#previewFileInput"),
    previewActionIcon: document.querySelector("#previewActionIcon"),
    previewActionText: document.querySelector("#previewActionText"),
    quickCenterImage: document.querySelector("#quickCenterImage"),
    quickCenterUploadText: document.querySelector("#quickCenterUploadText"),
    quickCenterDetails: document.querySelector("#quickCenterDetails"),
    quickCenterName: document.querySelector("#quickCenterName"),
    quickCenterRemove: document.querySelector("#quickCenterRemove"),
    imageInputs: Object.fromEntries(
      Array.from(document.querySelectorAll("[data-image-input-slot]")).map((input) => [
        input.dataset.imageInputSlot,
        input,
      ]),
    ),
    fileNames: Object.fromEntries(
      Array.from(document.querySelectorAll("[data-file-name-slot]")).map((name) => [
        name.dataset.fileNameSlot,
        name,
      ]),
    ),
    mousepadPhotoRows: Array.from(document.querySelectorAll("[data-mousepad-photo-row]")),
    removeButtons: Array.from(document.querySelectorAll("[data-remove-slot]")),
    cropButtons: Array.from(document.querySelectorAll("[data-crop-slot]")),
    minimalMode: document.querySelector("#minimalMode"),
    choiceGroups: Array.from(document.querySelectorAll("[data-selection]")),
    imageShapeControls: Array.from(document.querySelectorAll("[data-image-shape-control]")),
    positionInputs: Array.from(document.querySelectorAll("[data-position-input]")),
    textField: document.querySelector("#textField"),
    textInput: document.querySelector("#textInput"),
    textEditor: document.querySelector("#textEditor"),
    textAppearance: document.querySelector("#textAppearance"),
    textFitWarning: document.querySelector("#textFitWarning"),
    uploadError: document.querySelector("#uploadError"),
    quickTextEditButton: document.querySelector("#quickTextEditButton"),
    quickTextEditButtonText: document.querySelector("#quickTextEditButtonText"),
    fontSelect: document.querySelector("#fontSelect"),
    fontPreviewList: document.querySelector("#fontPreviewList"),
    fontSize: document.querySelector("#fontSize"),
    fontSizeValue: document.querySelector("#fontSizeValue"),
    textColor: document.querySelector("#textColor"),
    outlineColor: document.querySelector("#outlineColor"),
    wizardSteps: document.querySelector(".wizard-steps"),
    wizardStepButtons: Array.from(document.querySelectorAll("[data-wizard-go]")),
    wizardStepPanels: Array.from(document.querySelectorAll("[data-wizard-step]")),
    wizardNav: document.querySelector("#wizardNav"),
    wizardBack: document.querySelector("#wizardBack"),
    wizardNext: document.querySelector("#wizardNext"),
    wizardNextText: document.querySelector("#wizardNext .button-text"),
    addToPageButton: document.querySelector("#addToPageButton"),
    queuePanel: document.querySelector("#queuePanel"),
    queuePrev: document.querySelector("#queuePrev"),
    queueNext: document.querySelector("#queueNext"),
    queueLabel: document.querySelector("#queueLabel"),
    queueThumb: document.querySelector("#queueThumb"),
    queueRemove: document.querySelector("#queueRemove"),
    outlinePresetButtons: Array.from(document.querySelectorAll("[data-outline-preset]")),
    downloadButton: document.querySelector("#downloadButton"),
    downloadMirrorButton: document.querySelector("#downloadMirrorButton"),
    printButton: document.querySelector("#printButton"),
    mirrorPrint: document.querySelector("#mirrorPrint"),
    clearDialog: document.querySelector("#clearDialog"),
    status: document.querySelector("#status"),
    cropDialog: document.querySelector("#imageCropDialog"),
    cropDialogContent: document.querySelector("#imageCropDialogContent"),
    cropPreviewStage: document.querySelector("#cropPreviewStage"),
    cropViewport: document.querySelector("#cropViewport"),
    cropPreviewImage: document.querySelector("#cropPreviewImage"),
    cropZoom: document.querySelector("#cropZoom"),
    cropBlades: Array.from(document.querySelectorAll(".crop-blade")),
    cropEdge: document.querySelector("#cropEdge"),
    cropEdgePosition: document.querySelector("#cropEdgePosition"),
    cropPaper: document.querySelector("#cropPaper"),
    cropZoomValue: document.querySelector("#cropZoomValue"),
    cropOffcut: document.querySelector("#cropOffcut"),
    cropModes: Array.from(document.querySelectorAll("[data-crop-mode]")),
    cropDimensions: document.querySelector("#cropDimensions"),
    cropResetButton: document.querySelector("#cropResetButton"),
    cropApplyButton: document.querySelector("#cropApplyButton"),
  };

  if (!window.Konva) {
    setStatus("Konva n'a pas chargé. Vérifiez les fichiers de l'application.", true);
    return;
  }

  const stage = new Konva.Stage({
    container: "stage",
    width: 1020,
    height: 420,
  });
  const contentLayer = new Konva.Layer();
  const guideLayer = new Konva.Layer({ listening: false });
  stage.add(contentLayer);
  stage.add(guideLayer);

  const resizeObserver = new ResizeObserver(resizeStage);
  resizeObserver.observe(elements.stageArea);
  resizeObserver.observe(elements.previewActionButton);

  for (const [slot, input] of Object.entries(elements.imageInputs)) {
    input.addEventListener("valuechange", ({ detail }) => {
      if (detail.value.length) handleFile(detail.value[0], slot);
    });
    input.addEventListener("reject", () => showUploadError(slot));
  }

  elements.previewFileInput.addEventListener("change", ({ currentTarget: picker }) => {
    const file = picker.files[0];
    const input = getImageInput(picker.dataset.imageSlot);
    picker.value = "";
    if (!file || !input) return;

    const targetState = state;
    customElements.whenDefined("ui-file-input").then(() => {
      if (state === targetState) input.api.addFiles([file]);
    });
  });

  elements.removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      removeImage(button.dataset.removeSlot);
    });
  });

  elements.productSwitchButton.addEventListener("click", toggleProductMode);
  elements.quickCenterRemove.addEventListener("click", () => removeImage("center"));
  elements.quickTextEditButton.addEventListener("click", () => setQuickTextEditor(true));

  elements.cropButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.images[button.dataset.cropSlot];
      if (item) openImageCropDialog(button.dataset.cropSlot, item);
    });
  });

  bindChoiceGroups();
  const supportsAudio = Boolean(window.AudioContext || window.webkitAudioContext);
  configureSound({ volume: 0.25, theme: "soft", space: 0 });

  function isSoundButton(event) {
    return event.isTrusted && supportsAudio && state.minimalMode &&
      event.target.closest("button:enabled:not([aria-disabled='true'])");
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.isPrimary && event.button === 0 && isSoundButton(event)) playSound("press");
  }, true);
  document.addEventListener("click", (event) => {
    if (isSoundButton(event)) playSound(event.detail ? "release" : "tap");
  }, true);

  elements.minimalMode.addEventListener("checkedchange", ({ detail }) => setMinimalMode(detail.value));

  elements.wizardSteps.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wizard-go]");
    if (!button) return;
    setWizardStep(button.dataset.wizardGo);
  });

  elements.wizardBack.addEventListener("click", goToPreviousWizardStep);
  elements.wizardNext.addEventListener("click", goToNextWizardStep);
  bindPendingAction(elements.previewActionButton, handlePreviewAction);
  elements.stageFrame.addEventListener("click", handleStageFrameClick);
  document.addEventListener("keydown", handleWizardEnterKey);

  elements.positionInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const position = getPositionFromPercent(input.value);
      if (position === null) return;
      setImagePosition(input.dataset.positionSlot, input.dataset.positionAxis, position);
    });
  });

  elements.imageShiftOverlay.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nudge-slot]");
    if (!button) return;

    nudgeImagePosition(button.dataset.nudgeSlot, button.dataset.nudgeDirection);
  });

  customElements.whenDefined("ui-slider").then(() => {
    elements.cropZoom.format = { style: "percent" };
  });
  elements.cropZoom.addEventListener("valuechange", ({ detail }) => {
    if (!cropDraft || cropDraft.scale === detail.value) return;
    cropDraft.scale = detail.value;
    updateCropLayout();
  });
  elements.cropEdge.addEventListener("change", renderCropPreview);
  elements.cropEdgePosition.addEventListener("input", () => {
    setCropEdge(elements.cropEdge.value, Number(elements.cropEdgePosition.value) / 100);
  });
  elements.cropBlades.forEach((blade) => {
    const edge = blade.dataset.edge;
    const horizontal = edge === "left" || edge === "right";
    const axis = horizontal ? "width" : "height";
    blade.addEventListener("keydown", (event) => {
      const increment = event.shiftKey ? 0.1 : 0.01;
      const current = cropDraft.edges[edge];
      const values = {
        Home: 0,
        End: 1,
        [horizontal ? "ArrowLeft" : "ArrowUp"]: current - increment,
        [horizontal ? "ArrowRight" : "ArrowDown"]: current + increment,
      };
      if (!(event.key in values)) return;
      event.preventDefault();
      setCropEdge(edge, values[event.key]);
    });
    blade.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      const frame = getCropImageFrame();
      const span = frame[axis];
      const start = horizontal ? event.clientX : event.clientY;
      const origin = horizontal ? frame.x : frame.y;
      const bounds = blade.getBoundingClientRect();
      const initial = horizontal ? bounds.left + bounds.width / 2 - frame.viewport.left
        : bounds.top + bounds.height / 2 - frame.viewport.top;
      elements.cropEdge.value = edge;
      blade.focus();
      blade.setPointerCapture(event.pointerId);
      function moveBlade(move) {
        if (!cropDraft || move.pointerId !== event.pointerId) return;
        const delta = (horizontal ? move.clientX : move.clientY) - start;
        setCropEdge(edge, (initial + delta - origin) / span);
      }
      blade.addEventListener("pointermove", moveBlade);
      blade.addEventListener("lostpointercapture", () => blade.removeEventListener("pointermove", moveBlade), { once: true });
    });
  });
  elements.cropViewport.addEventListener("keydown", (event) => {
    if (!cropDraft) return;
    const moves = { ArrowLeft: ["x", -1], ArrowRight: ["x", 1], ArrowUp: ["y", -1], ArrowDown: ["y", 1] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const [axis, delta] = move;
    cropDraft.offset[axis] += delta * (event.shiftKey ? 0.1 : 0.01);
    renderCropPreview();
  });
  document.querySelector("#cropCenterButton").addEventListener("click", fitAndCenterCrop);
  elements.cropResetButton.addEventListener("click", resetCropImage);
  new ResizeObserver(() => {
    if (cropDraft) updateCropLayout();
  }).observe(elements.cropPreviewStage);
  elements.cropApplyButton.addEventListener("click", applyImageCrop);
  elements.cropDialog.addEventListener("openchange", ({ detail }) => {
    if (detail.value || detail.returnValue === "apply") return;
    clearCropDraft();
    setStatus("Cadrage annulé");
  });
  elements.cropViewport.addEventListener("pointerdown", startCropDrag);
  elements.cropViewport.addEventListener("pointermove", moveCropDrag);
  elements.cropViewport.addEventListener("pointerup", endCropDrag);
  elements.cropViewport.addEventListener("pointercancel", endCropDrag);


  elements.textEditor.addEventListener("valuechange", ({ detail }) => {
    if (state.text === detail.value) return;
    state.text = detail.value;
    updateFontPreviewSamples();
    updateWizardUI();
    render();
  });

  elements.textAppearance.addEventListener("openchangecomplete", ({ detail }) => {
    if (quickTextEditing && detail.value) elements.textAppearance.scrollIntoView({ block: "nearest" });
  });

  elements.fontSelect.addEventListener("valuechange", ({ detail }) => setTextFont(detail.value));
  window.addEventListener("beforeunload", protectCreationBeforeUnload);

  elements.fontSize.addEventListener("valuechange", ({ detail }) => {
    if (state.fontSize === detail.value) return;
    state.fontSize = detail.value;
    elements.fontSizeValue.textContent = String(state.fontSize);
    saveDefaultPreferences();
    render();
  });

  elements.textColor.addEventListener("input", () => {
    setTextColor(elements.textColor.value);
  });

  elements.outlineColor.addEventListener("input", () => {
    setOutlineColor(elements.outlineColor.value);
    setStatus("Contour personnalisé");
  });

  bindPendingAction(elements.addToPageButton, addToPage);
  elements.queuePrev.addEventListener("click", () => { queueIndex -= 1; updateQueueUI(); });
  elements.queueNext.addEventListener("click", () => { queueIndex += 1; updateQueueUI(); });
  elements.queueRemove.addEventListener("click", removeFromQueue);
  bindPendingAction(elements.downloadButton, downloadPng);
  bindPendingAction(elements.downloadMirrorButton, () => downloadPng({ mirror: true }));
  bindPendingAction(elements.printButton, printMug);

  // Ctrl+P / Cmd+P prints the generated paper, not the editor page
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
      event.preventDefault();
      if (!elements.cropDialog.open && !elements.clearDialog.open) printMug();
    }
  });

  elements.mirrorPrint.addEventListener("checkedchange", ({ detail }) => {
    state.mirrorPrint = detail.value;
  });
  elements.clearDialog.addEventListener("openchange", ({ detail }) => {
    if (detail.value) return;
    if (detail.returnValue === "confirm") setTimeout(clearAll, 0);
    else setStatus("Suppression annulée");
  });

  renderIcons();
  updateProductUI();
  updateMousePadRows();
  buildImageShiftOverlay();
  rebuildWizardSteps();
  buildFontPreviewList();
  syncPreferenceControls();
  syncImageFileNames();
  updatePositionControls();
  updateRemoveButtons();
  updateCropButtons();
  updateImageShapeControls();
  updateFontPreviewSamples();
  updateWizardUI();
  resizeStage();
  render();
  updateSheetLayoutButtons();
  updateQueueUI();
  if (document.fonts) document.fonts.ready.then(render);

  function setStatus(message, isWarning = false) {
    if (!elements.status) return;
    elements.status.textContent = message;
    elements.status.classList.toggle("warning", isWarning);
  }

  function bindPendingAction(button, action) {
    const control = button.closest("ui-button");
    button.addEventListener("click", () => {
      if (!control.matches(":defined")) action();
    });
    control.addEventListener("action", (event) => {
      const pending = action();
      if (pending) event.detail.waitUntil(pending);
    });
  }

  function setActionDisabled(button, disabled) {
    button.closest("ui-button").toggleAttribute("disabled", disabled);
    if (button.disabled !== disabled) button.disabled = disabled;
  }

  function bindChoiceGroups() {
    const actions = {
      layout: (group, [value]) => {
        if (group.dataset.product === activeProduct) setLayoutPreset(value);
      },
      fit: (group, [value]) => setFitMode(group.dataset.imageSlot, value),
      shape: (group, [value]) => setImageShape(group.dataset.imageSlot, value),
      position: (group, [value]) => setImagePosition(group.dataset.imageSlot, group.dataset.axis, value),
      format: (_, values) => {
        for (const name of Object.keys(state.textFormat)) state.textFormat[name] = values.includes(name);
        updateFontPreviewSamples();
        saveDefaultPreferences();
        render();
      },
      "text-position": (_, [value]) => setTextPosition(value),
      "text-shape": (_, [value]) => setTextShape(value),
      color: (_, [value]) => {
        setTextColor(value);
        setStatus("Couleur choisie");
      },
      outline: (_, [value]) => {
        setOutlineColor(getOutlineColorFromPreset(value));
        setStatus("Contour choisi");
      },
      sheet: (_, [value]) => setSheetLayout(value),
      "crop-mode": (_, [value]) => {
        if (!cropDraft) return;
        cropDraft.mode = value;
        updateCropLayout();
      },
    };
    for (const group of elements.choiceGroups) {
      group.addEventListener("valuechange", ({ detail }) => {
        queueMicrotask(() => actions[group.dataset.selection](group, detail.value));
      });
    }
  }

  function syncChoices(kind, getValue) {
    for (const group of elements.choiceGroups) {
      if (group.dataset.selection !== kind) continue;
      const values = [getValue(group)].flat().filter(value => value !== undefined);
      if (group.matches(":defined")) {
        if (group.value.join(",") !== values.join(",")) group.value = values;
      } else {
        group.setAttribute("value", values.join(","));
      }
    }
  }

  function setControlValue(control, value) {
    if (control.matches(":defined")) {
      if (control.value !== value) control.value = value;
    } else {
      control.setAttribute("value", String(value));
    }
  }

  function setControlFlag(control, name, value) {
    if (control.matches(":defined")) {
      if (control[name] !== value) control[name] = value;
    } else {
      control.toggleAttribute(name, value);
    }
  }

  function buildMousePadControls() {
    const container = document.querySelector("#mousepadUploadList");
    if (!container || container.children.length) return;

    getMousePadUploadConfigs().forEach((config) => {
      const row = document.createElement("div");
      row.className = "upload-row";
      row.dataset.product = PRODUCT_MOUSEPAD;
      row.dataset.wizardStep = config.wizardStep;
      row.dataset.imageLoaded = "false";
      if (config.photoSlot) row.dataset.mousepadPhotoRow = config.slot;

      const label = document.createElement("div");
      label.className = "fit-label slot-label";
      label.innerHTML = `<span class="icon" aria-hidden="true"><i data-lucide="${config.icon}"></i></span><span>${config.label}</span>`;

      const main = document.createElement("div");
      main.className = "upload-main";

      main.innerHTML = `
        <ui-file-input-trigger for="${config.inputId}">
          <button class="upload-button" type="button">
            <span class="icon" aria-hidden="true"><i data-lucide="upload"></i></span>
            <span class="button-text">${config.buttonText}</span>
          </button>
        </ui-file-input-trigger>
        <ui-toggle-group class="segmented" data-selection="fit" data-image-slot="${config.slot}" data-advanced-control deselectable="false" aria-label="Ajustement de ${config.label.toLowerCase()}">
          <ui-toggle value="cut"><button class="mode-button" type="button" data-fit-slot="${config.slot}" data-fit-mode="cut">
            <span class="icon" aria-hidden="true"><i data-lucide="crop"></i></span>
            <span class="button-text">Remplir</span>
          </button></ui-toggle>
          <ui-toggle value="resize"><button class="mode-button" type="button" data-fit-slot="${config.slot}" data-fit-mode="resize">
            <span class="icon" aria-hidden="true"><i data-lucide="maximize-2"></i></span>
            <span class="button-text">Image entière</span>
          </button></ui-toggle>
        </ui-toggle-group>`;

      const input = document.createElement("ui-file-input");
      input.id = config.inputId;
      input.setAttribute("accept", "image/*");
      input.setAttribute("aria-label", config.label);
      input.dataset.imageInputSlot = config.slot;

      const fileRow = document.createElement("div");
      fileRow.className = "file-row";
      fileRow.innerHTML = `
        <div class="file-name" data-file-name-slot="${config.slot}">${DEFAULT_FILE_LABELS[config.slot]}</div>
        <ui-button><button class="slot-crop" type="button" data-crop-slot="${config.slot}" hidden aria-label="Cadrer ${config.label.toLowerCase()}">
          <span class="icon" aria-hidden="true"><i data-lucide="move"></i></span>
          <span class="button-text">Cadrer</span>
        </button></ui-button>
        <ui-button><button class="slot-remove" type="button" data-remove-slot="${config.slot}" hidden aria-label="Retirer ${config.label.toLowerCase()}">
          <span class="icon" aria-hidden="true"><i data-lucide="x"></i></span>
          <span class="button-text">Retirer</span>
        </button></ui-button>`;

      row.append(label, main, input, fileRow);

      if (config.photoSlot) {
        row.appendChild(createMousePadShapeControl(config.slot, config.label));
      }
      row.appendChild(createPositionGrid(config.slot, config.label));
      container.appendChild(row);
    });
  }

  function getMousePadUploadConfigs() {
    return [
      {
        slot: "background",
        label: "Fond",
        buttonText: "Image de fond",
        inputId: "mousepadBackgroundImage",
        wizardStep: "background",
        icon: "image-plus",
        photoSlot: false,
      },
      ...MOUSEPAD_PHOTO_SLOTS.map((slot, index) => ({
        slot,
        label: `Photo ${index + 1}`,
        buttonText: `Photo ${index + 1}`,
        inputId: `mousepadPhoto${index + 1}Image`,
        wizardStep: slot,
        icon: "upload",
        photoSlot: true,
      })),
    ];
  }

  function createMousePadShapeControl(slot, label) {
    const control = document.createElement("ui-collapsible");
    control.setAttribute("open", "");
    control.setAttribute("aria-label", `Forme de ${label.toLowerCase()}`);
    control.className = "image-shape-control";
    control.dataset.imageShapeControl = slot;
    control.dataset.advancedControl = "";
    control.hidden = true;
    control.innerHTML = `
            <ui-collapsible-trigger><button class="disclosure-button" type="button">Forme de l’image</button></ui-collapsible-trigger>
            <ui-collapsible-panel keep-mounted hidden>
              <ui-toggle-group class="image-shape-options" data-selection="shape" data-image-slot="${slot}" deselectable="false" aria-label="Forme de ${label.toLowerCase()}">
              <ui-toggle value="rectangle"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="rectangle"><span class="icon" aria-hidden="true"><i data-lucide="rectangle-horizontal"></i></span><span class="button-text">Rectangle</span></button></ui-toggle>
              <ui-toggle value="circle"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="circle"><span class="icon" aria-hidden="true"><i data-lucide="circle"></i></span><span class="button-text">Cercle</span></button></ui-toggle>
              <ui-toggle value="square"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="square"><span class="icon" aria-hidden="true"><i data-lucide="square"></i></span><span class="button-text">Carré</span></button></ui-toggle>
              <ui-toggle value="heart"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="heart"><span class="icon" aria-hidden="true"><i data-lucide="heart"></i></span><span class="button-text">Cœur</span></button></ui-toggle>
              <ui-toggle value="apple"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="apple"><span class="image-shape-apple-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 7.1C9.9 5 5.6 5.7 5.1 10.2c-.6 5.3 2.7 9.8 5.6 9.8 1.3 0 1.6-.8 2.6-.8s1.3.8 2.6.8c2.9 0 6.2-4.5 5.6-9.8C21 5.7 16.7 5 14.6 7.1L13.3 8.4z"/><path d="M13.1 5.9c.4-2.1 2-3.4 4.1-3.9.1 2.1-1.2 3.9-3.2 4.4"/></svg></span><span class="button-text">Pomme</span></button></ui-toggle>
              <ui-toggle value="star"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="star"><span class="icon" aria-hidden="true"><i data-lucide="star"></i></span><span class="button-text">Étoile</span></button></ui-toggle>
              <ui-toggle value="hexagon"><button class="mode-button" type="button" data-image-shape-slot="${slot}" data-image-shape="hexagon"><span class="icon" aria-hidden="true"><i data-lucide="hexagon"></i></span><span class="button-text">Hexagone</span></button></ui-toggle>
              </ui-toggle-group>
            </ui-collapsible-panel>`;
    return control;
  }

  function createPositionGrid(slot, label) {
    const grid = document.createElement("div");
    grid.className = "position-grid";
    grid.setAttribute("aria-label", `Position de ${label.toLowerCase()}`);
    grid.innerHTML = `
            <div class="position-control">
              <div class="axis-label">
                <span class="icon" aria-hidden="true"><i data-lucide="move-horizontal"></i></span>
                <span>Horizontal</span>
              </div>
              <ui-toggle-group class="button-group three position-buttons" data-selection="position" data-image-slot="${slot}" data-axis="x" deselectable="false" aria-label="Position horizontale de ${label.toLowerCase()}">
                <ui-toggle value="0"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="x" data-position-value="0" aria-label="${label} vers la gauche"><span class="icon" aria-hidden="true"><i data-lucide="arrow-left"></i></span></button></ui-toggle>
                <ui-toggle value="0.5"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="x" data-position-value="0.5" aria-label="${label} centrée"><span class="icon" aria-hidden="true"><i data-lucide="circle-dot"></i></span></button></ui-toggle>
                <ui-toggle value="1"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="x" data-position-value="1" aria-label="${label} vers la droite"><span class="icon" aria-hidden="true"><i data-lucide="arrow-right"></i></span></button></ui-toggle>
              </ui-toggle-group>
              <div class="position-percent-wrap">
                <input class="position-percent" type="number" min="0" max="100" step="1" value="50" data-position-input data-position-slot="${slot}" data-position-axis="x" aria-label="Position horizontale de ${label.toLowerCase()} en pourcentage">
                <span aria-hidden="true">%</span>
              </div>
            </div>
            <div class="position-control">
              <div class="axis-label">
                <span class="icon" aria-hidden="true"><i data-lucide="move-vertical"></i></span>
                <span>Vertical</span>
              </div>
              <ui-toggle-group class="button-group three position-buttons" data-selection="position" data-image-slot="${slot}" data-axis="y" deselectable="false" aria-label="Position verticale de ${label.toLowerCase()}">
                <ui-toggle value="0"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="y" data-position-value="0" aria-label="${label} en haut"><span class="icon" aria-hidden="true"><i data-lucide="arrow-up"></i></span></button></ui-toggle>
                <ui-toggle value="0.5"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="y" data-position-value="0.5" aria-label="${label} au milieu"><span class="icon" aria-hidden="true"><i data-lucide="circle-dot"></i></span></button></ui-toggle>
                <ui-toggle value="1"><button class="mode-button position-button" type="button" data-position-slot="${slot}" data-position-axis="y" data-position-value="1" aria-label="${label} en bas"><span class="icon" aria-hidden="true"><i data-lucide="arrow-down"></i></span></button></ui-toggle>
              </ui-toggle-group>
              <div class="position-percent-wrap">
                <input class="position-percent" type="number" min="0" max="100" step="1" value="50" data-position-input data-position-slot="${slot}" data-position-axis="y" aria-label="Position verticale de ${label.toLowerCase()} en pourcentage">
                <span aria-hidden="true">%</span>
              </div>
            </div>`;
    return grid;
  }

  function createMugState(preferences = getFactoryPreferences()) {
    return {
      layoutPreset: DEFAULT_LAYOUT,
      fitModes: pickSlotValues(preferences.fitModes, MUG_IMAGE_SLOTS),
      imageShapes: pickSlotValues(preferences.imageShapes, MUG_IMAGE_SLOTS),
      imagePositions: cloneImagePositions(DEFAULT_IMAGE_POSITIONS, MUG_IMAGE_SLOTS),
      imageScales: pickSlotValues(DEFAULT_IMAGE_SCALES, MUG_IMAGE_SLOTS),
      minimalMode: true,
      text: "",
      textPosition: preferences.textPosition,
      textFont: preferences.textFont,
      fontSize: preferences.fontSize,
      textColor: preferences.textColor,
      outlineColor: preferences.outlineColor,
      textFormat: { ...preferences.textFormat },
      textShape: preferences.textShape,
      mirrorPrint: true,
      images: Object.fromEntries(MUG_IMAGE_SLOTS.map((slot) => [slot, null])),
    };
  }

  function createMousePadState(preferences = getFactoryPreferences()) {
    return {
      layoutPreset: DEFAULT_MOUSE_PAD_LAYOUT,
      fitModes: pickSlotValues(
        {
          ...DEFAULT_FIT_MODES,
          background: "cut",
          photo1: "resize",
          photo2: "resize",
          photo3: "resize",
          photo4: "resize",
        },
        MOUSEPAD_IMAGE_SLOTS,
      ),
      imageShapes: pickSlotValues(DEFAULT_IMAGE_SHAPES, MOUSEPAD_IMAGE_SLOTS),
      imagePositions: cloneImagePositions(DEFAULT_IMAGE_POSITIONS, MOUSEPAD_IMAGE_SLOTS),
      imageScales: pickSlotValues(DEFAULT_IMAGE_SCALES, MOUSEPAD_IMAGE_SLOTS),
      minimalMode: true,
      text: "",
      textPosition: "bottom",
      textFont: preferences.textFont,
      fontSize: preferences.fontSize,
      textColor: preferences.textColor,
      outlineColor: preferences.outlineColor,
      textFormat: {
        ...preferences.textFormat,
        outline: true,
        shadow: true,
      },
      textShape: preferences.textShape,
      mirrorPrint: true,
      images: Object.fromEntries(MOUSEPAD_IMAGE_SLOTS.map((slot) => [slot, null])),
    };
  }

  function pickSlotValues(source, slots) {
    return Object.fromEntries(slots.map((slot) => [slot, source[slot]]));
  }

  function saveProductRuntime() {
    productRuntime[activeProduct] = {
      printQueue,
      queueIndex,
      sheetLayout,
      wizardStep,
      quickTextEditing,
    };
  }

  function loadProductRuntime(product) {
    const runtime = productRuntime[product];
    printQueue = runtime.printQueue;
    queueIndex = runtime.queueIndex;
    sheetLayout = runtime.sheetLayout;
    wizardStep = runtime.wizardStep;
    quickTextEditing = runtime.quickTextEditing;
  }

  function getFactoryPreferences() {
    return {
      fitModes: { ...DEFAULT_FIT_MODES },
      imageShapes: { ...DEFAULT_IMAGE_SHAPES },
      textPosition: "center",
      textFont: DEFAULT_TEXT_FONT,
      fontSize: DEFAULT_FONT_SIZE,
      textColor: DEFAULT_TEXT_COLOR,
      outlineColor: getDefaultOutlineColor(DEFAULT_TEXT_COLOR),
      textFormat: { ...DEFAULT_TEXT_FORMAT },
      textShape: DEFAULT_TEXT_SHAPE,
      sheetLayout: "3up",
    };
  }

  function loadDefaultPreferences() {
    const fallback = getFactoryPreferences();

    try {
      const raw = window.localStorage?.getItem(PREFERENCES_STORAGE_KEY);
      if (!raw) return fallback;

      return normalizePreferences(JSON.parse(raw), fallback);
    } catch (error) {
      console.warn("Default preference loading failed", error);
      return fallback;
    }
  }

  function normalizePreferences(input, fallback = getFactoryPreferences()) {
    const saved = input && typeof input === "object" ? input : {};
    const textColor = normalizeHex(saved.textColor || fallback.textColor);
    const fontSize = Number(saved.fontSize);

    return {
      fitModes: normalizeFitModePreferences(saved.fitModes, fallback.fitModes),
      imageShapes: normalizeImageShapePreferences(saved.imageShapes, fallback.imageShapes),
      textPosition: ["top", "center", "bottom"].includes(saved.textPosition)
        ? saved.textPosition
        : fallback.textPosition,
      textFont: FONT_OPTIONS[saved.textFont] ? saved.textFont : fallback.textFont,
      fontSize: Number.isFinite(fontSize)
        ? Math.min(220, Math.max(64, Math.round(fontSize)))
        : fallback.fontSize,
      textColor,
      outlineColor: normalizeHex(saved.outlineColor || getDefaultOutlineColor(textColor)),
      textFormat: normalizeTextFormatPreferences(saved.textFormat, fallback.textFormat),
      textShape: Object.prototype.hasOwnProperty.call(TEXT_SHAPES, saved.textShape) ? saved.textShape : fallback.textShape,
      sheetLayout: SHEET_LAYOUTS[saved.sheetLayout] ? saved.sheetLayout : fallback.sheetLayout,
    };
  }

  function normalizeFitModePreferences(input, fallback) {
    const saved = input && typeof input === "object" ? input : {};
    return Object.fromEntries(
      Object.keys(DEFAULT_FIT_MODES).map((slot) => [
        slot,
        ["cut", "resize"].includes(saved[slot]) ? saved[slot] : fallback[slot],
      ]),
    );
  }

  function normalizeImageShapePreferences(input, fallback) {
    const saved = input && typeof input === "object" ? input : {};
    return Object.fromEntries(
      Object.keys(DEFAULT_IMAGE_SHAPES).map((slot) => [
        slot,
        Object.prototype.hasOwnProperty.call(IMAGE_SHAPES, saved[slot]) ? saved[slot] : fallback[slot],
      ]),
    );
  }

  function normalizeTextFormatPreferences(input, fallback) {
    const saved = input && typeof input === "object" ? input : {};
    return Object.fromEntries(
      Object.keys(DEFAULT_TEXT_FORMAT).map((key) => [key, typeof saved[key] === "boolean" ? saved[key] : fallback[key]]),
    );
  }

  function saveDefaultPreferences() {
    try {
      window.localStorage?.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          fitModes: state.fitModes,
          imageShapes: state.imageShapes,
          textPosition: state.textPosition,
          textFont: state.textFont,
          fontSize: state.fontSize,
          textColor: state.textColor,
          outlineColor: state.outlineColor,
          textFormat: state.textFormat,
          textShape: state.textShape,
          sheetLayout,
        }),
      );
    } catch (error) {
      console.warn("Default preference saving failed", error);
    }
  }

  function syncPreferenceControls() {
    setControlValue(elements.textEditor, state.text);
    setControlValue(elements.fontSelect, state.textFont);
    setControlValue(elements.fontSize, state.fontSize);
    elements.fontSizeValue.textContent = String(state.fontSize);
    setControlFlag(elements.mirrorPrint, "checked", state.mirrorPrint);
    updateLayoutButtons();
    updateMinimalMode();
    updateFitButtons();
    updateImageShapeControls();
    updateTextFormatButtons();
    updateTextPositionButtons();
    updateTextShapeButtons();
    updateColorControls();
    updateSheetLayoutButtons();
  }

  function cloneImagePositions(source, slots = Object.keys(source)) {
    return Object.fromEntries(slots.map((slot) => [slot, { ...source[slot] }]));
  }

  function getZones() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      return {
        background: {
          x: 0,
          y: 0,
          width: MOUSE_PAD_EXPORT_WIDTH,
          height: MOUSE_PAD_EXPORT_HEIGHT,
        },
        ...getMousePadZones(state.layoutPreset, {
          width: MOUSE_PAD_EXPORT_WIDTH,
          height: MOUSE_PAD_EXPORT_HEIGHT,
        }),
      };
    }

    return MUG_LAYOUT_PRESETS[state.layoutPreset] || MUG_LAYOUT_PRESETS[DEFAULT_LAYOUT];
  }

  function renderIcons(root = document) {
    window.lucide?.createIcons({
      root,
      attrs: {
        "aria-hidden": "true",
        focusable: "false",
      },
    });
  }

  function toggleProductMode() {
    setActiveProduct(activeProduct === PRODUCT_MUG ? PRODUCT_MOUSEPAD : PRODUCT_MUG);
  }

  function setActiveProduct(product) {
    if (![PRODUCT_MUG, PRODUCT_MOUSEPAD].includes(product) || product === activeProduct) return;

    saveProductRuntime();
    productStates[activeProduct] = state;
    activeProduct = product;
    elements.uploadError.hidden = true;
    state = productStates[activeProduct];
    loadProductRuntime(activeProduct);
    applyQuickModeDefaults();
    updateProductUI();
    updateMousePadRows();
    buildImageShiftOverlay();
    rebuildWizardSteps();
    syncPreferenceControls();
    syncImageFileNames();
    updatePositionControls();
    updateRemoveButtons();
    updateCropButtons();
    updateImageShapeControls();
    updateFontPreviewSamples();
    updateWizardUI();
    updateQueueUI();
    resizeStage();
    render();
    setStatus(activeProduct === PRODUCT_MOUSEPAD ? "Mode tapis souris" : "Mode mug");
  }

  function updateProductUI() {
    const labels = PRODUCT_LABELS[activeProduct];
    document.body.dataset.product = activeProduct;
    elements.controls.setAttribute("aria-label", labels.controlsAria);
    elements.preview.setAttribute("aria-label", labels.previewAria);
    elements.previewMeta.textContent = labels.previewMeta;
    elements.previewSizeMeta.textContent = labels.sizeMeta;
    elements.currentProductLabel.textContent = labels.currentLabel;
    elements.productSwitchText.textContent = labels.switchLabel;
    elements.productSwitchButton.setAttribute("aria-label", labels.switchAria);
    elements.productSwitchIcon.innerHTML = `<i data-lucide="${labels.switchIcon}"></i>`;
    renderIcons(elements.productSwitchIcon);
  }

  function getActiveImageSlots() {
    return activeProduct === PRODUCT_MOUSEPAD
      ? MOUSEPAD_IMAGE_SLOTS
      : MUG_IMAGE_SLOTS;
  }

  function getRenderableImageSlots() {
    if (activeProduct !== PRODUCT_MOUSEPAD) return MUG_IMAGE_SLOTS;
    return ["background", ...getRequiredMousePadPhotoSlots()];
  }

  function getRequiredMousePadPhotoSlots() {
    return getMousePadPhotoSlots(state.layoutPreset);
  }

  function updateMousePadRows() {
    if (!elements?.mousepadPhotoRows) return;
    const required = new Set(
      activeProduct === PRODUCT_MOUSEPAD ? getRequiredMousePadPhotoSlots() : [],
    );
    elements.mousepadPhotoRows.forEach((row) => {
      row.dataset.layoutSlotHidden = required.has(row.dataset.mousepadPhotoRow) ? "false" : "true";
    });
  }

  function getWizardSteps() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      return ["layout", "background", ...getRequiredMousePadPhotoSlots(), "text", "done"];
    }

    return MUG_WIZARD_STEPS;
  }

  function getWizardStepConfig(step, index) {
    const labels = {
      left: ["Gauche", "image gauche"],
      right: ["Droite", "image droite"],
      text: ["Texte", "texte et couleur"],
      done: ["Imprimer", "imprimer"],
      layout: ["Format", "disposition du tapis souris"],
      background: ["Fond", "fond facultatif"],
    };
    const photo = step.match(/^photo([1-4])$/);
    const [label, description] = photo ? [`Photo ${photo[1]}`, `photo ${photo[1]}`] : labels[step];
    return { label, aria: `Étape ${index + 1} ${description}` };
  }

  function rebuildWizardSteps() {
    const steps = getWizardSteps();
    const signature = `${activeProduct}:${steps.join("|")}`;
    if (elements.wizardSteps.dataset.signature === signature) return;

    elements.wizardSteps.dataset.signature = signature;
    elements.wizardSteps.textContent = "";
    steps.forEach((step, index) => {
      const config = getWizardStepConfig(step, index);
      const button = document.createElement("button");
      button.className = "wizard-step";
      button.type = "button";
      button.dataset.wizardGo = step;
      button.setAttribute("aria-label", config.aria);
      button.innerHTML = `
              <span class="wizard-number" aria-hidden="true">${index + 1}</span>
              <span class="wizard-label">${config.label}</span>`;
      const action = document.createElement("ui-button");
      action.appendChild(button);
      elements.wizardSteps.appendChild(action);
    });
    elements.wizardStepButtons = Array.from(elements.wizardSteps.querySelectorAll("[data-wizard-go]"));
  }

  function buildImageShiftOverlay() {
    elements.imageShiftOverlay.textContent = "";
    getRenderableImageSlots().forEach((slot) => {
      const zone = document.createElement("div");
      zone.className = "image-shift-zone";
      zone.dataset.shiftZone = slot;
      zone.hidden = true;

      const pad = document.createElement("div");
      pad.className = "image-shift-pad";

      Object.entries(IMAGE_SHIFT_DIRECTIONS).forEach(([direction, config]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "image-shift-button";
        button.dataset.nudgeSlot = slot;
        button.dataset.nudgeDirection = direction;
        button.setAttribute("aria-label", `${config.label} ${IMAGE_SLOT_LABELS[slot]}`);

        const icon = document.createElement("span");
        icon.className = "icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `<i data-lucide="${config.icon}"></i>`;
        button.appendChild(icon);
        const action = document.createElement("ui-button");
        action.appendChild(button);
        pad.appendChild(action);
      });

      zone.appendChild(pad);
      elements.imageShiftOverlay.appendChild(zone);
    });
    renderIcons(elements.imageShiftOverlay);
    updateImageShiftOverlay();
  }

  function updateImageShiftOverlay() {
    const zones = getZones();
    elements.imageShiftOverlay.querySelectorAll("[data-shift-zone]").forEach((zoneElement) => {
      const slot = zoneElement.dataset.shiftZone;
      const zone = zones[slot];
      const hasImage = Boolean(state.images[slot]);
      zoneElement.hidden = state.minimalMode || !hasImage || !zone;
      if (!zone) return;

      zoneElement.style.left = `${Math.round(previewOffset.x + zone.x * previewScale)}px`;
      zoneElement.style.top = `${Math.round(previewOffset.y + zone.y * previewScale)}px`;
      zoneElement.style.width = `${Math.round(zone.width * previewScale)}px`;
      zoneElement.style.height = `${Math.round(zone.height * previewScale)}px`;
    });
  }

  function nudgeImagePosition(slot, direction) {
    const config = IMAGE_SHIFT_DIRECTIONS[direction];
    if (state.minimalMode || !config || !state.images[slot] || !state.imagePositions[slot]) return;

    const current = state.imagePositions[slot][config.axis];
    const next = Math.min(1, Math.max(0, current + config.delta));
    setImagePosition(slot, config.axis, next);
    setStatus("Image déplacée");
  }

  function buildFontPreviewList() {
    elements.fontPreviewList.textContent = "";
    FONT_GROUPS.forEach((group) => {
      const groupElement = document.createElement("ui-select-group");
      groupElement.className = "font-preview-group";

      const title = document.createElement("ui-select-group-label");
      title.className = "font-preview-group-title";
      title.textContent = group.label;
      groupElement.appendChild(title);

      group.keys.forEach((fontKey) => {
        if (!FONT_OPTIONS[fontKey]) return;

        const label = FONT_LABELS[fontKey] || fontKey;
        const option = document.createElement("ui-select-item");
        option.className = "font-preview-option";
        option.setAttribute("value", fontKey);
        option.setAttribute("label", label);

        const name = document.createElement("span");
        name.className = "font-preview-name";
        name.textContent = label;

        const sample = document.createElement("span");
        sample.className = "font-preview-sample";
        sample.setAttribute("aria-hidden", "true");
        sample.style.fontFamily = getFontFamily(fontKey);

        option.append(name, sample);
        groupElement.appendChild(option);
      });

      elements.fontPreviewList.appendChild(groupElement);
    });
  }

  function updateFontPreviewSamples() {
    const previewText = getFontPreviewText();
    const direction = getTextDirection(previewText);
    const fontWeight = state.textFormat.bold ? "700" : "400";
    const fontStyle = state.textFormat.italic ? "italic" : "normal";
    const textShadow = state.textFormat.shadow ? "0 3px 5px rgba(0, 0, 0, 0.22)" : "none";

    elements.fontPreviewList.querySelectorAll(".font-preview-sample").forEach((sample) => {
      sample.textContent = previewText;
      sample.dir = direction;
      sample.style.color = state.textColor;
      sample.style.fontWeight = fontWeight;
      sample.style.fontStyle = fontStyle;
      sample.style.textShadow = textShadow;
      sample.style.webkitTextStroke = state.textFormat.outline ? `1px ${state.outlineColor}` : "";
    });
  }

  function* splitGraphemes(text) {
    if (!graphemeSegmenter) {
      yield* text;
      return;
    }
    for (const { segment } of graphemeSegmenter.segment(text)) yield segment;
  }

  function getFontPreviewText() {
    const text = state.text.trim().replace(/\s+/g, " ");
    if (!text) return "Votre texte نصك هنا";

    let sample = "";
    let count = 0;
    for (const segment of splitGraphemes(text)) {
      if (count === 48) return `${sample.trimEnd()}…`;
      sample += segment;
      count += 1;
    }
    return sample;
  }

  function getFontFamily(fontKey) {
    return FONT_OPTIONS[fontKey] || FONT_OPTIONS[DEFAULT_TEXT_FONT];
  }

  function setLayoutPreset(layout) {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      state.layoutPreset = MOUSE_PAD_LAYOUTS[layout] ? layout : DEFAULT_MOUSE_PAD_LAYOUT;
      updateMousePadRows();
      buildImageShiftOverlay();
      rebuildWizardSteps();
      updateWizardUI();
      resizeStage();
    } else {
      state.layoutPreset = MUG_LAYOUT_PRESETS[layout] ? layout : DEFAULT_LAYOUT;
    }
    updateLayoutButtons();
    render();
  }

  function updateLayoutButtons() {
    syncChoices("layout", group => productStates[group.dataset.product].layoutPreset);
  }

  function setMinimalMode(isEnabled) {
    state.minimalMode = Boolean(isEnabled);
    if (!state.minimalMode) quickTextEditing = false;
    if (state.minimalMode) {
      applyQuickModeDefaults();
      state.mirrorPrint = true;
      setControlFlag(elements.mirrorPrint, "checked", true);
      wizardStep = getWizardSteps()[getUnlockedWizardStepIndex()];
      updateLayoutButtons();
      updateFitButtons();
      updatePositionControls();
    }
    updateMinimalMode();
    updateWizardUI();
    updateImageShiftOverlay();
    render();
  }

  function applyQuickModeDefaults() {
    if (!state.minimalMode) return;

    if (activeProduct === PRODUCT_MOUSEPAD) {
      state.fitModes = pickSlotValues(QUICK_FIT_MODES, MOUSEPAD_IMAGE_SLOTS);
      state.imageShapes = pickSlotValues(DEFAULT_IMAGE_SHAPES, MOUSEPAD_IMAGE_SLOTS);
      state.imagePositions = cloneImagePositions(DEFAULT_IMAGE_POSITIONS, MOUSEPAD_IMAGE_SLOTS);
      state.imageScales = pickSlotValues(DEFAULT_IMAGE_SCALES, MOUSEPAD_IMAGE_SLOTS);
      return;
    }

    state.layoutPreset = DEFAULT_LAYOUT;
    state.fitModes = pickSlotValues(QUICK_FIT_MODES, MUG_IMAGE_SLOTS);
    state.imageShapes.center = DEFAULT_IMAGE_SHAPES.center;
    state.imagePositions = cloneImagePositions(DEFAULT_IMAGE_POSITIONS, MUG_IMAGE_SLOTS);
    state.imageScales = pickSlotValues(DEFAULT_IMAGE_SCALES, MUG_IMAGE_SLOTS);
  }

  function updateMinimalMode() {
    setControlFlag(elements.minimalMode, "checked", state.minimalMode);
    document.body.classList.toggle("minimal-mode", state.minimalMode);
    setControlFlag(elements.textAppearance, "open", !state.minimalMode);
    elements.imageShapeControls.forEach((control) => {
      setControlFlag(control, "open", !state.minimalMode);
    });
  }

  function setQuickTextEditor(isEditing) {
    quickTextEditing = Boolean(isEditing) && state.minimalMode && wizardStep === "text";
    updateWizardUI();

    window.requestAnimationFrame(() => {
      if (quickTextEditing) {
        elements.textInput.focus();
        const end = elements.textInput.value.length;
        elements.textInput.setSelectionRange(end, end);
        return;
      }
      elements.quickTextEditButton.focus();
    });
  }

  function updateQuickTextEditorUI() {
    const isAvailable = state.minimalMode && wizardStep === "text";
    if (!isAvailable) quickTextEditing = false;
    if (state.minimalMode && !quickTextEditing) setControlFlag(elements.textAppearance, "open", false);
    document.body.classList.toggle("quick-text-editor", quickTextEditing);
    elements.quickTextEditButtonText.textContent = hasTextEntry()
      ? "Modifier le texte"
      : "Ajouter du texte";
  }

  function setWizardStep(step) {
    const steps = getWizardSteps();
    const index = steps.indexOf(step);
    if (index === -1 || index > getUnlockedWizardStepIndex()) return;

    wizardStep = step;
    updateWizardUI();
    focusWizardStep();
  }

  function goToPreviousWizardStep() {
    const steps = getWizardSteps();
    const index = steps.indexOf(wizardStep);
    if (index <= 0) return;
    setWizardStep(steps[index - 1]);
  }

  function goToNextWizardStep() {
    if (quickTextEditing) {
      setQuickTextEditor(false);
      return;
    }

    if (!canProceedWizardStep(wizardStep)) {
      updateWizardUI();
      return;
    }

    const steps = getWizardSteps();
    const index = steps.indexOf(wizardStep);
    const nextStep = steps[Math.min(index + 1, steps.length - 1)];
    wizardStep = nextStep;
    updateWizardUI();
    focusWizardStep();
  }

  function handleWizardEnterKey(event) {
    if (
      !state.minimalMode ||
      event.defaultPrevented ||
      elements.cropDialog.open ||
      elements.clearDialog.open ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing
    ) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("ui-select, ui-slider, ui-checkbox, ui-switch")) return;
    if (target?.closest("button, select, input[type='color']") && target !== elements.textInput) return;
    if (quickTextEditing && target === elements.textInput) return;
    if (!canProceedWizardStep(wizardStep)) return;

    event.preventDefault();
    goToNextWizardStep();
  }

  function focusWizardStep() {
    if (!state.minimalMode) return;

    window.requestAnimationFrame(() => {
      if (wizardStep === "text") {
        const textControl = quickTextEditing ? elements.textInput : elements.quickTextEditButton;
        textControl.focus();
        if (quickTextEditing) {
          const end = elements.textInput.value.length;
          elements.textInput.setSelectionRange(end, end);
        }
        return;
      }

      if (wizardStep === "done") {
        elements.printButton.focus();
      }
    });
  }

  function getUnlockedWizardStepIndex() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      const steps = getWizardSteps();
      const firstRequiredIndex = steps.findIndex((step) => MOUSEPAD_PHOTO_SLOTS.includes(step));
      if (firstRequiredIndex === -1) return steps.length - 1;

      let unlockedIndex = firstRequiredIndex;
      for (const slot of getRequiredMousePadPhotoSlots()) {
        const index = steps.indexOf(slot);
        if (!state.images[slot]) return index;
        unlockedIndex = index + 1;
      }
      return Math.min(steps.length - 1, unlockedIndex + 1);
    }

    if (state.images.left && state.images.right) return hasTextEntry() && state.textFits !== false ? 3 : 2;
    if (state.images.left) return 1;
    return 0;
  }

  function canCompleteWizardStep(step) {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      if (step === "layout" || step === "background") return true;
      if (MOUSEPAD_PHOTO_SLOTS.includes(step)) return Boolean(state.images[step]);
    }

    if (step === "left") return Boolean(state.images.left);
    if (step === "right") return Boolean(state.images.right);
    if (step === "text") return hasTextEntry() && state.textFits !== false;
    return true;
  }

  function canProceedWizardStep(step) {
    return canCompleteWizardStep(step) || canSkipWizardStep(step);
  }

  function canSkipWizardStep(step) {
    return activeProduct === PRODUCT_MOUSEPAD && step === "background";
  }

  function hasTextEntry() {
    return state.text.length > 0;
  }

  function updateWizardUI() {
    rebuildWizardSteps();
    const unlockedIndex = getUnlockedWizardStepIndex();
    const steps = getWizardSteps();
    const previousStep = document.body.dataset.wizardStep;
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex === -1 || currentIndex > unlockedIndex) {
      wizardStep = steps[unlockedIndex];
    }
    document.body.dataset.wizardStep = state.minimalMode ? wizardStep : "advanced";
    if (document.body.dataset.wizardStep !== previousStep) elements.uploadError.hidden = true;
    updateQuickTextEditorUI();

    elements.wizardStepPanels.forEach((panel) => {
      if (!state.minimalMode) {
        panel.removeAttribute("data-wizard-active");
        return;
      }

      if (panel.dataset.wizardStep === wizardStep) {
        panel.dataset.wizardActive = "true";
        return;
      }
      panel.removeAttribute("data-wizard-active");
    });

    elements.wizardStepButtons.forEach((button) => {
      const index = steps.indexOf(button.dataset.wizardGo);
      const current = button.dataset.wizardGo === wizardStep ? "step" : "false";
      setActionDisabled(button, index > unlockedIndex);
      if (button.getAttribute("aria-current") !== current) button.setAttribute("aria-current", current);
    });

    const isDone = wizardStep === "done";
    elements.wizardNav.hidden = !state.minimalMode;
    elements.wizardNext.hidden = isDone;
    setActionDisabled(elements.wizardBack, steps.indexOf(wizardStep) === 0);
    setActionDisabled(elements.wizardNext, !quickTextEditing && !canProceedWizardStep(wizardStep));
    elements.wizardNextText.textContent = quickTextEditing
      ? "Terminer le texte"
      : wizardStep === "text"
        ? (hasTextEntry() ? "Accepter" : "Texte requis")
        : wizardStep === "background"
          ? (state.images.background ? "Suivant" : "Continuer sans fond")
          : "Suivant";
    updatePreviewActionButton();
  }

  function getPreviewAction() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      if (wizardStep === "layout") {
        return { action: "next", icon: "arrow-right", label: "Suivant" };
      }

      if (wizardStep === "background") {
        return state.images.background
          ? { action: "next", icon: "arrow-right", label: "Suivant" }
          : { action: "background-upload", icon: "image-plus", label: "Fond facultatif" };
      }

      if (MOUSEPAD_PHOTO_SLOTS.includes(wizardStep)) {
        return state.images[wizardStep]
          ? { action: "next", icon: "arrow-right", label: "Suivant" }
          : { action: `${wizardStep}-upload`, icon: "upload", label: getSlotButtonLabel(wizardStep) };
      }
    }

    if (wizardStep === "left") {
      return state.images.left
        ? { action: "next", icon: "arrow-right", label: "Suivant" }
        : { action: "left-upload", icon: "upload", label: "Image gauche" };
    }

    if (wizardStep === "right") {
      return state.images.right
        ? { action: "next", icon: "arrow-right", label: "Suivant" }
        : { action: "right-upload", icon: "upload", label: "Image droite" };
    }

    if (wizardStep === "text") {
      return {
        action: "next",
        icon: "check",
        label: quickTextEditing
          ? "Terminer le texte"
          : hasTextEntry() ? "Accepter" : "Texte requis",
      };
    }

    return { action: "print", icon: "printer", label: "Imprimer" };
  }

  function getSlotButtonLabel(slot) {
    if (slot === "background") return "Image de fond";
    const index = MOUSEPAD_PHOTO_SLOTS.indexOf(slot);
    return index === -1 ? "Image" : `Photo ${index + 1}`;
  }

  function updatePreviewActionButton() {
    const config = getPreviewAction();
    elements.previewActionButton.dataset.previewAction = config.action;
    const action = elements.previewActionButton.closest("ui-button");
    if (config.action === "print") action.setAttribute("data-agent-confirm", "Ouvre l’impression du visuel.");
    else action.removeAttribute("data-agent-confirm");
    setActionDisabled(
      elements.previewActionButton,
      config.action === "next" && !quickTextEditing && !canProceedWizardStep(wizardStep),
    );
    elements.previewActionText.textContent = config.label;
    updatePreviewActionIcon(config.icon);
  }

  function updatePreviewActionIcon(icon) {
    if (elements.previewActionIcon.dataset.icon === icon) return;

    elements.previewActionIcon.innerHTML = `<i data-lucide="${icon}"></i>`;
    elements.previewActionIcon.dataset.icon = icon;
    renderIcons(elements.previewActionIcon);
  }

  function handlePreviewAction() {
    if (!state.minimalMode) return;

    const action = elements.previewActionButton.dataset.previewAction;
    if (action.endsWith("-upload")) {
      const slot = action.replace(/-upload$/, "");
      const input = getImageInput(slot);
      if (input?.api) {
        input.api.open();
      } else if (input) {
        elements.previewFileInput.dataset.imageSlot = slot;
        elements.previewFileInput.click();
      }
      return;
    }
    if (action === "print") return printMug();

    goToNextWizardStep();
  }

  function handleStageFrameClick(event) {
    if (!state.minimalMode || wizardStep !== "text") return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("#previewActionButton")) return;

    focusWizardStep();
  }

  function setFitMode(slot, mode) {
    state.fitModes[slot] = mode;
    if (mode === "resize") {
      state.imageScales[slot] = DEFAULT_IMAGE_SCALE;
      state.imagePositions[slot] = { ...DEFAULT_IMAGE_POSITION };
      updatePositionControls();
    }
    updateFitButtons();
    saveDefaultPreferences();
    render();
  }

  function updateFitButtons() {
    syncChoices("fit", group => state.fitModes[group.dataset.imageSlot]);
  }

  function setImageShape(slot, shape) {
    if (!state.imageShapes[slot] || !Object.prototype.hasOwnProperty.call(IMAGE_SHAPES, shape)) return;

    state.imageShapes[slot] = shape;
    if (state.minimalMode) {
      const control = elements.imageShapeControls.find((item) => item.dataset.imageShapeControl === slot);
      if (control?.open) {
        control.open = false;
        control.api.focus();
      }
    }
    updateImageShapeControls();
    saveDefaultPreferences();
    render();
  }

  function updateImageShapeControls() {
    for (const [slot, input] of Object.entries(elements.imageInputs)) {
      input.closest(".upload-row")?.setAttribute("data-image-loaded", String(Boolean(state.images[slot])));
    }
    elements.imageShapeControls.forEach((control) => {
      control.hidden = !state.images[control.dataset.imageShapeControl];
    });
    syncChoices("shape", group => state.imageShapes[group.dataset.imageSlot]);
    updateQuickCenterImageControl();
  }

  function updateQuickCenterImageControl() {
    const hasImage = Boolean(state.images.center);
    elements.quickCenterImage.dataset.imageLoaded = String(hasImage);
    elements.quickCenterUploadText.textContent = hasImage
      ? "Remplacer l'image centrale"
      : "Ajouter une image centrale (facultatif)";
    elements.quickCenterDetails.hidden = !hasImage;
  }

  function setImagePosition(slot, axis, value) {
    if (state.minimalMode) return;
    if (!state.imagePositions[slot] || !["x", "y"].includes(axis)) return;

    const position = clampPosition(value);
    if (position === null) return;

    state.imagePositions[slot][axis] = position;
    updatePositionControls();
    render();
  }

  function removeImage(slot) {
    if (!state.images.hasOwnProperty(slot)) return;

    state.images[slot] = null;
    state.imagePositions[slot] = { ...DEFAULT_IMAGE_POSITION };
    state.imageScales[slot] = DEFAULT_IMAGE_SCALE;
    getImageInput(slot)?.api?.clear();
    setFileName(slot, DEFAULT_FILE_LABELS[slot]);
    updateRemoveButtons();
    updateCropButtons();
    updateImageShapeControls();
    updatePositionControls();
    updateWizardUI();
    setStatus("Image retirée");
    render();
  }

  function getImageInput(slot) {
    return elements.imageInputs[slot] || null;
  }

  function updatePositionControls() {
    syncChoices("position", group => {
      const value = state.imagePositions[group.dataset.imageSlot]?.[group.dataset.axis];
      if ([0, 0.5, 1].includes(value)) return String(value);
    });
    elements.positionInputs.forEach((input) => {
      const position = state.imagePositions[input.dataset.positionSlot];
      if (!position) return;
      input.value = getPositionPercent(position[input.dataset.positionAxis]);
    });
  }

  function setTextColor(color, options = {}) {
    const normalized = normalizeHex(color);
    state.textColor = normalized;
    elements.textColor.value = normalized;
    if (options.syncOutline !== false) {
      state.outlineColor = getDefaultOutlineColor(normalized);
    }
    updateColorControls();
    updateFontPreviewSamples();
    saveDefaultPreferences();
    render();
  }

  function setOutlineColor(color) {
    state.outlineColor = normalizeHex(color);
    state.textFormat.outline = true;
    updateTextFormatButtons();
    updateColorControls();
    updateFontPreviewSamples();
    saveDefaultPreferences();
    render();
  }

  function updateColorControls() {
    elements.textColor.value = state.textColor;
    elements.outlineColor.value = state.outlineColor;
    syncChoices("color", group => {
      if (group.querySelector(`ui-toggle[value="${state.textColor}"]`)) return state.textColor;
    });
    let activeOutline;
    for (const button of elements.outlinePresetButtons) {
      const color = getOutlineColorFromPreset(button.dataset.outlinePreset);
      button.style.background = color;
      if (normalizeHex(color) === state.outlineColor) activeOutline ??= button.dataset.outlinePreset;
    }
    syncChoices("outline", () => activeOutline);
  }

  function getOutlineColorFromPreset(presetId) {
    const preset = OUTLINE_PRESETS.find((item) => item.id === presetId) || OUTLINE_PRESETS[0];
    return preset.tonal ? getTonalOutlineColor(state.textColor) : preset.color;
  }

  function updateTextFormatButtons() {
    syncChoices("format", () => Object.keys(state.textFormat).filter(key => state.textFormat[key]));
  }

  function setTextPosition(position) {
    if (!["top", "center", "bottom"].includes(position)) return;

    state.textPosition = position;
    updateTextPositionButtons();
    saveDefaultPreferences();
    render();
  }

  function updateTextPositionButtons() {
    syncChoices("text-position", () => state.textPosition);
  }

  function setTextShape(shape) {
    if (!Object.prototype.hasOwnProperty.call(TEXT_SHAPES, shape)) return;

    state.textShape = shape;
    updateTextShapeButtons();
    saveDefaultPreferences();
    render();
  }

  function updateTextShapeButtons() {
    syncChoices("text-shape", () => state.textShape);
  }

  function setTextFont(fontKey) {
    if (!FONT_OPTIONS[fontKey] || state.textFont === fontKey) return;
    state.textFont = fontKey;
    saveDefaultPreferences();
    setStatus("Police choisie");
    render();
    ensureTextFontLoaded().then(render);
  }

  async function ensureTextFontLoaded(fontSize = state.fontSize) {
    if (!document.fonts) return;

    try {
      await document.fonts.load(getCanvasFont(fontSize));
    } catch (error) {
      console.warn("Font loading failed", error);
    }
  }

  async function handleFile(file, slot) {
    const input = getImageInput(slot);
    const targetState = state;
    elements.uploadError.hidden = true;
    try {
      const [image] = await Promise.all([
        loadImage(file),
        customElements.whenDefined("ui-dialog-content"),
      ]);
      if (state !== targetState || input.value[0] !== file) return;
      openImageCropDialog(slot, {
        image,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    } catch {
      if (state !== targetState || input.value[0] !== file) return;
      input.api.clear();
      showUploadError(slot);
    }
  }

  function showUploadError(slot) {
    const message = "Impossible de lire cette image. Essayez un fichier JPEG, PNG ou WebP.";
    const container = state.minimalMode
      ? slot === "center" ? elements.quickCenterImage : elements.preview
      : getImageInput(slot)?.closest(".upload-row") || elements.preview;
    container.appendChild(elements.uploadError);
    elements.uploadError.textContent = message;
    elements.uploadError.hidden = false;
    setStatus(message, true);
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function openImageCropDialog(slot, item) {
    const existingItem = state.images[slot];
    const isReframingCurrentImage = existingItem === item;
    cropDraft = {
      slot,
      item,
      opener: document.activeElement,
      edges: { ...FULL_CROP, ...item.edges },
      offset: { x: 0, y: 0, ...item.offset },
      mode: isReframingCurrentImage ? state.fitModes[slot] : "cut",
      position: isReframingCurrentImage
        ? { ...state.imagePositions[slot] }
        : { ...DEFAULT_IMAGE_POSITION },
      scale: isReframingCurrentImage ? state.imageScales[slot] : DEFAULT_IMAGE_SCALE,
    };
    if (item.trim && !item.edges) {
      const zone = getCropTargetBounds(slot);
      const base = getPlacement(item, zone, cropDraft.mode, cropDraft.position, cropDraft.scale);
      const x = Math.max(zone.x, base.x);
      const y = Math.max(zone.y, base.y);
      cropDraft.edges = {
        left: (x - base.x) / base.width,
        top: (y - base.y) / base.height,
        right: (x - base.x + Math.min(base.width, zone.width) * item.trim.width) / base.width,
        bottom: (y - base.y + Math.min(base.height, zone.height) * item.trim.height) / base.height,
      };
    }
    elements.cropPreviewImage.src = item.image.src;
    elements.cropOffcut.src = item.image.src;
    const target = getCropTargetBounds(slot);
    elements.cropModes.forEach((button) => {
      const thumbnail = button.querySelector("img");
      thumbnail.src = item.image.src;
      button.style.setProperty("--crop-aspect", target.width / target.height);
    });
    syncChoices("crop-mode", () => cropDraft.mode);
    elements.cropDialogContent.removeAttribute("final-focus");
    elements.cropDialog.api.open();
    updateCropLayout();
  }

  function updateCropLayout() {
    layoutCropViewport();
    renderCropPreview();
  }

  function getCropTargetBounds(slot) {
    const zone = getZones()[slot];
    return getImageShapeBounds(zone, state.imageShapes[slot]);
  }

  function layoutCropViewport() {
    if (!cropDraft) return;

    const target = getCropTargetBounds(cropDraft.slot);
    const aspectRatio = target.width / target.height;
    const availableWidth = Math.max(1, elements.cropPreviewStage.clientWidth - 48);
    const stageHeight = elements.cropPreviewStage.clientHeight;
    const verticalGutter = Math.min(54, Math.floor(stageHeight / 4));
    const availableHeight = Math.max(1, stageHeight - verticalGutter);
    let width = availableWidth;
    let height = width / aspectRatio;

    if (height > availableHeight) {
      height = availableHeight;
      width = height * aspectRatio;
    }

    elements.cropViewport.style.width = `${width}px`;
    elements.cropViewport.style.height = `${height}px`;
  }

  function getCropImageFrame() {
    if (!cropDraft) return null;

    const viewport = elements.cropViewport.getBoundingClientRect();
    if (!viewport.width || !viewport.height) return null;

    const placement = getPlacement(
      cropDraft.item, { x: 0, y: 0, width: viewport.width, height: viewport.height },
      cropDraft.mode, cropDraft.position, cropDraft.scale, cropDraft.offset,
    );
    return { viewport, ...placement };
  }

  function renderCropPreview() {
    const frame = getCropImageFrame();
    if (!frame) return;

    const cut = getCutBounds(frame, cropDraft.edges);
    const sourceScale = cropDraft.item.width / frame.width;
    const printable = getPrintableCrop(frame, cut);
    setActionDisabled(elements.cropApplyButton, !printable);
    elements.cropDimensions.textContent = printable
      ? `${Math.round(printable.width * sourceScale)} × ${Math.round(printable.height * sourceScale)} px imprimables`
      : "Aucun pixel imprimable · Centrer";
    Object.assign(elements.cropPaper.style, {
      left: `${cut.x}px`, top: `${cut.y}px`, width: `${cut.width}px`, height: `${cut.height}px`,
    });
    elements.cropBlades.forEach((blade) => {
      const edge = blade.dataset.edge;
      const stage = elements.cropPreviewStage;
      const view = elements.cropViewport;
      const across = edge === "bottom" || edge === "top";
      const reverse = edge === "top" || edge === "left";
      const x = view.offsetLeft + cut.x + (reverse ? 0 : cut.width);
      const y = view.offsetTop + cut.y + (reverse ? 0 : cut.height);
      const limit = (value, size) => Math.max(8, Math.min(size - 8, value));
      blade.style.left = `${across ? (reverse ? stage.clientWidth : 0) : limit(x, stage.clientWidth)}px`;
      blade.style.top = `${across ? limit(y, stage.clientHeight) : (reverse ? stage.clientHeight : 0)}px`;
      const length = across ? (reverse ? stage.clientWidth - x : x) : (reverse ? stage.clientHeight - y : y);
      blade.style.width = `${limit(length, across ? stage.clientWidth : stage.clientHeight) + 8}px`;
      const percent = Number((cropDraft.edges[edge] * 100).toFixed(2));
      const [min, max] = cropEdgeLimits(edge);
      blade.setAttribute("aria-valuemin", Number((min * 100).toFixed(2)));
      blade.setAttribute("aria-valuemax", Number((max * 100).toFixed(2)));
      blade.setAttribute("aria-valuenow", percent);
      blade.setAttribute("aria-valuetext", `${percent} %`);
      if (elements.cropEdge.value === edge) {
        const control = elements.cropEdgePosition;
        control.min = String(min * 100);
        control.max = String(max * 100);
        control.value = String(cropDraft.edges[edge] * 100);
        control.setAttribute("aria-label", `Position du ${blade.getAttribute("aria-label").toLowerCase()}`);
        control.setAttribute("aria-valuetext", `${percent} %`);
      }
    });
    elements.cropPreviewImage.style.width = `${frame.width}px`;
    elements.cropPreviewImage.style.height = `${frame.height}px`;
    elements.cropPreviewImage.style.left = `${frame.x - cut.x}px`;
    elements.cropPreviewImage.style.top = `${frame.y - cut.y}px`;
    elements.cropOffcut.style.width = `${frame.width}px`;
    elements.cropOffcut.style.height = `${frame.height}px`;
    elements.cropOffcut.style.left = `${elements.cropViewport.offsetLeft + frame.x}px`;
    elements.cropOffcut.style.top = `${elements.cropViewport.offsetTop + frame.y}px`;
    setControlValue(elements.cropZoom, cropDraft.scale);
    elements.cropZoomValue.textContent = `${Math.round(cropDraft.scale * 100)} %`;
  }

  function startCropDrag(event) {
    if (!cropDraft || event.button !== 0) return;

    const frame = getCropImageFrame();
    if (!frame) return;

    event.preventDefault();
    cropDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: { ...cropDraft.offset },
      frame,
    };
    elements.cropViewport.setPointerCapture(event.pointerId);
    elements.cropViewport.classList.add("is-dragging");
  }

  function moveCropDrag(event) {
    if (!cropDraft || !cropDrag || cropDrag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - cropDrag.startX;
    const deltaY = event.clientY - cropDrag.startY;
    cropDraft.offset.x = cropDrag.offset.x + deltaX / cropDrag.frame.viewport.width;
    cropDraft.offset.y = cropDrag.offset.y + deltaY / cropDrag.frame.viewport.height;
    renderCropPreview();
  }

  function endCropDrag(event) {
    if (!cropDrag || cropDrag.pointerId !== event.pointerId) return;

    if (event.type === "pointerup" && Math.hypot(event.clientX - cropDrag.startX, event.clientY - cropDrag.startY) < 3 &&
        !elements.cropPaper.contains(document.elementFromPoint(event.clientX, event.clientY))) {
      const frame = getCropImageFrame();
      placeCropCenter(event.clientX - frame.viewport.left, event.clientY - frame.viewport.top, frame);
    }
    if (elements.cropViewport.hasPointerCapture(event.pointerId)) {
      elements.cropViewport.releasePointerCapture(event.pointerId);
    }
    cropDrag = null;
    elements.cropViewport.classList.remove("is-dragging");
  }

  function fitAndCenterCrop() {
    cropDraft.mode = "resize";
    cropDraft.scale = DEFAULT_IMAGE_SCALE;
    syncChoices("crop-mode", () => cropDraft.mode);
    const frame = getCropImageFrame();
    const cut = getCutBounds(frame, cropDraft.edges);
    const fit = Math.min(frame.viewport.width / cut.width, frame.viewport.height / cut.height);
    cropDraft.scale = Math.min(Number(elements.cropZoom.max), Math.floor(fit * 100 + 1e-7) / 100);
    placeCropCenter(frame.viewport.width / 2, frame.viewport.height / 2, getCropImageFrame());
  }

  function placeCropCenter(x, y, frame) {
    const cut = getCutBounds(frame, cropDraft.edges);
    cropDraft.offset.x += (x - cut.x - cut.width / 2) / frame.viewport.width;
    cropDraft.offset.y += (y - cut.y - cut.height / 2) / frame.viewport.height;
    renderCropPreview();
  }

  function getPrintableCrop(frame, cut) {
    const width = Math.min(cut.x + cut.width, frame.viewport.width) - Math.max(cut.x, 0);
    const height = Math.min(cut.y + cut.height, frame.viewport.height) - Math.max(cut.y, 0);
    const pixel = frame.width / cropDraft.item.width;
    return width + 1e-7 >= pixel && height + 1e-7 >= pixel ? { width, height } : null;
  }

  function cropEdgeLimits(edge) {
    const horizontal = edge === "left" || edge === "right";
    const pixels = horizontal ? cropDraft.item.width : cropDraft.item.height;
    const minimum = Math.max(0.01, 1 / pixels);
    const opposite = cropDraft.edges[OPPOSITE_EDGE[edge]];
    return edge === "left" || edge === "top"
      ? [0, Math.max(0, opposite - minimum)]
      : [Math.min(1, opposite + minimum), 1];
  }

  function setCropEdge(edge, value) {
    elements.cropEdge.value = edge;
    const [min, max] = cropEdgeLimits(edge);
    cropDraft.edges[edge] = Math.max(min, Math.min(max, value));
    renderCropPreview();
  }

  function resetCropImage() {
    if (!cropDraft) return;

    cropDraft.position = { ...DEFAULT_IMAGE_POSITION };
    cropDraft.edges = { ...FULL_CROP };
    cropDraft.offset = { x: 0, y: 0 };
    cropDraft.scale = DEFAULT_IMAGE_SCALE;
    updateCropLayout();
  }

  function clearCropDraft() {
    const input = cropDraft ? getImageInput(cropDraft.slot) : null;
    cropDraft = null;
    cropDrag = null;
    input?.api?.clear();
    elements.cropPreviewImage.removeAttribute("src");
    elements.cropOffcut.removeAttribute("src");
    elements.cropModes.forEach((button) => button.querySelector("img").removeAttribute("src"));
  }

  function applyImageCrop() {
    const frame = getCropImageFrame();
    if (!frame || !getPrintableCrop(frame, getCutBounds(frame, cropDraft.edges))) return;

    const { slot, item, position, scale, mode, edges, offset } = cropDraft;
    state.images[slot] = { ...item, edges: { ...edges }, offset: { ...offset } };
    state.imagePositions[slot] = { ...position };
    state.imageScales[slot] = scale;
    state.fitModes[slot] = mode;
    setFileName(slot, item.name);
    updateFitButtons();
    updateRemoveButtons();
    updateCropButtons();
    updateImageShapeControls();
    updatePositionControls();
    updateWizardUI();
    if (cropDraft.opener === elements.previewActionButton && !elements.previewActionButton.offsetHeight) {
      elements.cropDialogContent.setAttribute("final-focus", "#wizardNext");
    }
    elements.cropDialog.api.close({ returnValue: "apply" });
    clearCropDraft();
    setStatus(mode === "cut" ? "Image cadrée" : "Image entière ajoutée");
    render();
  }

  function setFileName(slot, name) {
    const target = elements.fileNames[slot];
    if (!target) return;
    target.textContent = name;
    target.title = state.images[slot] ? name : "";
    if (slot === "center") {
      elements.quickCenterName.textContent = name;
      elements.quickCenterName.title = state.images.center ? name : "";
    }
  }

  function syncImageFileNames() {
    getActiveImageSlots().forEach((slot) => {
      const image = state.images[slot];
      setFileName(slot, image ? image.name : DEFAULT_FILE_LABELS[slot]);
    });
  }

  function updateRemoveButtons() {
    elements.removeButtons.forEach((button) => {
      button.hidden = !state.images[button.dataset.removeSlot];
    });
  }

  function updateCropButtons() {
    elements.cropButtons.forEach((button) => {
      button.hidden = !state.images[button.dataset.cropSlot];
    });
  }

  function getExportWidth() {
    return activeProduct === PRODUCT_MOUSEPAD ? MOUSE_PAD_EXPORT_WIDTH : MUG_EXPORT_WIDTH;
  }

  function getExportHeight() {
    return activeProduct === PRODUCT_MOUSEPAD ? MOUSE_PAD_EXPORT_HEIGHT : MUG_EXPORT_HEIGHT;
  }

  function getPreviewPhysicalLayout() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      return {
        widthMm: MOUSE_PAD_WIDTH_MM,
        heightMm: MOUSE_PAD_HEIGHT_MM,
      };
    }

    return SHEET_LAYOUTS[sheetLayout] || SHEET_LAYOUTS["3up"];
  }

  function resizeStage() {
    const area = elements.stageArea;
    const layout = getPreviewPhysicalLayout();
    const styles = getComputedStyle(area);
    const actionHeight = elements.previewActionButton.offsetHeight;
    const actionReserve = actionHeight ? actionHeight + parseFloat(styles.rowGap) : 0;
    const availableWidth = Math.max(1, area.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight));
    const availableHeight = Math.max(1, area.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom) - actionReserve);
    const exportWidth = getExportWidth();
    const exportHeight = getExportHeight();
    const scale = Math.min(
      availableWidth / layout.widthMm,
      availableHeight / layout.heightMm,
      exportWidth / layout.widthMm,
      exportHeight / layout.heightMm,
    );
    const width = Math.round(layout.widthMm * scale);
    const height = Math.round(layout.heightMm * scale);
    const nextScale = Math.max(width / exportWidth, height / exportHeight);
    const nextOffset = {
      x: (width - exportWidth * nextScale) / 2,
      y: (height - exportHeight * nextScale) / 2,
    };
    if (
      stage.width() === width && stage.height() === height &&
      previewScale === nextScale && previewOffset.x === nextOffset.x && previewOffset.y === nextOffset.y
    ) return;

    previewScale = nextScale;
    previewOffset = nextOffset;
    contentLayer.scale({ x: previewScale, y: previewScale });
    contentLayer.position(previewOffset);
    guideLayer.scale({ x: previewScale, y: previewScale });
    guideLayer.position(previewOffset);
    stage.size({ width, height });
    elements.stageFrame.style.width = `${width}px`;
    elements.stageFrame.style.height = `${height}px`;
    updateImageShiftOverlay();
  }

  function render() {
    updateImageShiftOverlay();
    contentLayer.destroyChildren();
    guideLayer.destroyChildren();

    contentLayer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: getExportWidth(),
        height: getExportHeight(),
        fill: "#ffffff",
      }),
    );

    getRenderableImageSlots().forEach(renderImageSlot);
    renderText();
    renderGuides();

    contentLayer.batchDraw();
    guideLayer.batchDraw();
  }

  function renderImageSlot(slot) {
    const item = state.images[slot];
    const zone = getZones()[slot];
    if (!zone) return;
    const shape = state.imageShapes[slot];
    const shapeBounds = getImageShapeBounds(zone, shape);
    const group = new Konva.Group({
      clipFunc: (context) => {
        context.beginPath();
        drawImageShapePath(context, shape, shapeBounds);
      },
    });

    if (!item) {
      if (activeProduct === PRODUCT_MOUSEPAD) return;
      group.add(
        new Konva.Rect({
          ...zone,
          fill: "#ffffff",
        }),
      );
      contentLayer.add(group);
      return;
    }

    const placement = getPlacement(
      item,
      shapeBounds,
      state.fitModes[slot],
      state.imagePositions[slot],
      state.imageScales[slot], item.offset,
    );
    const cut = getCutBounds(placement, item.edges);
    const sourceScale = item.width / placement.width;
    group.add(
      new Konva.Image({
        image: item.image,
        ...cut,
        crop: {
          x: (cut.x - placement.x) * sourceScale,
          y: (cut.y - placement.y) * sourceScale,
          width: cut.width * sourceScale,
          height: cut.height * sourceScale,
        },
      }),
    );
    contentLayer.add(group);
  }

  function getImageShapeBounds(zone, shape) {
    if (shape === "rectangle") return { ...zone };

    const size = Math.min(zone.width, zone.height);
    return {
      x: zone.x + (zone.width - size) / 2,
      y: zone.y + (zone.height - size) / 2,
      width: size,
      height: size,
    };
  }

  function drawImageShapePath(context, shape, bounds) {
    const { x, y, width, height } = bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    if (shape === "circle") {
      context.arc(centerX, centerY, Math.min(width, height) / 2, 0, Math.PI * 2);
      return;
    }

    if (shape === "heart") {
      context.moveTo(centerX, y + height * 0.9);
      context.bezierCurveTo(
        centerX - width * 0.42,
        y + height * 0.64,
        x,
        y + height * 0.4,
        x,
        y + height * 0.18,
      );
      context.bezierCurveTo(x, y + height * 0.02, x + width * 0.2, y, centerX, y + height * 0.22);
      context.bezierCurveTo(x + width * 0.8, y, x + width, y + height * 0.02, x + width, y + height * 0.18);
      context.bezierCurveTo(
        x + width,
        y + height * 0.4,
        centerX + width * 0.42,
        y + height * 0.64,
        centerX,
        y + height * 0.9,
      );
      context.closePath();
      return;
    }

    if (shape === "apple") {
      context.moveTo(centerX, y + height * 0.28);
      context.bezierCurveTo(
        centerX - width * 0.17,
        y + height * 0.1,
        x + width * 0.06,
        y + height * 0.12,
        x + width * 0.08,
        y + height * 0.44,
      );
      context.bezierCurveTo(
        x + width * 0.1,
        y + height * 0.71,
        x + width * 0.27,
        y + height,
        x + width * 0.43,
        y + height * 0.96,
      );
      context.bezierCurveTo(
        centerX,
        y + height * 0.94,
        centerX,
        y + height * 0.84,
        x + width * 0.57,
        y + height * 0.96,
      );
      context.bezierCurveTo(
        x + width * 0.73,
        y + height,
        x + width * 0.9,
        y + height * 0.71,
        x + width * 0.92,
        y + height * 0.44,
      );
      context.bezierCurveTo(
        x + width * 0.94,
        y + height * 0.12,
        centerX + width * 0.17,
        y + height * 0.1,
        centerX,
        y + height * 0.28,
      );
      context.closePath();
      context.moveTo(centerX + width * 0.04, y + height * 0.18);
      context.bezierCurveTo(
        centerX + width * 0.14,
        y + height * 0.02,
        centerX + width * 0.34,
        y + height * 0.02,
        centerX + width * 0.39,
        y + height * 0.05,
      );
      context.bezierCurveTo(
        centerX + width * 0.35,
        y + height * 0.19,
        centerX + width * 0.18,
        y + height * 0.28,
        centerX + width * 0.04,
        y + height * 0.18,
      );
      context.closePath();
      return;
    }

    if (shape === "star") {
      const outerRadius = Math.min(width, height) / 2;
      const innerRadius = outerRadius * 0.42;
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + (point * Math.PI) / 5;
        const pointX = centerX + Math.cos(angle) * radius;
        const pointY = centerY + Math.sin(angle) * radius;
        if (point === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.closePath();
      return;
    }

    if (shape === "hexagon") {
      const radius = Math.min(width, height) / 2;
      for (let point = 0; point < 6; point += 1) {
        const angle = (point * Math.PI) / 3;
        const pointX = centerX + Math.cos(angle) * radius;
        const pointY = centerY + Math.sin(angle) * radius;
        if (point === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.closePath();
      return;
    }

    context.rect(x, y, width, height);
  }

  function getKonvaFontStyle() {
    const styles = [];
    if (state.textFormat.italic) styles.push("italic");
    if (state.textFormat.bold) styles.push("bold");
    return styles.length ? styles.join(" ") : "normal";
  }

  function getTextFontFamily() {
    return getFontFamily(state.textFont);
  }

  function getCanvasFont(fontSize) {
    const style = state.textFormat.italic ? "italic " : "";
    const weight = state.textFormat.bold ? "700" : "400";
    return `${style}${weight} ${fontSize}px ${getTextFontFamily()}`;
  }

  function getTextOutlineStyle(fontSize) {
    if (!state.textFormat.outline) {
      return { strokeWidth: 0, letterSpacing: 0, lineJoin: "round" };
    }

    const profile = OUTLINE_STYLE_BY_FONT[state.textFont] || DEFAULT_OUTLINE_STYLE;
    return {
      strokeWidth: Math.max(3, Math.round(fontSize * profile.strokeScale)),
      letterSpacing:
        state.textFormat.bold
          ? Math.round(fontSize * profile.letterSpacingScale)
          : 0,
      lineJoin: "round",
    };
  }

  function measureTextWidth(context, text, fontSize) {
    const letterSpacing = getTextOutlineStyle(fontSize).letterSpacing;
    return context.measureText(text).width + Math.max(0, Array.from(text).length - 1) * letterSpacing;
  }

  function getTextDirection(text = state.text) {
    return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(text) ? "rtl" : "ltr";
  }

  function getTextTop(zone, textHeight, padding) {
    if (state.textPosition === "top") return zone.y + padding;
    if (state.textPosition === "bottom") return zone.y + zone.height - padding - textHeight;
    return zone.y + (zone.height - textHeight) / 2;
  }

  function getTextBlock(zone, layout, padding) {
    const maxWidth = zone.width - padding * 2;
    const lineWidths = measureTextLineWidths(layout.lines, layout.fontSize);
    const contentWidth = Math.max(...lineWidths, 1);
    const width = Math.min(maxWidth, Math.max(contentWidth, layout.fontSize * 1.2));
    const height = layout.lines.length * layout.lineHeight;

    return {
      x: zone.x + (zone.width - width) / 2,
      y: getTextTop(zone, height, padding),
      width,
      height,
    };
  }

  function measureTextLineWidths(lines, fontSize) {
    const canvas = measureTextLineWidths.canvas || document.createElement("canvas");
    measureTextLineWidths.canvas = canvas;
    const context = canvas.getContext("2d");
    context.font = getCanvasFont(fontSize);
    return lines.map((line) => measureTextWidth(context, line, fontSize));
  }

  function getTextShapePlacements(zone, textBlock, fontSize) {
    const config = TEXT_SHAPES[state.textShape];
    if (!config) return [];

    const baseSize = Math.max(30, Math.min(62, Math.round(fontSize * 0.32)));
    const gap = Math.max(18, Math.round(fontSize * 0.15));
    const minX = zone.x + baseSize * 0.72;
    const maxX = zone.x + zone.width - baseSize * 0.72;
    const minY = zone.y + baseSize * 0.72;
    const maxY = zone.y + zone.height - baseSize * 0.72;
    const left = textBlock.x - gap;
    const right = textBlock.x + textBlock.width + gap;
    const top = textBlock.y - gap * 0.45;
    const bottom = textBlock.y + textBlock.height + gap * 0.7;

    return [
      { x: left, y: top, size: baseSize },
      { x: right, y: top + baseSize * 0.18, size: Math.round(baseSize * 0.86) },
      { x: left + baseSize * 0.18, y: bottom, size: Math.round(baseSize * 0.78) },
      { x: right - baseSize * 0.12, y: bottom - baseSize * 0.08, size: baseSize },
    ].map((placement, index) => ({
      ...placement,
      x: Math.min(maxX, Math.max(minX, placement.x)),
      y: Math.min(maxY, Math.max(minY, placement.y)),
      glyph: config.glyphs[index % config.glyphs.length],
      color: config.colors[index % config.colors.length],
      rotation: config.rotations[index % config.rotations.length],
    }));
  }

  function renderTextShapes(zone, textBlock, fontSize) {
    getTextShapePlacements(zone, textBlock, fontSize).forEach((placement) => {
      const width = placement.size * 1.45;
      const height = placement.size * 1.25;
      const shapeNode = new Konva.Text({
        x: placement.x,
        y: placement.y,
        width,
        height,
        offsetX: width / 2,
        offsetY: height / 2,
        text: placement.glyph,
        fontSize: placement.size,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "700",
        align: "center",
        fill: placement.color,
        rotation: placement.rotation,
        listening: false,
      });
      contentLayer.add(shapeNode);
    });
  }

  function renderText() {
    const text = state.text.trim();
    if (!text) {
      updateTextFit(true);
      return;
    }

    const zone = getTextZone();
    const padding = activeProduct === PRODUCT_MOUSEPAD ? 92 : 46;
    const maxWidth = zone.width - padding * 2;
    const maxHeight = zone.height - padding * 2;
    const layout = getTextLayout(text, maxWidth, maxHeight, state.fontSize);
    const fits = layout.lines.length * layout.lineHeight <= maxHeight;
    updateTextFit(fits);
    if (!fits) return;

    const textBlock = getTextBlock(zone, layout, padding);
    const outlineStyle = getTextOutlineStyle(layout.fontSize);
    const shadowBlur = state.textFormat.shadow ? 8 : 0;
    renderTextShapes(zone, textBlock, layout.fontSize);
    const node = new Konva.Text({
      x: zone.x + padding,
      y: 0,
      width: maxWidth,
      text: layout.lines.join("\n"),
      wrap: "none",
      fontSize: layout.fontSize,
      fontFamily: getTextFontFamily(),
      fontStyle: getKonvaFontStyle(),
      lineHeight: layout.lineHeight / layout.fontSize,
      align: "center",
      direction: getTextDirection(text),
      fill: state.textColor,
      stroke: state.outlineColor,
      strokeWidth: outlineStyle.strokeWidth,
      lineJoin: outlineStyle.lineJoin,
      letterSpacing: outlineStyle.letterSpacing,
      shadowColor: "rgba(0,0,0,0.22)",
      shadowBlur,
      shadowOffsetY: state.textFormat.shadow ? 4 : 0,
      shadowOpacity: state.textFormat.shadow ? 0.45 : 0,
      listening: false,
    });
    node.y(textBlock.y);
    contentLayer.add(node);
  }

  function updateTextFit(fits) {
    state.textFits = fits;
    if (elements.textFitWarning.hidden === fits) return;
    elements.textFitWarning.hidden = fits;
    setControlFlag(elements.textField, "invalid", !fits);
    if (fits) elements.textInput.removeAttribute("aria-describedby");
    else elements.textInput.setAttribute("aria-describedby", "textFitWarning");
    setActionDisabled(elements.downloadButton, !fits);
    setActionDisabled(elements.downloadMirrorButton, !fits);
    setActionDisabled(elements.addToPageButton, !fits);
    setActionDisabled(elements.printButton, !fits && !printQueue.length);
    updateWizardUI();
  }

  function getTextZone() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      return {
        x: 0,
        y: 0,
        width: MOUSE_PAD_EXPORT_WIDTH,
        height: MOUSE_PAD_EXPORT_HEIGHT,
      };
    }

    return getZones().center;
  }

  function renderGuides() {
    if (activeProduct === PRODUCT_MOUSEPAD) {
      renderMousePadGuides();
      return;
    }

    const zones = getZones();
    guideLayer.add(
      new Konva.Rect({
        x: 1,
        y: 1,
        width: MUG_EXPORT_WIDTH - 2,
        height: MUG_EXPORT_HEIGHT - 2,
        stroke: "#000",
        strokeWidth: 1,
        strokeScaleEnabled: false,
      }),
    );

    [zones.center.x, zones.right.x].forEach((x) => {
      renderGuideLine([x, 0, x, MUG_EXPORT_HEIGHT]);
    });
  }

  function renderMousePadGuides() {
    const radiusPx = Math.round((MOUSE_PAD_EXPORT_WIDTH / MOUSE_PAD_WIDTH_MM) * 5);
    guideLayer.add(
      new Konva.Rect({
        x: 2,
        y: 2,
        width: MOUSE_PAD_EXPORT_WIDTH - 4,
        height: MOUSE_PAD_EXPORT_HEIGHT - 4,
        cornerRadius: radiusPx,
        stroke: "#000",
        strokeWidth: 1,
        strokeScaleEnabled: false,
      }),
    );

    getMousePadGuideLines(state.layoutPreset, {
      width: MOUSE_PAD_EXPORT_WIDTH,
      height: MOUSE_PAD_EXPORT_HEIGHT,
    }).forEach((guide) => {
      renderGuideLine(guide.points);
    });
  }

  function renderGuideLine(points) {
    const line = { points, strokeWidth: 2, strokeScaleEnabled: false };
    guideLayer.add(
      new Konva.Line({ ...line, stroke: "#fff" }),
      new Konva.Line({ ...line, stroke: "#000", dash: [4, 4] }),
    );
  }

  function getCutBounds(photo, edges = FULL_CROP) {
    return {
      x: photo.x + photo.width * edges.left,
      y: photo.y + photo.height * edges.top,
      width: photo.width * (edges.right - edges.left),
      height: photo.height * (edges.bottom - edges.top),
    };
  }

  function getPlacement(item, zone, mode, position = DEFAULT_IMAGE_POSITION, imageScale = DEFAULT_IMAGE_SCALE, offset = { x: 0, y: 0 }) {
    const fitScale =
      mode === "cut"
        ? Math.max(zone.width / item.width, zone.height / item.height)
        : Math.min(zone.width / item.width, zone.height / item.height);
    const scale = fitScale * Math.max(0.1, Number(imageScale) || DEFAULT_IMAGE_SCALE);
    const width = item.width * scale;
    const height = item.height * scale;
    return {
      x: zone.x + (zone.width - width) * position.x + zone.width * offset.x,
      y: zone.y + (zone.height - height) * position.y + zone.height * offset.y,
      width,
      height,
    };
  }

  async function downloadPng(options = {}) {
    await ensureTextFontLoaded();
    render();
    if (state.textFits === false) return;
    const canvas = createExportCanvas({ mirror: Boolean(options.mirror) });
    const downloadName = PRODUCT_LABELS[activeProduct].downloadName;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setStatus("Impossible de créer le PNG.", true);
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const suffix = options.mirror ? "-miroir" : "";
    anchor.download = `${downloadName}${suffix}-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("PNG téléchargé");
  }

  async function addToPage() {
    await ensureTextFontLoaded();
    render();
    if (state.textFits === false) return;
    printQueue.push(createExportCanvas().toDataURL("image/png"));
    queueIndex = printQueue.length - 1;
    updateQueueUI();
    setStatus(`Ajouté à la page (${printQueue.length})`);
  }

  function removeFromQueue() {
    if (!printQueue.length) return;
    printQueue.splice(queueIndex, 1);
    updateQueueUI();
    setStatus("Création retirée de la page");
  }

  function setSheetLayout(layout) {
    if (activeProduct !== PRODUCT_MUG) return;
    if (!SHEET_LAYOUTS[layout]) return;
    sheetLayout = layout;
    updateSheetLayoutButtons();
    saveDefaultPreferences();
    resizeStage();
  }

  function updateSheetLayoutButtons() {
    syncChoices("sheet", () => sheetLayout);
  }

  function updateQueueUI() {
    const count = printQueue.length;
    const labels = PRODUCT_LABELS[activeProduct];
    elements.queuePanel.hidden = count === 0;
    setActionDisabled(elements.printButton, state.textFits === false && count === 0);
    const printText = elements.printButton.querySelector(".button-text");
    if (printText) {
      printText.textContent = count
        ? activeProduct === PRODUCT_MOUSEPAD
          ? `Imprimer ${count} page(s)`
          : `Imprimer la page (${count})`
        : "Imprimer";
    }
    if (!count) return;
    queueIndex = Math.max(0, Math.min(queueIndex, count - 1));
    elements.queueLabel.textContent = `${labels.queueItemLabel} ${queueIndex + 1} / ${count}`;
    elements.queueThumb.src = printQueue[queueIndex];
    setActionDisabled(elements.queuePrev, queueIndex === 0);
    setActionDisabled(elements.queueNext, queueIndex === count - 1);
  }

  async function printMug() {
    if (state.textFits === false && !printQueue.length) return;
    const labels = PRODUCT_LABELS[activeProduct];
    const printWindow = shouldUseStandalonePrintWindow() ? window.open("", "_blank") : null;
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><title>${labels.printTitle}</title><body>Préparation...</body>`);
      printWindow.document.close();
    }

    await ensureTextFontLoaded();
    const single = printQueue.length === 0;
    if (single) {
      render();
      if (state.textFits === false) {
        printWindow?.close();
        return;
      }
    }
    const images = single
      ? [createExportCanvas().toDataURL("image/png")]
      : printQueue.slice();
    const layout = activeProduct === PRODUCT_MOUSEPAD
      ? MOUSEPAD_PRINT_LAYOUT
      : SHEET_LAYOUTS[sheetLayout];
    const perPage = activeProduct === PRODUCT_MOUSEPAD ? 1 : single ? 1 : layout.perPage;
    const printMarkup = createPrintMarkup(images, layout, perPage, {
      standalone: Boolean(printWindow),
      product: activeProduct,
    });

    if (printWindow) {
      printFromStandaloneWindow(printWindow, printMarkup, images.length);
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const printDocument = iframe.contentWindow.document;
    printDocument.open();
    printDocument.write(printMarkup);
    printDocument.close();

    let didPrint = false;
    const runPrint = () => {
      if (didPrint) return;
      didPrint = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    };
    const printImages = Array.from(printDocument.querySelectorAll("img"));
    Promise.all(
      printImages.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
      ),
    ).then(runPrint);
    setStatus(single ? "Fenêtre d'impression ouverte" : `Impression de ${images.length} création(s)`);
  }

  function shouldUseStandalonePrintWindow() {
    const userAgent = navigator.userAgent || "";
    const isiPadOSDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(userAgent) || isiPadOSDesktopMode;
  }

  function createPrintMarkup(images, layout, perPage, options = {}) {
    const product = options.product || PRODUCT_MUG;
    const isMousePad = product === PRODUCT_MOUSEPAD;
    const cutOffset = layout.gapMm > 0 ? `-${layout.gapMm / 2}mm` : "0";
    const mirrorClass = state.mirrorPrint ? " mirror" : "";
    const standalone = Boolean(options.standalone);
    const labels = PRODUCT_LABELS[product];
    const sheets = [];

    for (let index = 0; index < images.length; index += perPage) {
      const cells = images
        .slice(index, index + perPage)
        .map((url) => `<div class="cell${mirrorClass}"><img src="${url}" alt="${isMousePad ? "Création pour tapis souris" : "Création pour mug"}"></div>`)
        .join("");
      sheets.push(`<div class="sheet">${cells}</div>`);
    }

    const printToolbar = standalone
      ? `<div class="print-toolbar"><button type="button" onclick="window.print()">Imprimer</button></div>`
      : "";
    const autoPrintScript = standalone
      ? `<script>
                  (() => {
                    const images = Array.from(document.images);
                    const waitForImages = Promise.all(images.map((image) =>
                      image.complete ? Promise.resolve() : new Promise((resolve) => {
                        image.addEventListener("load", resolve, { once: true });
                        image.addEventListener("error", resolve, { once: true });
                      })
                    ));
                    waitForImages.then(() => setTimeout(() => window.print(), 150));
                  })();
                <\/script>`
      : "";

    return `<!doctype html>
            <html>
              <head>
                <title>${labels.printTitle}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  @page { size: A4 ${isMousePad ? "landscape" : "portrait"}; margin: 0; }
                  html, body { margin: 0; }
                  body { background: #ffffff; color: #17202a; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                  .print-toolbar {
                    min-height: 64px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eef3f7;
                    border-bottom: 1px solid #cdd8e3;
                  }
                  .print-toolbar button {
                    min-height: 44px;
                    border: 0;
                    border-radius: 8px;
                    background: #0f766e;
                    color: #ffffff;
                    padding: 10px 18px;
                    font: inherit;
                    font-weight: 800;
                  }
                  .sheet {
                    width: ${isMousePad ? 297 : 210}mm;
                    height: ${isMousePad ? 210 : 297}mm;
                    box-sizing: border-box;
                    page-break-after: always;
                    break-after: page;
                    ${isMousePad ? "display: flex; align-items: flex-start; justify-content: flex-start;" : ""}
                  }
                  .sheet:last-child {
                    page-break-after: auto;
                    break-after: auto;
                  }
                  .cell {
                    position: relative;
                    flex-shrink: 0;
                    width: ${layout.widthMm}mm;
                    height: ${layout.heightMm}mm;
                    margin: ${isMousePad ? "0" : `0 auto ${layout.gapMm}mm auto`};
                  }
                  .cell img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                  }
                  .cell.mirror img {
                    transform: scaleX(-1);
                  }
                  .cell::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: ${cutOffset};
                    border-bottom: 0.2mm dashed rgba(23, 32, 42, 0.45);
                    ${isMousePad ? "display: none;" : ""}
                  }
                  @media print {
                    .print-toolbar { display: none; }
                  }
                </style>
              </head>
              <body>
                ${printToolbar}
                ${sheets.join("")}
                ${autoPrintScript}
              </body>
            </html>`;
  }

  function printFromStandaloneWindow(printWindow, markup, imageCount) {
    printWindow.document.open();
    printWindow.document.write(markup);
    printWindow.document.close();
    printWindow.focus();
    setStatus(imageCount === 1 ? "Onglet d'impression ouvert" : `Impression de ${imageCount} création(s)`);
  }

  function createExportCanvas(options = {}) {
    // Export the very same Konva layer shown in the preview. Keeping a
    // second Canvas renderer here caused custom fonts to be rasterised
    // differently in print than in the editor.
    const previewTransform = {
      x: contentLayer.x(),
      y: contentLayer.y(),
      scaleX: contentLayer.scaleX(),
      scaleY: contentLayer.scaleY(),
    };
    contentLayer.position({ x: 0, y: 0 });
    contentLayer.scale({ x: 1, y: 1 });
    let canvas;
    const exportWidth = getExportWidth();
    const exportHeight = getExportHeight();
    try {
      canvas = contentLayer.toCanvas({
        x: 0,
        y: 0,
        width: exportWidth,
        height: exportHeight,
        pixelRatio: 1,
      });
    } finally {
      contentLayer.position({ x: previewTransform.x, y: previewTransform.y });
      contentLayer.scale({ x: previewTransform.scaleX, y: previewTransform.scaleY });
    }

    if (!options.mirror) return canvas;

    const mirroredCanvas = document.createElement("canvas");
    mirroredCanvas.width = exportWidth;
    mirroredCanvas.height = exportHeight;
    const mirroredContext = mirroredCanvas.getContext("2d");
    mirroredContext.translate(exportWidth, 0);
    mirroredContext.scale(-1, 1);
    mirroredContext.drawImage(canvas, 0, 0);
    return mirroredCanvas;
  }

  function getTextLayout(text, maxWidth, maxHeight, requestedFontSize) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let fontSize = getFontSizeForUnbrokenWords(context, text, maxWidth, requestedFontSize);
    let lines = wrapText(context, text, maxWidth, fontSize);
    let lineHeight = fontSize * 1.14;

    while (fontSize > 34 && lines.length * lineHeight > maxHeight) {
      fontSize -= 2;
      fontSize = getFontSizeForUnbrokenWords(context, text, maxWidth, fontSize);
      lines = wrapText(context, text, maxWidth, fontSize);
      lineHeight = fontSize * 1.14;
    }

    return { fontSize, lineHeight, lines };
  }

  function getFontSizeForUnbrokenWords(context, text, maxWidth, requestedFontSize) {
    let fontSize = requestedFontSize;
    while (fontSize > 34) {
      context.font = getCanvasFont(fontSize);
      const widestWord = getTextWords(text).reduce(
        (widest, word) => Math.max(widest, measureTextWidth(context, word, fontSize)),
        0,
      );
      if (widestWord <= maxWidth) return fontSize;
      fontSize -= 2;
    }
    return fontSize;
  }

  function getTextWords(text) {
    return text
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  function wrapText(context, text, maxWidth, fontSize) {
    context.font = getCanvasFont(fontSize);
    const output = [];

    text.split(/\n/).forEach((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        output.push("");
        return;
      }

      let line = "";
      words.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (measureTextWidth(context, test, fontSize) <= maxWidth) {
          line = test;
          return;
        }

        if (line) output.push(line);
        line = "";
        if (measureTextWidth(context, word, fontSize) <= maxWidth) {
          line = word;
          return;
        }

        for (const segment of splitGraphemes(word)) {
          if (line && measureTextWidth(context, line + segment, fontSize) > maxWidth) {
            output.push(line);
            line = "";
          }
          line += segment;
        }
      });
      if (line) output.push(line);
    });

    return output;
  }

  function hasCreationInProgress() {
    return Object.values(productStates).some((draft) =>
      Object.values(draft.images).some(Boolean) || draft.text.trim(),
    ) || Object.values(productRuntime).some((runtime) => runtime.printQueue.length);
  }

  function protectCreationBeforeUnload(event) {
    if (!hasCreationInProgress()) return;

    event.preventDefault();
    event.returnValue = "";
  }

  function clearAll() {
    state = activeProduct === PRODUCT_MOUSEPAD
      ? createMousePadState(getFactoryPreferences())
      : createMugState(getFactoryPreferences());
    productStates[activeProduct] = state;
    printQueue = [];
    queueIndex = 0;
    sheetLayout = activeProduct === PRODUCT_MUG ? "3up" : sheetLayout;
    wizardStep = activeProduct === PRODUCT_MOUSEPAD ? "layout" : "left";
    quickTextEditing = false;
    productRuntime[activeProduct] = {
      printQueue,
      queueIndex,
      sheetLayout,
      wizardStep,
      quickTextEditing,
    };
    getActiveImageSlots().forEach((slot) => {
      getImageInput(slot)?.api?.clear();
      setFileName(slot, DEFAULT_FILE_LABELS[slot]);
    });
    updateProductUI();
    updateMousePadRows();
    buildImageShiftOverlay();
    rebuildWizardSteps();
    syncPreferenceControls();
    updateWizardUI();
    updatePositionControls();
    updateRemoveButtons();
    updateCropButtons();
    updateFontPreviewSamples();
    updateQueueUI();
    saveDefaultPreferences();
    setStatus("Prêt");
    resizeStage();
    render();
  }
})();
