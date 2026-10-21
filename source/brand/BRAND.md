# ACCESS Indigenous Skills4Success design system (from the ACCESS brand identity canvas, Sept 2026)

## Colour (sampled from the ACCESS logo file; contrast measured)
- ACCESS Red #D2181F (--acc-red): wordmark, headings, primary actions. White text on it 5.40:1 AA.
- Deep Red #C60016 (--acc-red-deep): the figure in the symbol; solid fills, dark ground. White on it 6.15:1 AA.
- ACCESS Gold #FFBC00 (--acc-gold): arcs. Accent, rules and highlight FILLS ONLY. Never for type (1.69:1 on white). Ink text on gold is fine (10.31:1).
- Red ramp: 100 #FAE8E9, 200 #F2BABC, 400 #E47479, 600 #D2181F, 800 #9E1217
- Deep red ramp: 100 #F9E6E8, 200 #EEB2B9, 400 #DD6673, 600 #C60016, 800 #940010
- Gold ramp: 100 #FFF8E6, 200 #FFEBB2, 400 #FFD766, 600 #FFBC00, 800 #BF8D00
- Neutrals: Ink #1A1A1A, Slate #4A4E54, Mist #F4F5F6, White #FFFFFF. Also used: line #E5E7E9, muted #8E9298.
- Previous ACCESS tools (stair calculator) used a 4px gold rule under the header, Deep Red accent, a warmer ground #F7F4F1 with ink #1A1512, and a dark mode.

## Type (recommended pairing, not confirmed by ACCESS)
- Archivo 500/600/700 — display, headings, numbers, signage.
- IBM Plex Sans 400/500/600 — body, interface. IBM Plex Mono for figures in calculators.
- Scale 1.25: Display 61/1.05, H1 49/1.10, H2 39/1.15, H3 31/1.20, H4 25/1.30, Body L 20/1.60, Body 16/1.65, Small 14/1.50, Caption 12/1.40.
- Body text minimum 16px on screen. Use tabular figures for dimensions.

## Logo
- Inline SVG <defs> with three groups: #acc-gold (4 gold arcs), #acc-fig (figure), #acc-word (ACCESS wordmark). File: access-logo-defs.svg (hidden defs block — paste into the page once, then <use href="#acc-...">).
- Full-colour lockup: <svg viewBox="35 30 205.2 102.9"><g style="color:#FFBC00"><use href="#acc-gold"/></g><g style="color:#C60016"><use href="#acc-fig"/></g><g style="color:#D2181F"><use href="#acc-word"/></g></svg>
- Symbol only: viewBox="35 30 92.1 102.9" (gold + fig). Wordmark only: viewBox="113.8 82.9 126.4 22.1".
- Reversed (on red/dark): all three groups color #FFFFFF.
- Clear space = wordmark cap height (0.215 × lockup height) on every side. Min size: lockup 140px wide, symbol 28px.
- Never recolour (other than reversed white), stretch, rotate, place on low contrast, or retype "ACCESS" in a font.
- Standalone files: access-lockup.svg, access-lockup-white.svg, access-symbol.svg.

## Teaching context
- ACCESS = Aboriginal Community Career Employment Services Society (urban Indigenous labour-market/training org). Program framing: "Essential Skills for Aboriginal Futures". Current framework: the 9 Skills for Success (Reading, Writing, Numeracy, Digital, Problem Solving, Communication, Collaboration, Adaptability, Creativity and Innovation). Focus: NUMERACY — "find, understand, use and report mathematical information presented through words, numbers, symbols and graphics."
- Exercises are tagged with a Skills for Success complexity level 1–3.

## IS4S badge (ACCESS Indigenous Skills4Success)
- Files: is4s-badge.svg (full colour, white circle fill, transparent outside the circle) and is4s-badge-mono.svg (one colour black, no fill, lower feather knocked back from the upper one so both read in one ink). PNG renders with transparent background: is4s-badge-256/512/1024/2048.png and is4s-badge-mono-256/512/1024/2048.png (number = width in px).
- Rebuilt Oct 2026 from the only available copy, a 180 x 165 px PNG. viewBox 0 0 1800 1650, all text converted to outlines, no fonts or external files needed. Ids are prefixed is4s-.
- Type identified by outline matching: Raleway ExtraBold (800) for INDIGENOUS, Raleway Bold (700) for SKILLS4SUCCESS with the lining 4, both tracked about 0.2 em.
- The ACCESS logo uses the vector paths from access-logo-defs.svg at the standard lockup proportions. In the badge the figure is ACCESS Red, not Deep Red.
- Colours: ACCESS Red for the figure, wordmark, the I and both S. ACCESS Gold for the arcs, the 4 and the lower feather. Pure black #000000 for the ring, the remaining text and the upper feather.
- Use it on IS4S program material (books, slide decks, Word documents, teaching tools). Keep the ACCESS lockup for ACCESS-wide items. Use the SVG wherever it is accepted (web, Microsoft 365 Insert Pictures), the 1024 or 2048 PNG for older Office or Google Docs, the 256 or 512 PNG for on-screen headers. Use the mono version for faxes, rubber stamps, photocopies and single-colour print.
- Suggested minimum size 25 mm (1 in) wide in print or 120 px on screen, so SKILLS4SUCCESS stays legible. Never recolour (other than mono), stretch, retype the text or separate the feathers from the ring.
