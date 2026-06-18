@/Users/skanderbenamor/.codex/RTK.md

# Project Rules

## Quick Mode UX

- Quick mode is for users who may not read small labels or understand hidden controls.
- Avoid scroll-dependent flows in quick mode. Prefer visible step navigation, preview-area action buttons, and Next/Back buttons.
- Keep the current quick-mode task visible without requiring the user to hunt below the fold.
- If a control is not needed for the current step, hide it in quick mode instead of making the user ignore it.
- Prefer one obvious primary action per quick-mode step.
- Keep print as the primary final action. Mirror print should stay enabled by default, but controls that could accidentally change it should stay hidden in quick mode.
- The center image is advanced-only; quick mode uses left image, right image, optional text/color, then print/download.
