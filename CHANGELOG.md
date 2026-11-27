# Changelog

## 1.0.2 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 1.0.1 — 2026-11-25

- A short getting-started guide: the first time it opens it asks for your language, then walks
  you through the window in it. The **Guide** button brings it back.

## 1.0.0 — 2026-11-23

- First release: drum step sequencer that writes its pattern live into a MIDI clip over LUNA's
  loop, 8 rows with editable notes, 8 to 32 steps in straight or triplet values.
- The die: new patterns with musical sense, variations, per-row dice, locked rows, roll history.
- Generator per row (Hits, Pattern, Shift, Velocity) in the spirit of Ableton's Rhythm.
- Accents and soft hits, 8-step blocks (repeat previous, copy, paste, vary), named clips.
- Dark and grey themes, 7 languages, Alt-click the version for a support report.
