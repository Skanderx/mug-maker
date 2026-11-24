const frame = document.querySelector("#app");
const surface = document.querySelector("#surface");
const buttons = Array.from(document.querySelectorAll("[data-fixture]"));
const status = document.querySelector("#fixture-status");

const photos = {
  demo: [
    { name: "Côte de Carthage.png", width: 1200, height: 800, colors: ["#164e63", "#fbbf24"] },
    { name: "Fleurs du jardin.png", width: 900, height: 1200, colors: ["#be185d", "#fbcfe8"] },
  ],
  worst: [
    { name: "IMG_20251118_183022_HDR_PanoramiqueDesCollinesDeCarthage_RecadrageFinalVersion12.png", width: 4000, height: 200, colors: ["#713f12", "#fbbf24"] },
    { name: "Đặng Thị Ngọc Hân — Souvenir de voyage (version imprimable).png", width: 200, height: 4000, colors: ["#14532d", "#99f6e4"] },
    { name: "Logo noir transparent — Atelier de sérigraphie.png", width: 1000, height: 1000, colors: ["#17202a"] },
    { name: "J.png", width: 640, height: 640, colors: ["#312e81", "#fda4af"] },
  ],
};

const messages = {
  demo: "Merci, Louise !",
  worst: [
    "Chère Louise,",
    "Pour tes soixante ans, chacun a laissé un souvenir.",
    "Les matins de vacances chez toi,",
    "les tartines à la confiture d’abricot,",
    "les parties de cartes qui n’en finissaient plus,",
    "les randonnées dans le vent de Bretagne,",
    "le premier Noël dans la maison bleue,",
    "les dessins accrochés sur le frigo,",
    "et les histoires que tu racontais après le dîner.",
    "Merci pour les appels du dimanche,",
    "les recettes recopiées à la main,",
    "et la place que tu fais à chacun autour de la table.",
    "Aleksandra Wiśniewska-Kowalczyk",
    "Đặng Thị Ngọc Hân",
    "نور الهدى عبد الرحمن — 王秀英",
    "Jo et toute l’équipe 👩🏽‍💻",
    "On se retrouve le 28 novembre",
    "pour lever nos tasses à ta santé.",
    "Prends cette tasse pour les matins pressés,",
    "et garde les dimanches pour les cafés qui durent.",
    "Les photos sont dans notre album de famille",
    "https://example.com/atelier/cadeaux-personnalises/collection-anniversaire",
    "Avec tout notre amour,",
    "Joyeux anniversaire !",
  ].join("\n"),
  empty: "",
  one: "J",
};

let fixture;
const url = new URL(location.href);
const requestedSurface = url.searchParams.get("surface");
if ([...surface.options].some(option => option.value === requestedSurface)) {
  surface.value = requestedSurface;
}
const requestedFixture = url.searchParams.get("data");
fixture = Object.hasOwn(messages, requestedFixture) ? requestedFixture : "demo";

surface.addEventListener("change", loadFixture);
buttons.forEach(button => button.addEventListener("click", () => {
  fixture = button.dataset.fixture;
  loadFixture();
}));
function loadFixture() {
  const state = new URL(location.href);
  state.searchParams.set("surface", surface.value);
  state.searchParams.set("data", fixture);
  history.replaceState(null, "", state);
  buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.fixture === fixture)));
  status.textContent = "Loading…";
  frame.src = "../index.html";
}

frame.addEventListener("load", async () => {
  const doc = frame.contentDocument;
  if (!doc?.querySelector("#stage")) return;
  const view = surface.value;
  const data = fixture;
  const click = selector => doc.querySelector(selector).click();
  const isMousePad = view === "mousepad" || view === "advanced-pad";
  const isAdvanced = view === "advanced" || view === "advanced-pad" || view === "queue";
  const files = data === "worst" ? photos.worst : photos.demo;

  try {
    await Promise.all(["ui-file-input", "ui-dialog-content", "ui-switch", "ui-toggle-group", "ui-textarea", "ui-button"].map(
      tag => frame.contentWindow.customElements.whenDefined(tag),
    ));
    if (doc !== frame.contentDocument) return;
    if (isMousePad) click("#productSwitchButton");
    if (isAdvanced) click("#minimalMode");
    if (doc.body.dataset.product === "mousepad" && data === "worst") {
      click('#mousepadLayoutOptions [data-layout="fourGrid"]');
    }

    if (data !== "empty") {
      if (view === "crop") {
        await upload(doc, "left", files[0], false);
        if (data === "worst") click('[data-crop-mode="resize"]');
      } else if (isMousePad) {
        if (view === "mousepad") click("#wizardNext");
        const slots = data === "worst" ? ["background", "photo1", "photo2", "photo3", "photo4"] : ["photo1"];
        for (const [index, slot] of slots.entries()) {
          await upload(doc, slot, files[index % files.length]);
        }
      } else {
        await upload(doc, "left", files[0]);
        if (data !== "one" || view === "text") await upload(doc, "right", files[1]);
        if (data === "worst") await upload(doc, "center", files[2]);
        const text = doc.querySelector("#textEditor");
        text.api.setValue(view === "queue" && data === "worst" ? messages.demo : messages[data]);
        if (view === "text") {
          click('[data-wizard-go="text"]');
          click("#quickTextEditButton");
        }
        if (view === "queue") {
          const count = data === "worst" ? 5 : 1;
          const addToPage = doc.querySelector("#addToPageButton");
          for (let index = 0; index < count; index += 1) {
            addToPage.click();
            await observeUntil(doc.querySelector("#queueLabel"), label => label.textContent.endsWith(` / ${index + 1}`));
            await observeUntil(addToPage, button => !button.hasAttribute("data-pending"));
          }
          doc.querySelector("#queuePanel").scrollIntoView({ block: "nearest" });
          if (data === "worst") {
            text.api.setValue(messages.worst);
          }
        }
      }
    }
    if (doc === frame.contentDocument) status.textContent = "";
  } catch (error) {
    if (doc === frame.contentDocument) status.textContent = error.message;
  }
});

loadFixture();

async function upload(doc, slot, photo, apply = true) {
  const input = doc.querySelector(`[data-image-input-slot="${slot}"]`);
  const dialog = doc.querySelector("#imageCropDialog");
  const blob = await drawPhoto(photo);
  const file = new frame.contentWindow.File([blob], photo.name, { type: "image/png" });
  input.api.addFiles([file]);
  await observeUntil(dialog, target => target.open);
  if (apply) doc.querySelector("#cropApplyButton").click();
}

function drawPhoto({ width, height, colors }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (colors.length === 1) {
    ctx.fillStyle = colors[0];
    ctx.font = 'bold 45px system-ui';
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 8;
    ctx.strokeRect(width * .15, height * .15, width * .7, height * .7);
    ctx.fillText("ATELIER", width * .19, height * .5);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff9c";
    ctx.beginPath();
    ctx.ellipse(width * .62, height * .4, width * .21, height * .22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function observeUntil(element, condition) {
  if (condition(element)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (!condition(element)) return;
      clearTimeout(timer);
      observer.disconnect();
      resolve();
    });
    observer.observe(element, { attributes: true, subtree: true, childList: true, characterData: true });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Fixture could not reach ${element.id}.`));
    }, 8000);
  });
}
