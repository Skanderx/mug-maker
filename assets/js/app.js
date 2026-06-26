import {
  OUTLINE_PRESETS,
  clampPosition,
  getDefaultOutlineColor,
  getOutlineColorOptions,
  getPositionFromPercent,
  getPositionPercent,
  getTonalOutlineColor,
  normalizeHex,
} from "./mug-core.js";

(() => {
        const EXPORT_WIDTH = 2550;
        const EXPORT_HEIGHT = 992;
        const LAYOUT_PRESETS = {
          classic: {
            left: { x: 0, y: 0, width: 900, height: EXPORT_HEIGHT },
            center: { x: 900, y: 0, width: 750, height: EXPORT_HEIGHT },
            right: { x: 1650, y: 0, width: 900, height: EXPORT_HEIGHT },
          },
          equal: {
            left: { x: 0, y: 0, width: 850, height: EXPORT_HEIGHT },
            center: { x: 850, y: 0, width: 850, height: EXPORT_HEIGHT },
            right: { x: 1700, y: 0, width: 850, height: EXPORT_HEIGHT },
          },
          textWide: {
            left: { x: 0, y: 0, width: 750, height: EXPORT_HEIGHT },
            center: { x: 750, y: 0, width: 1050, height: EXPORT_HEIGHT },
            right: { x: 1800, y: 0, width: 750, height: EXPORT_HEIGHT },
          },
          imagesWide: {
            left: { x: 0, y: 0, width: 1050, height: EXPORT_HEIGHT },
            center: { x: 1050, y: 0, width: 450, height: EXPORT_HEIGHT },
            right: { x: 1500, y: 0, width: 1050, height: EXPORT_HEIGHT },
          },
        };
        const DEFAULT_LAYOUT = "classic";
        const SHEET_LAYOUTS = {
          "3up": { perPage: 3, widthMm: 210, heightMm: 82, gapMm: 8 },
          "4up": { perPage: 4, widthMm: 210, heightMm: 74, gapMm: 0 },
        };
        const PREFERENCES_STORAGE_KEY = "mugCreator.defaultPreferences.v1";
        const WIZARD_STEPS = ["left", "right", "text", "done"];
        let printQueue = [];
        let queueIndex = 0;
        let sheetLayout = "3up";
        let wizardStep = "left";
        let quickTextEditing = false;
        let previewScale = 1;
        let previewOffset = { x: 0, y: 0 };
        let cropDraft = null;
        let cropDrag = null;
        let cropDialogOpener = null;
        const DEFAULT_FIT_MODES = {
          left: "cut",
          center: "cut",
          right: "cut",
        };
        const QUICK_FIT_MODES = {
          left: "resize",
          center: "resize",
          right: "resize",
        };
        const DEFAULT_IMAGE_POSITION = { x: 0.5, y: 0.5 };
        const DEFAULT_IMAGE_POSITIONS = {
          left: { ...DEFAULT_IMAGE_POSITION },
          center: { ...DEFAULT_IMAGE_POSITION },
          right: { ...DEFAULT_IMAGE_POSITION },
        };
        const DEFAULT_IMAGE_SCALE = 1;
        const DEFAULT_IMAGE_SCALES = {
          left: DEFAULT_IMAGE_SCALE,
          center: DEFAULT_IMAGE_SCALE,
          right: DEFAULT_IMAGE_SCALE,
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
        };
        const IMAGE_SHAPES = {
          rectangle: { label: "Rectangle" },
          circle: { label: "Cercle" },
          square: { label: "Carré" },
          heart: { label: "Cœur" },
          star: { label: "Étoile" },
          hexagon: { label: "Hexagone" },
        };
        const DEFAULT_IMAGE_SHAPE = "rectangle";
        const DEFAULT_IMAGE_SHAPES = {
          left: DEFAULT_IMAGE_SHAPE,
          center: DEFAULT_IMAGE_SHAPE,
          right: DEFAULT_IMAGE_SHAPE,
        };
        const DEFAULT_FILE_LABELS = {
          left: "Aucune image choisie",
          center: "Aucune image choisie",
          right: "Aucune image choisie",
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
        sheetLayout = savedPreferences.sheetLayout;

        const state = {
          layoutPreset: DEFAULT_LAYOUT,
          fitModes: { ...savedPreferences.fitModes },
          imageShapes: { ...savedPreferences.imageShapes },
          imagePositions: cloneImagePositions(DEFAULT_IMAGE_POSITIONS),
          imageScales: { ...DEFAULT_IMAGE_SCALES },
          minimalMode: true,
          text: "",
          textPosition: savedPreferences.textPosition,
          textFont: savedPreferences.textFont,
          fontSize: savedPreferences.fontSize,
          textColor: savedPreferences.textColor,
          outlineColor: savedPreferences.outlineColor,
          textFormat: { ...savedPreferences.textFormat },
          textShape: savedPreferences.textShape,
          mirrorPrint: true,
          images: {
            left: null,
            center: null,
            right: null,
          },
        };
        applyQuickModeDefaults();

        const elements = {
          stage: document.querySelector("#stage"),
          stageFrame: document.querySelector(".stage-frame"),
          imageShiftOverlay: document.querySelector("#imageShiftOverlay"),
          previewActionButton: document.querySelector("#previewActionButton"),
          previewActionIcon: document.querySelector("#previewActionIcon"),
          previewActionText: document.querySelector("#previewActionText"),
          leftImage: document.querySelector("#leftImage"),
          centerImage: document.querySelector("#centerImage"),
          rightImage: document.querySelector("#rightImage"),
          leftName: document.querySelector("#leftName"),
          centerName: document.querySelector("#centerName"),
          rightName: document.querySelector("#rightName"),
          quickCenterImage: document.querySelector("#quickCenterImage"),
          quickCenterUploadText: document.querySelector("#quickCenterUploadText"),
          quickCenterDetails: document.querySelector("#quickCenterDetails"),
          quickCenterName: document.querySelector("#quickCenterName"),
          quickCenterRemove: document.querySelector("#quickCenterRemove"),
          removeButtons: Array.from(document.querySelectorAll("[data-remove-slot]")),
          cropButtons: Array.from(document.querySelectorAll("[data-crop-slot]")),
          layoutButtons: Array.from(document.querySelectorAll("[data-layout]")),
          minimalMode: document.querySelector("#minimalMode"),
          fitButtons: Array.from(document.querySelectorAll("[data-fit-slot]")),
          imageShapeControls: Array.from(document.querySelectorAll("[data-image-shape-control]")),
          imageShapeButtons: Array.from(document.querySelectorAll("[data-image-shape-slot]")),
          positionControls: Array.from(document.querySelectorAll("[data-position-value]")),
          positionInputs: Array.from(document.querySelectorAll("[data-position-input]")),
          textInput: document.querySelector("#textInput"),
          quickTextEditButton: document.querySelector("#quickTextEditButton"),
          quickTextEditButtonText: document.querySelector("#quickTextEditButtonText"),
          fontSelect: document.querySelector("#fontSelect"),
          fontPreviewButton: document.querySelector("#fontPreviewButton"),
          fontPreviewPopover: document.querySelector("#fontPreviewPopover"),
          fontPreviewClose: document.querySelector("#fontPreviewClose"),
          fontPreviewList: document.querySelector("#fontPreviewList"),
          fontSize: document.querySelector("#fontSize"),
          fontSizeValue: document.querySelector("#fontSizeValue"),
          textColor: document.querySelector("#textColor"),
          outlineColor: document.querySelector("#outlineColor"),
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
          sheetOptions: Array.from(document.querySelectorAll("[data-sheet-layout]")),
          colorPresetButtons: Array.from(document.querySelectorAll("[data-color]")),
          outlinePresetButtons: Array.from(document.querySelectorAll("[data-outline-preset]")),
          textFormatButtons: Array.from(document.querySelectorAll("[data-text-format]")),
          textPositionButtons: Array.from(document.querySelectorAll("[data-text-position]")),
          textShapeButtons: Array.from(document.querySelectorAll("[data-text-shape]")),
          downloadButton: document.querySelector("#downloadButton"),
          downloadMirrorButton: document.querySelector("#downloadMirrorButton"),
          printButton: document.querySelector("#printButton"),
          mirrorPrint: document.querySelector("#mirrorPrint"),
          clearButton: document.querySelector("#clearButton"),
          status: document.querySelector("#status"),
          cropDialog: document.querySelector("#imageCropDialog"),
          cropPreviewStage: document.querySelector("#cropPreviewStage"),
          cropViewport: document.querySelector("#cropViewport"),
          cropPreviewImage: document.querySelector("#cropPreviewImage"),
          cropZoom: document.querySelector("#cropZoom"),
          cropZoomValue: document.querySelector("#cropZoomValue"),
          cropCenterButton: document.querySelector("#cropCenterButton"),
          cropResetButton: document.querySelector("#cropResetButton"),
          cropCancelButton: document.querySelector("#cropCancelButton"),
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
        resizeObserver.observe(document.querySelector(".stage-area"));

        elements.leftImage.addEventListener("change", (event) => handleFile(event, "left"));
        elements.centerImage.addEventListener("change", (event) => handleFile(event, "center"));
        elements.rightImage.addEventListener("change", (event) => handleFile(event, "right"));

        elements.removeButtons.forEach((button) => {
          button.addEventListener("click", () => {
            removeImage(button.dataset.removeSlot);
          });
        });

        elements.quickCenterRemove.addEventListener("click", () => removeImage("center"));
        elements.quickTextEditButton.addEventListener("click", () => setQuickTextEditor(true));

        elements.cropButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const item = state.images[button.dataset.cropSlot];
            if (item) openImageCropDialog(button.dataset.cropSlot, item, button);
          });
        });

        elements.layoutButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setLayoutPreset(button.dataset.layout);
          });
        });

        elements.minimalMode.addEventListener("change", () => {
          setMinimalMode(elements.minimalMode.checked);
        });

        elements.wizardStepButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setWizardStep(button.dataset.wizardGo);
          });
        });

        elements.wizardBack.addEventListener("click", goToPreviousWizardStep);
        elements.wizardNext.addEventListener("click", goToNextWizardStep);
        elements.previewActionButton.addEventListener("click", handlePreviewAction);
        elements.stageFrame.addEventListener("click", handleStageFrameClick);
        document.addEventListener("keydown", handleWizardEnterKey);

        elements.fitButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setFitMode(button.dataset.fitSlot, button.dataset.fitMode);
          });
        });

        elements.imageShapeButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setImageShape(button.dataset.imageShapeSlot, button.dataset.imageShape);
          });
        });

        elements.positionControls.forEach((control) => {
          control.addEventListener("click", () => {
            setImagePosition(control.dataset.positionSlot, control.dataset.positionAxis, control.dataset.positionValue);
          });
        });

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

        elements.cropZoom.addEventListener("input", () => {
          if (!cropDraft) return;
          cropDraft.scale = Number(elements.cropZoom.value);
          renderCropPreview();
        });
        elements.cropCenterButton.addEventListener("click", centerCropImage);
        elements.cropResetButton.addEventListener("click", resetCropImage);
        elements.cropCancelButton.addEventListener("click", cancelImageCrop);
        elements.cropApplyButton.addEventListener("click", applyImageCrop);
        elements.cropDialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          cancelImageCrop();
        });
        elements.cropViewport.addEventListener("pointerdown", startCropDrag);
        elements.cropViewport.addEventListener("pointermove", moveCropDrag);
        elements.cropViewport.addEventListener("pointerup", endCropDrag);
        elements.cropViewport.addEventListener("pointercancel", endCropDrag);
        window.addEventListener("resize", () => {
          if (!elements.cropDialog.open) return;
          layoutCropViewport();
          renderCropPreview();
        });

        elements.textInput.addEventListener("input", () => {
          state.text = elements.textInput.value;
          updateFontPreviewSamples();
          updateWizardUI();
          render();
        });

        elements.fontSelect.addEventListener("change", () => {
          setTextFont(elements.fontSelect.value);
        });

        elements.fontPreviewButton.addEventListener("click", toggleFontPreviewPopover);
        elements.fontPreviewClose.addEventListener("click", () => {
          closeFontPreviewPopover();
          elements.fontPreviewButton.focus();
        });
        elements.fontPreviewList.addEventListener("click", (event) => {
          const option = event.target.closest("[data-font-preview]");
          if (!option) return;

          setTextFont(option.dataset.fontPreview);
          closeFontPreviewPopover();
          elements.fontPreviewButton.focus();
          setStatus("Police choisie");
        });
        elements.fontPreviewList.addEventListener("keydown", handleFontPreviewKeydown);
        document.addEventListener("click", (event) => {
          if (elements.fontPreviewPopover.hidden) return;
          if (elements.fontPreviewPopover.contains(event.target)) return;
          if (elements.fontPreviewButton.contains(event.target)) return;
          closeFontPreviewPopover();
        });
        document.addEventListener("keydown", (event) => {
          if (event.key !== "Escape" || elements.fontPreviewPopover.hidden) return;
          closeFontPreviewPopover();
          elements.fontPreviewButton.focus();
        });
        window.addEventListener("resize", () => {
          if (!elements.fontPreviewPopover.hidden) positionFontPreviewPopover();
        });
        window.addEventListener("beforeunload", protectCreationBeforeUnload);

        elements.fontSize.addEventListener("input", () => {
          state.fontSize = Number(elements.fontSize.value);
          elements.fontSizeValue.textContent = String(state.fontSize);
          saveDefaultPreferences();
          render();
        });

        elements.textColor.addEventListener("input", () => {
          setTextColor(elements.textColor.value);
        });

        elements.colorPresetButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setTextColor(button.dataset.color);
            setStatus("Couleur choisie");
          });
        });

        elements.textFormatButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const key = button.dataset.textFormat;
            state.textFormat[key] = !state.textFormat[key];
            updateTextFormatButtons();
            updateFontPreviewSamples();
            saveDefaultPreferences();
            render();
          });
        });

        elements.textPositionButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setTextPosition(button.dataset.textPosition);
          });
        });

        elements.textShapeButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setTextShape(button.dataset.textShape);
          });
        });

        elements.outlinePresetButtons.forEach((button) => {
          button.addEventListener("click", () => {
            setOutlineColor(getOutlineColorFromPreset(button.dataset.outlinePreset));
            setStatus("Contour choisi");
          });
        });

        elements.outlineColor.addEventListener("input", () => {
          setOutlineColor(elements.outlineColor.value);
          setStatus("Contour personnalisé");
        });

        elements.addToPageButton.addEventListener("click", addToPage);
        elements.queuePrev.addEventListener("click", () => { queueIndex -= 1; updateQueueUI(); });
        elements.queueNext.addEventListener("click", () => { queueIndex += 1; updateQueueUI(); });
        elements.queueRemove.addEventListener("click", removeFromQueue);
        elements.sheetOptions.forEach((button) => {
          button.addEventListener("click", () => setSheetLayout(button.dataset.sheetLayout));
        });

        elements.downloadButton.addEventListener("click", downloadPng);
        elements.downloadMirrorButton.addEventListener("click", () => downloadPng({ mirror: true }));
        elements.printButton.addEventListener("click", printMug);
        elements.mirrorPrint.addEventListener("change", () => {
          state.mirrorPrint = elements.mirrorPrint.checked;
        });
        elements.clearButton.addEventListener("click", clearAll);

        buildImageShiftOverlay();
        buildFontPreviewList();
        syncPreferenceControls();
        updatePositionControls();
        updateRemoveButtons();
        updateCropButtons();
        updateImageShapeControls();
        updateFontPreviewSamples();
        renderIcons();
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
          elements.fontSelect.value = state.textFont;
          elements.fontSize.value = String(state.fontSize);
          elements.fontSizeValue.textContent = String(state.fontSize);
          elements.mirrorPrint.checked = state.mirrorPrint;
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

        function cloneImagePositions(source) {
          return {
            left: { ...source.left },
            center: { ...source.center },
            right: { ...source.right },
          };
        }

        function getZones() {
          return LAYOUT_PRESETS[state.layoutPreset] || LAYOUT_PRESETS[DEFAULT_LAYOUT];
        }

        function renderIcons() {
          if (!window.lucide) return;
          window.lucide.createIcons({
            attrs: {
              "aria-hidden": "true",
              focusable: "false",
            },
          });
        }

        function buildImageShiftOverlay() {
          elements.imageShiftOverlay.textContent = "";
          ["left", "center", "right"].forEach((slot) => {
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
              pad.appendChild(button);
            });

            zone.appendChild(pad);
            elements.imageShiftOverlay.appendChild(zone);
          });
          updateImageShiftOverlay();
        }

        function updateImageShiftOverlay() {
          const zones = getZones();
          elements.imageShiftOverlay.querySelectorAll("[data-shift-zone]").forEach((zoneElement) => {
            const slot = zoneElement.dataset.shiftZone;
            const zone = zones[slot];
            const hasImage = Boolean(state.images[slot]);
            zoneElement.hidden = state.minimalMode || !hasImage;
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
            const groupElement = document.createElement("div");
            groupElement.className = "font-preview-group";

            const title = document.createElement("div");
            title.className = "font-preview-group-title";
            title.textContent = group.label;
            groupElement.appendChild(title);

            group.keys.forEach((fontKey) => {
              if (!FONT_OPTIONS[fontKey]) return;

              const option = document.createElement("button");
              option.type = "button";
              option.className = "font-preview-option";
              option.dataset.fontPreview = fontKey;
              option.setAttribute("role", "option");

              const name = document.createElement("span");
              name.className = "font-preview-name";
              name.textContent = FONT_LABELS[fontKey] || fontKey;

              const sample = document.createElement("span");
              sample.className = "font-preview-sample";
              sample.dataset.fontPreviewSample = fontKey;
              sample.style.fontFamily = getFontFamily(fontKey);

              option.append(name, sample);
              groupElement.appendChild(option);
            });

            elements.fontPreviewList.appendChild(groupElement);
          });
          updateFontPreviewSelection();
        }

        function toggleFontPreviewPopover(event) {
          event.stopPropagation();
          if (elements.fontPreviewPopover.hidden) {
            openFontPreviewPopover();
            return;
          }
          closeFontPreviewPopover();
        }

        function openFontPreviewPopover() {
          updateFontPreviewSamples();
          elements.fontPreviewPopover.hidden = false;
          elements.fontPreviewPopover.style.visibility = "hidden";
          positionFontPreviewPopover();
          elements.fontPreviewPopover.style.visibility = "";
          elements.fontPreviewButton.setAttribute("aria-expanded", "true");

          const selectedOption = getSelectedFontPreviewOption();
          if (!selectedOption) return;
          selectedOption.scrollIntoView({ block: "nearest" });
          selectedOption.focus({ preventScroll: true });
        }

        function closeFontPreviewPopover() {
          if (elements.fontPreviewPopover.hidden) return;
          elements.fontPreviewPopover.hidden = true;
          elements.fontPreviewButton.setAttribute("aria-expanded", "false");
        }

        function positionFontPreviewPopover() {
          const buttonRect = elements.fontPreviewButton.getBoundingClientRect();
          const popoverWidth = elements.fontPreviewPopover.offsetWidth || 420;
          const popoverHeight = elements.fontPreviewPopover.offsetHeight || 420;
          const margin = 12;
          const maxLeft = Math.max(margin, window.innerWidth - popoverWidth - margin);
          const left = Math.min(Math.max(buttonRect.right - popoverWidth, margin), maxLeft);
          const belowTop = buttonRect.bottom + 8;
          const aboveTop = buttonRect.top - popoverHeight - 8;
          const top = belowTop + popoverHeight <= window.innerHeight - margin
            ? belowTop
            : Math.max(margin, aboveTop);

          elements.fontPreviewPopover.style.left = `${left}px`;
          elements.fontPreviewPopover.style.top = `${top}px`;
        }

        function handleFontPreviewKeydown(event) {
          const options = getFontPreviewOptions();
          const currentIndex = options.indexOf(document.activeElement);
          if (currentIndex === -1) return;

          let nextIndex = currentIndex;
          if (event.key === "ArrowDown") nextIndex = Math.min(options.length - 1, currentIndex + 1);
          else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = options.length - 1;
          else return;

          event.preventDefault();
          options.forEach((option) => {
            option.tabIndex = -1;
          });
          options[nextIndex].tabIndex = 0;
          options[nextIndex].focus();
        }

        function updateFontPreviewSamples() {
          const previewText = getFontPreviewText();
          const direction = getTextDirection(previewText);
          const fontWeight = state.textFormat.bold ? "700" : "400";
          const fontStyle = state.textFormat.italic ? "italic" : "normal";
          const textShadow = state.textFormat.shadow ? "0 3px 5px rgba(0, 0, 0, 0.22)" : "none";

          elements.fontPreviewList.querySelectorAll("[data-font-preview-sample]").forEach((sample) => {
            sample.textContent = previewText;
            sample.dir = direction;
            sample.style.color = state.textColor;
            sample.style.fontWeight = fontWeight;
            sample.style.fontStyle = fontStyle;
            sample.style.textShadow = textShadow;
            sample.style.webkitTextStroke = state.textFormat.outline ? `1px ${state.outlineColor}` : "";
          });
          updateFontPreviewSelection();
        }

        function updateFontPreviewSelection() {
          getFontPreviewOptions().forEach((option) => {
            const isSelected = option.dataset.fontPreview === state.textFont;
            option.setAttribute("aria-selected", isSelected ? "true" : "false");
            option.tabIndex = isSelected ? 0 : -1;
          });
        }

        function getFontPreviewOptions() {
          return Array.from(elements.fontPreviewList.querySelectorAll("[data-font-preview]"));
        }

        function getSelectedFontPreviewOption() {
          return getFontPreviewOptions().find((option) => option.dataset.fontPreview === state.textFont);
        }

        function getFontPreviewText() {
          const text = state.text.trim();
          return text || "Votre texte نصك هنا";
        }

        function getFontFamily(fontKey) {
          return FONT_OPTIONS[fontKey] || FONT_OPTIONS[DEFAULT_TEXT_FONT];
        }

        function setLayoutPreset(layout) {
          state.layoutPreset = LAYOUT_PRESETS[layout] ? layout : DEFAULT_LAYOUT;
          updateLayoutButtons();
          render();
        }

        function updateLayoutButtons() {
          elements.layoutButtons.forEach((button) => {
            button.setAttribute("aria-pressed", state.layoutPreset === button.dataset.layout ? "true" : "false");
          });
        }

        function setMinimalMode(isEnabled) {
          state.minimalMode = Boolean(isEnabled);
          if (!state.minimalMode) quickTextEditing = false;
          if (state.minimalMode) {
            applyQuickModeDefaults();
            state.mirrorPrint = true;
            elements.mirrorPrint.checked = true;
            wizardStep = WIZARD_STEPS[getUnlockedWizardStepIndex()];
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

          state.layoutPreset = DEFAULT_LAYOUT;
          state.fitModes = { ...QUICK_FIT_MODES };
          state.imageShapes.center = DEFAULT_IMAGE_SHAPES.center;
          state.imagePositions = cloneImagePositions(DEFAULT_IMAGE_POSITIONS);
          state.imageScales = { ...DEFAULT_IMAGE_SCALES };
        }

        function updateMinimalMode() {
          elements.minimalMode.checked = state.minimalMode;
          document.body.classList.toggle("minimal-mode", state.minimalMode);
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
          document.body.classList.toggle("quick-text-editor", quickTextEditing);
          elements.quickTextEditButtonText.textContent = hasTextContent()
            ? "Modifier le texte"
            : "Ajouter du texte";
        }

        function setWizardStep(step) {
          const index = WIZARD_STEPS.indexOf(step);
          if (index === -1 || index > getUnlockedWizardStepIndex()) return;

          wizardStep = step;
          updateWizardUI();
          focusWizardStep();
        }

        function goToPreviousWizardStep() {
          const index = WIZARD_STEPS.indexOf(wizardStep);
          if (index <= 0) return;
          setWizardStep(WIZARD_STEPS[index - 1]);
        }

        function goToNextWizardStep(options = {}) {
          if (quickTextEditing) {
            setQuickTextEditor(false);
            return;
          }

          const isSkippingEmptyText =
            wizardStep === "text" && (options.allowEmptyText || canSkipWizardText());
          if (!isSkippingEmptyText && !canCompleteWizardStep(wizardStep)) {
            updateWizardUI();
            return;
          }

          const index = WIZARD_STEPS.indexOf(wizardStep);
          const nextStep = WIZARD_STEPS[Math.min(index + 1, WIZARD_STEPS.length - 1)];
          wizardStep = nextStep;
          updateWizardUI();
          focusWizardStep();
        }

        function handleWizardEnterKey(event) {
          if (
            !state.minimalMode ||
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
          if (target?.closest(".font-preview-popover")) return;
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
          if (state.images.left && state.images.right) return 3;
          if (state.images.left) return 1;
          return 0;
        }

        function canCompleteWizardStep(step) {
          if (step === "left") return Boolean(state.images.left);
          if (step === "right") return Boolean(state.images.right);
          if (step === "text") return hasTextContent();
          return true;
        }

        function canProceedWizardStep(step) {
          return canCompleteWizardStep(step) || (step === "text" && canSkipWizardText());
        }

        function canSkipWizardText() {
          return state.minimalMode && wizardStep === "text" && !hasTextContent();
        }

        function hasTextContent() {
          return Boolean(state.text.trim());
        }

        function updateWizardUI() {
          const unlockedIndex = getUnlockedWizardStepIndex();
          const currentIndex = WIZARD_STEPS.indexOf(wizardStep);
          if (currentIndex === -1 || currentIndex > unlockedIndex) {
            wizardStep = WIZARD_STEPS[unlockedIndex];
          }
          document.body.dataset.wizardStep = state.minimalMode ? wizardStep : "advanced";
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
            const index = WIZARD_STEPS.indexOf(button.dataset.wizardGo);
            const isCurrent = button.dataset.wizardGo === wizardStep;
            button.disabled = index > unlockedIndex;
            button.setAttribute("aria-current", isCurrent ? "step" : "false");
          });

          const isDone = wizardStep === "done";
          elements.wizardNav.hidden = !state.minimalMode || isDone;
          elements.wizardBack.disabled = WIZARD_STEPS.indexOf(wizardStep) === 0;
          elements.wizardNext.disabled = !quickTextEditing && !canProceedWizardStep(wizardStep);
          elements.wizardNextText.textContent = quickTextEditing
            ? "Terminer le texte"
            : wizardStep === "text"
            ? (hasTextContent() ? "Accepter" : "Continuer sans texte")
            : "Suivant";
          updatePreviewActionButton();
        }

        function getPreviewAction() {
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
                : hasTextContent() ? "Accepter" : "Continuer sans texte",
            };
          }

          return { action: "print", icon: "printer", label: "Imprimer" };
        }

        function updatePreviewActionButton() {
          const config = getPreviewAction();
          elements.previewActionButton.dataset.previewAction = config.action;
          elements.previewActionButton.disabled =
            config.action === "next" && !quickTextEditing && !canProceedWizardStep(wizardStep);
          elements.previewActionText.textContent = config.label;
          updatePreviewActionIcon(config.icon);
        }

        function updatePreviewActionIcon(icon) {
          if (elements.previewActionIcon.dataset.icon === icon) return;

          const createIconLayer = () => {
            const layer = document.createElement("span");
            layer.className = "preview-action-icon-layer";
            layer.innerHTML = `<i data-lucide="${icon}"></i>`;
            return layer;
          };

          const hasInitialized = Boolean(elements.previewActionIcon.dataset.icon);
          if (!hasInitialized) {
            const initialLayer = createIconLayer();
            initialLayer.classList.add("is-current");
            elements.previewActionIcon.replaceChildren(initialLayer);
            elements.previewActionIcon.dataset.icon = icon;
            renderIcons();
            return;
          }

          elements.previewActionIcon
            .querySelectorAll(".preview-action-icon-layer")
            .forEach((layer) => {
              layer.classList.remove("is-current");
              layer.classList.add("is-exiting");
            });
          const incoming = createIconLayer();
          elements.previewActionIcon.appendChild(incoming);
          elements.previewActionIcon.dataset.icon = icon;
          renderIcons();

          window.requestAnimationFrame(() => {
            if (elements.previewActionIcon.dataset.icon !== icon) {
              incoming.remove();
              return;
            }
            incoming.classList.add("is-current");
          });

          window.setTimeout(() => {
            elements.previewActionIcon
              .querySelectorAll(".preview-action-icon-layer.is-exiting")
              .forEach((layer) => layer.remove());
          }, 320);
        }

        function handlePreviewAction() {
          if (!state.minimalMode) return;

          const action = elements.previewActionButton.dataset.previewAction;
          if (action === "left-upload") {
            elements.leftImage.click();
            return;
          }
          if (action === "right-upload") {
            elements.rightImage.click();
            return;
          }
          if (action === "print") {
            printMug();
            return;
          }

          goToNextWizardStep({ allowEmptyText: canSkipWizardText() });
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
          elements.fitButtons.forEach((button) => {
            const isActive = state.fitModes[button.dataset.fitSlot] === button.dataset.fitMode;
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
          });
        }

        function setImageShape(slot, shape) {
          if (!state.imageShapes[slot] || !Object.prototype.hasOwnProperty.call(IMAGE_SHAPES, shape)) return;

          state.imageShapes[slot] = shape;
          updateImageShapeControls();
          saveDefaultPreferences();
          render();
        }

        function updateImageShapeControls() {
          elements.imageShapeControls.forEach((control) => {
            const hasImage = Boolean(state.images[control.dataset.imageShapeControl]);
            control.hidden = !hasImage;
            control.closest(".upload-row")?.setAttribute("data-image-loaded", String(hasImage));
          });
          elements.imageShapeButtons.forEach((button) => {
            const isActive = state.imageShapes[button.dataset.imageShapeSlot] === button.dataset.imageShape;
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
          });
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
          getImageInput(slot).value = "";
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
          return {
            left: elements.leftImage,
            center: elements.centerImage,
            right: elements.rightImage,
          }[slot];
        }

        function updatePositionControls() {
          elements.positionControls.forEach((control) => {
            const position = state.imagePositions[control.dataset.positionSlot];
            if (!position) return;
            const current = position[control.dataset.positionAxis];
            const target = Number(control.dataset.positionValue);
            const isActive = Math.abs(current - target) < 0.0001;
            control.setAttribute("aria-pressed", isActive ? "true" : "false");
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
          elements.colorPresetButtons.forEach((button) => {
            button.setAttribute("aria-pressed", normalizeHex(button.dataset.color) === state.textColor ? "true" : "false");
          });
          elements.outlinePresetButtons.forEach((button) => {
            const color = getOutlineColorFromPreset(button.dataset.outlinePreset);
            button.style.background = color;
            button.setAttribute("aria-pressed", normalizeHex(color) === state.outlineColor ? "true" : "false");
          });
        }

        function getOutlineColorFromPreset(presetId) {
          const preset = OUTLINE_PRESETS.find((item) => item.id === presetId) || OUTLINE_PRESETS[0];
          return preset.tonal ? getTonalOutlineColor(state.textColor) : preset.color;
        }

        function updateTextFormatButtons() {
          elements.textFormatButtons.forEach((button) => {
            button.setAttribute("aria-pressed", state.textFormat[button.dataset.textFormat] ? "true" : "false");
          });
        }

        function setTextPosition(position) {
          if (!["top", "center", "bottom"].includes(position)) return;

          state.textPosition = position;
          updateTextPositionButtons();
          saveDefaultPreferences();
          render();
        }

        function updateTextPositionButtons() {
          elements.textPositionButtons.forEach((button) => {
            button.setAttribute("aria-pressed", state.textPosition === button.dataset.textPosition ? "true" : "false");
          });
        }

        function setTextShape(shape) {
          if (!Object.prototype.hasOwnProperty.call(TEXT_SHAPES, shape)) return;

          state.textShape = shape;
          updateTextShapeButtons();
          saveDefaultPreferences();
          render();
        }

        function updateTextShapeButtons() {
          elements.textShapeButtons.forEach((button) => {
            button.setAttribute("aria-pressed", state.textShape === button.dataset.textShape ? "true" : "false");
          });
        }

        function setTextFont(fontKey) {
          state.textFont = FONT_OPTIONS[fontKey] ? fontKey : DEFAULT_TEXT_FONT;
          elements.fontSelect.value = state.textFont;
          updateFontPreviewSelection();
          saveDefaultPreferences();
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

        async function handleFile(event, slot) {
          const file = event.target.files && event.target.files[0];
          if (!file) return;

          try {
            const image = await loadImage(file);
            const item = {
              image,
              name: file.name,
              width: image.naturalWidth,
              height: image.naturalHeight,
            };
            if (state.minimalMode && state.fitModes[slot] === "resize") {
              useFullImage(slot, item);
              event.target.value = "";
              return;
            }
            openImageCropDialog(slot, item);
          } catch (error) {
            console.error(error);
            event.target.value = "";
            setStatus("Impossible de lire cette image.", true);
          }
        }

        function useFullImage(slot, item) {
          state.images[slot] = item;
          state.fitModes[slot] = "resize";
          state.imagePositions[slot] = { ...DEFAULT_IMAGE_POSITION };
          state.imageScales[slot] = DEFAULT_IMAGE_SCALE;
          setFileName(slot, item.name);
          updateFitButtons();
          updateRemoveButtons();
          updateCropButtons();
          updateImageShapeControls();
          updatePositionControls();
          updateWizardUI();
          setStatus("Image ajoutée");
          render();
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

        function openImageCropDialog(slot, item, opener = null) {
          const existingItem = state.images[slot];
          const isReframingCurrentImage = existingItem === item;
          cropDialogOpener = opener || document.activeElement;
          cropDraft = {
            slot,
            item,
            position: isReframingCurrentImage
              ? { ...state.imagePositions[slot] }
              : { ...DEFAULT_IMAGE_POSITION },
            scale: isReframingCurrentImage ? state.imageScales[slot] : DEFAULT_IMAGE_SCALE,
          };
          elements.cropPreviewImage.src = item.image.src;
          elements.cropZoom.value = String(cropDraft.scale);

          if (!elements.cropDialog.open) elements.cropDialog.showModal();

          window.requestAnimationFrame(() => {
            layoutCropViewport();
            renderCropPreview();
            elements.cropZoom.focus();
          });
        }

        function getCropTargetBounds(slot) {
          const zone = getZones()[slot];
          return getImageShapeBounds(zone, state.imageShapes[slot]);
        }

        function layoutCropViewport() {
          if (!cropDraft) return;

          const target = getCropTargetBounds(cropDraft.slot);
          const aspectRatio = target.width / target.height;
          const availableWidth = Math.max(220, Math.min(560, elements.cropPreviewStage.clientWidth - 40));
          const availableHeight = Math.max(190, Math.min(410, Math.round(window.innerHeight * 0.42)));
          let width = availableWidth;
          let height = width / aspectRatio;

          if (height > availableHeight) {
            height = availableHeight;
            width = height * aspectRatio;
          }

          elements.cropViewport.style.width = `${Math.round(width)}px`;
          elements.cropViewport.style.height = `${Math.round(height)}px`;
        }

        function getCropImageFrame() {
          if (!cropDraft) return null;

          const viewport = elements.cropViewport.getBoundingClientRect();
          if (!viewport.width || !viewport.height) return null;

          const baseScale = Math.max(
            viewport.width / cropDraft.item.width,
            viewport.height / cropDraft.item.height,
          );
          const width = cropDraft.item.width * baseScale * cropDraft.scale;
          const height = cropDraft.item.height * baseScale * cropDraft.scale;
          return {
            viewport,
            width,
            height,
            x: (viewport.width - width) * cropDraft.position.x,
            y: (viewport.height - height) * cropDraft.position.y,
          };
        }

        function renderCropPreview() {
          const frame = getCropImageFrame();
          if (!frame) return;

          elements.cropPreviewImage.style.width = `${frame.width}px`;
          elements.cropPreviewImage.style.height = `${frame.height}px`;
          elements.cropPreviewImage.style.left = `${frame.x}px`;
          elements.cropPreviewImage.style.top = `${frame.y}px`;
          elements.cropZoom.value = String(cropDraft.scale);
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
            frame,
          };
          elements.cropViewport.setPointerCapture(event.pointerId);
          elements.cropViewport.classList.add("is-dragging");
        }

        function moveCropDrag(event) {
          if (!cropDraft || !cropDrag || cropDrag.pointerId !== event.pointerId) return;

          const deltaX = event.clientX - cropDrag.startX;
          const deltaY = event.clientY - cropDrag.startY;
          const horizontalRange = cropDrag.frame.viewport.width - cropDrag.frame.width;
          const verticalRange = cropDrag.frame.viewport.height - cropDrag.frame.height;

          cropDraft.position.x = Math.abs(horizontalRange) < 0.001
            ? DEFAULT_IMAGE_POSITION.x
            : Math.min(1, Math.max(0, (cropDrag.frame.x + deltaX) / horizontalRange));
          cropDraft.position.y = Math.abs(verticalRange) < 0.001
            ? DEFAULT_IMAGE_POSITION.y
            : Math.min(1, Math.max(0, (cropDrag.frame.y + deltaY) / verticalRange));
          renderCropPreview();
        }

        function endCropDrag(event) {
          if (!cropDrag || cropDrag.pointerId !== event.pointerId) return;

          if (elements.cropViewport.hasPointerCapture(event.pointerId)) {
            elements.cropViewport.releasePointerCapture(event.pointerId);
          }
          cropDrag = null;
          elements.cropViewport.classList.remove("is-dragging");
        }

        function centerCropImage() {
          if (!cropDraft) return;

          cropDraft.position = { ...DEFAULT_IMAGE_POSITION };
          renderCropPreview();
        }

        function resetCropImage() {
          if (!cropDraft) return;

          cropDraft.position = { ...DEFAULT_IMAGE_POSITION };
          cropDraft.scale = DEFAULT_IMAGE_SCALE;
          renderCropPreview();
        }

        function closeImageCrop() {
          const input = cropDraft ? getImageInput(cropDraft.slot) : null;
          if (elements.cropDialog.open) elements.cropDialog.close();
          if (input) input.value = "";
          elements.cropPreviewImage.removeAttribute("src");
          cropDraft = null;
          cropDrag = null;
          const opener = cropDialogOpener;
          cropDialogOpener = null;
          if (opener instanceof HTMLElement) opener.focus();
        }

        function cancelImageCrop() {
          closeImageCrop();
          setStatus("Cadrage annulé");
        }

        function applyImageCrop() {
          if (!cropDraft) return;

          const { slot, item, position, scale } = cropDraft;
          state.images[slot] = item;
          state.imagePositions[slot] = { ...position };
          state.imageScales[slot] = scale;
          state.fitModes[slot] = "cut";
          setFileName(slot, item.name);
          updateFitButtons();
          updateRemoveButtons();
          updateCropButtons();
          updateImageShapeControls();
          updatePositionControls();
          updateWizardUI();
          closeImageCrop();
          setStatus("Image cadrée");
          render();
        }

        function setFileName(slot, name) {
          const target = {
            left: elements.leftName,
            center: elements.centerName,
            right: elements.rightName,
          }[slot];
          target.textContent = name;
          target.title = state.images[slot] ? name : "";
          if (slot === "center") {
            elements.quickCenterName.textContent = name;
            elements.quickCenterName.title = state.images.center ? name : "";
          }
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

        function resizeStage() {
          const area = document.querySelector(".stage-area");
          const layout = SHEET_LAYOUTS[sheetLayout] || SHEET_LAYOUTS["3up"];
          const actionReserve = getPreviewActionReserve();
          const availableWidth = Math.max(area.clientWidth - 48, 320);
          const availableHeight = Math.max(area.clientHeight - 48 - actionReserve, 220);
          const scale = Math.min(
            availableWidth / layout.widthMm,
            availableHeight / layout.heightMm,
            EXPORT_WIDTH / layout.widthMm,
            EXPORT_HEIGHT / layout.heightMm,
          );
          const width = Math.round(layout.widthMm * scale);
          const height = Math.round(layout.heightMm * scale);
          previewScale = Math.max(width / EXPORT_WIDTH, height / EXPORT_HEIGHT);
          previewOffset = {
            x: (width - EXPORT_WIDTH * previewScale) / 2,
            y: (height - EXPORT_HEIGHT * previewScale) / 2,
          };
          stage.width(width);
          stage.height(height);
          contentLayer.scale({ x: previewScale, y: previewScale });
          contentLayer.position(previewOffset);
          guideLayer.scale({ x: previewScale, y: previewScale });
          guideLayer.position(previewOffset);
          elements.stageFrame.style.width = `${width}px`;
          elements.stageFrame.style.height = `${height}px`;
          updateImageShiftOverlay();
          render();
        }

        function getPreviewActionReserve() {
          if (!state.minimalMode) return 0;

          const actionHeight = elements.previewActionButton.offsetHeight || 56;
          return actionHeight + 12;
        }

        function render() {
          updateImageShiftOverlay();
          contentLayer.destroyChildren();
          guideLayer.destroyChildren();

          contentLayer.add(
            new Konva.Rect({
              x: 0,
              y: 0,
              width: EXPORT_WIDTH,
              height: EXPORT_HEIGHT,
              fill: "#ffffff",
            }),
          );

          renderImageSlot("left");
          renderImageSlot("center");
          renderImageSlot("right");
          renderText();
          renderGuides();

          contentLayer.batchDraw();
          guideLayer.batchDraw();
        }

        function renderImageSlot(slot) {
          const item = state.images[slot];
          const zone = getZones()[slot];
          const shape = state.imageShapes[slot];
          const shapeBounds = getImageShapeBounds(zone, shape);
          const group = new Konva.Group({
            clipFunc: (context) => {
              context.beginPath();
              drawImageShapePath(context, shape, shapeBounds);
            },
          });

          if (!item) {
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
            state.imageScales[slot],
          );
          group.add(
            new Konva.Image({
              image: item.image,
              x: placement.x,
              y: placement.y,
              width: placement.width,
              height: placement.height,
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
          if (!text) return;

          const zone = getZones().center;
          const padding = 46;
          const maxWidth = zone.width - padding * 2;
          const layout = getTextLayout(text, maxWidth, zone.height - padding * 2, state.fontSize);
          const textBlock = getTextBlock(zone, layout, padding);
          const outlineStyle = getTextOutlineStyle(layout.fontSize);
          const shadowBlur = state.textFormat.shadow ? 8 : 0;
          renderTextShapes(zone, textBlock, layout.fontSize);
          const node = new Konva.Text({
            x: zone.x + padding,
            y: 0,
            width: maxWidth,
            text: layout.lines.join("\n"),
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

        function renderGuides() {
          const zones = getZones();
          const lineColor = "rgba(20, 33, 61, 0.24)";
          guideLayer.add(
            new Konva.Rect({
              x: 1,
              y: 1,
              width: EXPORT_WIDTH - 2,
              height: EXPORT_HEIGHT - 2,
              stroke: "rgba(20, 33, 61, 0.42)",
              strokeWidth: 3,
            }),
          );

          [zones.center.x, zones.right.x].forEach((x) => {
            guideLayer.add(
              new Konva.Line({
                points: [x, 0, x, EXPORT_HEIGHT],
                stroke: lineColor,
                strokeWidth: 4,
                dash: [18, 18],
              }),
            );
          });
        }

        function getPlacement(item, zone, mode, position = DEFAULT_IMAGE_POSITION, imageScale = DEFAULT_IMAGE_SCALE) {
          const fitScale =
            mode === "cut"
              ? Math.max(zone.width / item.width, zone.height / item.height)
              : Math.min(zone.width / item.width, zone.height / item.height);
          const scale = fitScale * Math.max(DEFAULT_IMAGE_SCALE, Number(imageScale) || DEFAULT_IMAGE_SCALE);
          const width = item.width * scale;
          const height = item.height * scale;
          return {
            x: zone.x + (zone.width - width) * position.x,
            y: zone.y + (zone.height - height) * position.y,
            width,
            height,
          };
        }

        async function downloadPng(options = {}) {
          await ensureTextFontLoaded();
          const canvas = createExportCanvas({ mirror: Boolean(options.mirror) });

          canvas.toBlob((blob) => {
            if (!blob) {
              setStatus("Impossible de créer le PNG.", true);
              return;
            }

            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            const suffix = options.mirror ? "-miroir" : "";
            anchor.download = `creation-mug${suffix}-${new Date().toISOString().slice(0, 10)}.png`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            setStatus("PNG téléchargé");
          }, "image/png");
        }

        async function addToPage() {
          await ensureTextFontLoaded();
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
          if (!SHEET_LAYOUTS[layout]) return;
          sheetLayout = layout;
          updateSheetLayoutButtons();
          saveDefaultPreferences();
          resizeStage();
        }

        function updateSheetLayoutButtons() {
          elements.sheetOptions.forEach((button) => {
            button.setAttribute("aria-pressed", button.dataset.sheetLayout === sheetLayout ? "true" : "false");
          });
        }

        function updateQueueUI() {
          const count = printQueue.length;
          elements.queuePanel.hidden = count === 0;
          const printText = elements.printButton.querySelector(".button-text");
          if (printText) printText.textContent = count ? `Imprimer la page (${count})` : "Imprimer";
          if (!count) return;
          queueIndex = Math.max(0, Math.min(queueIndex, count - 1));
          elements.queueLabel.textContent = `Création ${queueIndex + 1} / ${count}`;
          elements.queueThumb.src = printQueue[queueIndex];
          elements.queuePrev.disabled = queueIndex === 0;
          elements.queueNext.disabled = queueIndex === count - 1;
        }

        async function printMug() {
          const printWindow = shouldUseStandalonePrintWindow() ? window.open("", "_blank") : null;
          if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(`<!doctype html><title>Impression du mug</title><body>Préparation...</body>`);
            printWindow.document.close();
          }

          await ensureTextFontLoaded();
          const single = printQueue.length === 0;
          const images = single
            ? [createExportCanvas().toDataURL("image/png")]
            : printQueue.slice();
          const layout = single ? SHEET_LAYOUTS["3up"] : SHEET_LAYOUTS[sheetLayout];
          const perPage = single ? 1 : layout.perPage;
          const printMarkup = createPrintMarkup(images, layout, perPage, { standalone: Boolean(printWindow) });

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
          const cutOffset = layout.gapMm > 0 ? `-${layout.gapMm / 2}mm` : "0";
          const mirrorClass = state.mirrorPrint ? " mirror" : "";
          const standalone = Boolean(options.standalone);
          const sheets = [];

          for (let index = 0; index < images.length; index += perPage) {
            const cells = images
              .slice(index, index + perPage)
              .map((url) => `<div class="cell${mirrorClass}"><img src="${url}" alt="Création pour mug"></div>`)
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
                <title>Impression du mug</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  @page { size: A4 portrait; margin: 0; }
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
                    width: 210mm;
                    height: 297mm;
                    box-sizing: border-box;
                    page-break-after: always;
                    break-after: page;
                  }
                  .sheet:last-child {
                    page-break-after: auto;
                    break-after: auto;
                  }
                  .cell {
                    position: relative;
                    width: ${layout.widthMm}mm;
                    height: ${layout.heightMm}mm;
                    margin: 0 auto ${layout.gapMm}mm auto;
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
          try {
            canvas = contentLayer.toCanvas({
              x: 0,
              y: 0,
              width: EXPORT_WIDTH,
              height: EXPORT_HEIGHT,
              pixelRatio: 1,
            });
          } finally {
            contentLayer.position({ x: previewTransform.x, y: previewTransform.y });
            contentLayer.scale({ x: previewTransform.scaleX, y: previewTransform.scaleY });
          }

          if (!options.mirror) return canvas;

          const mirroredCanvas = document.createElement("canvas");
          mirroredCanvas.width = EXPORT_WIDTH;
          mirroredCanvas.height = EXPORT_HEIGHT;
          const mirroredContext = mirroredCanvas.getContext("2d");
          mirroredContext.translate(EXPORT_WIDTH, 0);
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
              line = word;
            });
            if (line) output.push(line);
          });

          return output;
        }

        function hasCreationInProgress() {
          return Boolean(
            state.images.left ||
              state.images.center ||
              state.images.right ||
              state.text.trim() ||
              printQueue.length,
          );
        }

        function protectCreationBeforeUnload(event) {
          if (!hasCreationInProgress()) return;

          event.preventDefault();
          event.returnValue = "";
        }

        function clearAll() {
          const confirmed = window.confirm(
            "Supprimer tout le design ? Cette action efface les images, le texte et les réglages.",
          );
          if (!confirmed) {
            setStatus("Suppression annulée");
            return;
          }

          state.images.left = null;
          state.images.center = null;
          state.images.right = null;
          state.layoutPreset = DEFAULT_LAYOUT;
          state.fitModes = { ...QUICK_FIT_MODES };
          state.imageShapes = { ...DEFAULT_IMAGE_SHAPES };
          state.imagePositions = cloneImagePositions(DEFAULT_IMAGE_POSITIONS);
          state.imageScales = { ...DEFAULT_IMAGE_SCALES };
          state.minimalMode = true;
          wizardStep = "left";
          state.text = "";
          state.textPosition = "center";
          state.textFont = DEFAULT_TEXT_FONT;
          state.fontSize = DEFAULT_FONT_SIZE;
          state.textColor = DEFAULT_TEXT_COLOR;
          state.outlineColor = getDefaultOutlineColor(DEFAULT_TEXT_COLOR);
          state.textFormat = { ...DEFAULT_TEXT_FORMAT };
          state.textShape = DEFAULT_TEXT_SHAPE;
          state.mirrorPrint = true;
          sheetLayout = "3up";
          elements.leftImage.value = "";
          elements.centerImage.value = "";
          elements.rightImage.value = "";
          setFileName("left", DEFAULT_FILE_LABELS.left);
          setFileName("center", DEFAULT_FILE_LABELS.center);
          setFileName("right", DEFAULT_FILE_LABELS.right);
          elements.textInput.value = "";
          updateLayoutButtons();
          updateMinimalMode();
          updateWizardUI();
          updatePositionControls();
          updateRemoveButtons();
          updateCropButtons();
          updateImageShapeControls();
          elements.fontSelect.value = state.textFont;
          elements.fontSize.value = String(state.fontSize);
          elements.fontSizeValue.textContent = String(state.fontSize);
          elements.mirrorPrint.checked = state.mirrorPrint;
          updateTextFormatButtons();
          updateTextPositionButtons();
          updateTextShapeButtons();
          setTextColor(state.textColor);
          updateFitButtons();
          updateSheetLayoutButtons();
          saveDefaultPreferences();
          setStatus("Prêt");
          render();
        }
      })();
