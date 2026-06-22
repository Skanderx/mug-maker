@/Users/skanderbenamor/.codex/RTK.md

# Project Rules

## Quick Mode UX

- Quick mode is for users who may not read small labels or understand hidden controls.
- Avoid scroll-dependent flows in quick mode. Prefer visible step navigation, preview-area action buttons, and Next/Back buttons.
- Keep the current quick-mode task visible without requiring the user to hunt below the fold.
- If a control is not needed for the current step, hide it in quick mode instead of making the user ignore it.
- Prefer one obvious primary action per quick-mode step.
- Quick mode must remain usable at 175% browser zoom. The primary action, Next/Back controls, and required choice controls for the active step (such as text and colour) must remain visible without relying on vertical scrolling; reserve safe space for any fixed or sticky controls.
- Do not increase quick-mode navigation complexity for optional choices. Keep optional controls inside their relevant existing step, reveal only the controls needed to complete that choice, and never require the user to navigate backwards to find them.
- Use a highly contrasted, clearly labelled primary action for every quick-mode step so users with low vision can identify the next action immediately.
- Keep print as the primary final action. Mirror print should stay enabled by default, but controls that could accidentally change it should stay hidden in quick mode.
- The centre image is optional in quick mode and belongs in the text/color step; quick mode uses left image, right image, optional text/color/centre image, then print/download.
