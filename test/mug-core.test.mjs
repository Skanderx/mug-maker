import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TEXT_COLOR,
  MOUSE_PAD_EXPORT_HEIGHT,
  MOUSE_PAD_EXPORT_WIDTH,
  clampPosition,
  getContrastRatio,
  getDefaultOutlineColor,
  getMousePadGuideLines,
  getMousePadPhotoSlots,
  getMousePadZones,
  getOutlineColorOptions,
  getPositionFromPercent,
  getPositionPercent,
  normalizeHex,
} from "../assets/js/mug-core.js";

test("image positions are constrained to the printable range", () => {
  assert.equal(clampPosition(-0.2), 0);
  assert.equal(clampPosition(1.4), 1);
  assert.equal(clampPosition("0.25"), 0.25);
  assert.equal(clampPosition("not-a-number"), null);
  assert.equal(getPositionFromPercent(25), 0.25);
  assert.equal(getPositionFromPercent(140), 1);
  assert.equal(getPositionPercent(null), "0");
  assert.equal(getPositionPercent(undefined), "50");
});

test("text colours are normalised before they reach the canvas", () => {
  assert.equal(normalizeHex(" #AbC "), "#aabbcc");
  assert.equal(normalizeHex("#123456"), "#123456");
  assert.equal(normalizeHex("red"), DEFAULT_TEXT_COLOR);
});

test("outline options keep the selected text colour readable", () => {
  const options = getOutlineColorOptions("#ffffff");

  assert.equal(options.length, 4);
  assert.equal(getDefaultOutlineColor("#ffffff"), options[0]);
  assert.ok(getContrastRatio(options[0], "#ffffff") > 4.5);
  assert.deepEqual(options.slice(1), ["#1b1b1f", "#ffffff", "#c9a227"]);
});

test("mouse pad layouts expose the required photo slots", () => {
  assert.deepEqual(getMousePadPhotoSlots("one"), ["photo1"]);
  assert.deepEqual(getMousePadPhotoSlots("twoSide"), ["photo1", "photo2"]);
  assert.deepEqual(getMousePadPhotoSlots("twoStacked"), ["photo1", "photo2"]);
  assert.deepEqual(getMousePadPhotoSlots("threeSide"), ["photo1", "photo2", "photo3"]);
  assert.deepEqual(getMousePadPhotoSlots("fourGrid"), ["photo1", "photo2", "photo3", "photo4"]);
});

test("mouse pad layout geometry fills a 220 by 180 landscape pad", () => {
  assert.deepEqual(getMousePadZones("one").photo1, {
    x: 0,
    y: 0,
    width: MOUSE_PAD_EXPORT_WIDTH,
    height: MOUSE_PAD_EXPORT_HEIGHT,
  });
  assert.deepEqual(getMousePadZones("fourGrid").photo4, {
    x: MOUSE_PAD_EXPORT_WIDTH / 2,
    y: MOUSE_PAD_EXPORT_HEIGHT / 2,
    width: MOUSE_PAD_EXPORT_WIDTH / 2,
    height: MOUSE_PAD_EXPORT_HEIGHT / 2,
  });
  assert.deepEqual(getMousePadGuideLines("twoStacked"), [
    {
      orientation: "horizontal",
      points: [0, MOUSE_PAD_EXPORT_HEIGHT / 2, MOUSE_PAD_EXPORT_WIDTH, MOUSE_PAD_EXPORT_HEIGHT / 2],
    },
  ]);
});
