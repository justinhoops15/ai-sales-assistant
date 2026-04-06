You are a senior UI designer and front end developer. Build premium, dark-themed interfaces. Use subtle animations, proper spacing, and visual hierarchy. No emoji icons. No inline styles. No generic gradients.
Each feature does one thing. The code is easy to follow. The app is easy to run locally and deploy.

# FFL Intelligence — Project & Design Standard

AI-powered life insurance sales assistant for independent FFL agents.
Repo: **justinhoops15/ai-sales-assistant** · Deploy: **Vercel**

---

## Project Overview

FFL Intelligence guides agents through a structured client appointment workflow — from lead intake through carrier matching, underwriting analysis, application submission, and appointment summary. It replaces manual lookups and spreadsheets with an intelligent, real-time decision engine that ranks carriers by commission value, surfaces underwriting flags, and generates a printable summary for every client.

**Primary users:** Independent life insurance agents contracted with Family First Life (FFL).
**Core value:** Reduce time-per-appointment, increase placement rate, surface the highest-commission carrier for each client's health profile.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite (no TypeScript) |
| Styling | Plain CSS via `src/styles/global.css` — no Tailwind, no CSS Modules |
| State | `useState` / prop drilling — no Redux, no Context API |
| Persistence | `localStorage` — key `ffl_agent` (agent profile), `ffl_appointments` (sold appointments) |
| Backend | Supabase *(pending — not yet integrated)* |
| Deployment | Vercel — config in `vercel.json` |
| Fonts | Google Fonts: **Inter** (all UI text) |

---

## App Structure & Screen Flow

```
AgentSetup
  └─► Dashboard
        └─► Step 1 · Lead Type          (mortgage_protection | final_expense | veteran)
            └─► Step 2 · Client Info    (name, age, sex, tobacco, height/weight)
                └─► Step 3 · Conditions (time-based underwriting conditions)
                    └─► Step 4 · Medications (searchable, condition-aware suggestions)
                        └─► Step 5 · Financial Overview
                            └─► Step 6 · Monthly Bills (discretionary income calc)
                                └─► Step 7 · Results    (ranked carrier cards, tier selection)
                                    └─► Application Screen
                                          ├─► [Pre-Approved] ─► Appointment Summary
                                          └─► [Declined]     ─► back to Results (carrier removed)
```

**Key files:**

| File | Role |
|---|---|
| `src/App.jsx` | Root — orchestrates all state, step navigation, screen switching |
| `src/engine/underwritingEngine.js` | Core logic — evaluates conditions, selects products, computes premiums/commissions, sorts results |
| `src/utils/premiumCalculator.js` | Actuarial rate tables — age-interpolated estimates for term and WL |
| `src/data/carriers/underwriting.js` | Single source of truth for all 10 carrier product IDs, tiers, age ranges, knockouts |
| `src/data/compensation.js` | FFL comp grid — commission % by carrier, product, and FFL contract level |
| `src/styles/global.css` | All styles — design tokens, component classes, utilities |
| `src/data/occupations.js` | Searchable occupation list (58 entries) |
| `src/data/conditionMedications.js` | Condition → medication suggestions (26 conditions) |

---

## ═══════════════════════════════════════════════════
## DESIGN STANDARD
## ═══════════════════════════════════════════════════

### Layout
- Fixed left sidebar navigation, 220px wide, full height
- Main content area fills remaining width with 32px padding
- Top header bar 64px tall with page title and agent name
- Content sections use card components with consistent spacing
- Cards have 24px internal padding, 8px border radius
- Maximum content width 1200px, centered in main area

### Colors
- Background: #0d0d0d
- Sidebar background: #111111
- Card background: #161616
- Card border: #2a2a2a
- Secondary card background: #1a1a1a
- Primary accent: #7c3aed (purple)
- Secondary accent: #22d3ee (light blue / teal)
- Primary text: #ffffff
- Secondary text: #888888
- Success green: #4caf84
- Danger red: #e05c5c
- Input background: #1e1e1e
- Input border: #2a2a2a
- Input focus border: #22d3ee

### Typography
- Font family: Inter, system-ui, sans-serif
- Page titles: 24px, weight 600
- Section headers: 16px, weight 600, letter-spacing 0.05em, uppercase
- Body text: 14px, weight 400
- Secondary labels: 12px, weight 400, color #888888
- Stat numbers: 28px, weight 700
- No emoji anywhere in the UI

### Buttons
- Primary: #22d3ee background, #0d0d0d text, 8px radius, 12px 24px padding, weight 600
- Primary hover: box-shadow pulse using #22d3ee at low opacity, 200ms ease
- Secondary: transparent, #2a2a2a border, white text
- Secondary hover: #1e1e1e background
- Destructive: #e05c5c background, white text

### Cards
- Background #161616, border 1px solid #2a2a2a, border-radius 8px, padding 24px
- No box shadows, no glow effects, no generic gradients

### Forms and Inputs
- Background #1e1e1e, border 1px solid #2a2a2a
- Focus border: #22d3ee
- Label above input, 12px uppercase #888888
- Border radius 6px, padding 10px 14px

### Rules
- Plain CSS only — no Tailwind, no component libraries, no inline styles
- No generic gradients
- No emoji icons — use simple geometric shapes or text indicators only
- Consistent 8px spacing grid throughout
- Keep all success green #4caf84 text exactly as is

## ═══════════════════════════════════════════════════
## END DESIGN STANDARD
## ═══════════════════════════════════════════════════

---

## Carrier & Data Architecture

### 10 Supported Carriers

| ID | Name | Lead Types |
|---|---|---|
| `TRANS` | Transamerica | FE, MP |
| `AMER` | Americo | FE, MP |
| `AMAM` | American Amicable | FE, MP, Veteran |
| `MOO` | Mutual of Omaha | FE, MP |
| `FORE` | Foresters Financial | FE, MP |
| `AETNA` | Aetna | FE |
| `ETHOS` | Ethos | FE, MP, Veteran |
| `JH` | John Hancock | MP, Veteran |
| `CORE` | Corebridge Financial | MP, Veteran |
| `PROS` | Prosperity Life | FE |

### Product Classification

`TERM_PRODUCT_IDS` (Set in `premiumCalculator.js`) is the **single source of truth** for whether a product is Term or Whole Life. Adding a product here automatically applies term rate tables and the Term/WL filter toggle on the results page.

### Coverage Recommendation Logic (by Lead Type)

| Lead Type | Recommended Face Amount |
|---|---|
| Mortgage Protection | Mortgage balance entered in Step 5 · Default $250,000 if none |
| Final Expense | Agent-entered desired amount, clamped $5,000–$35,000 · Age-based default if blank |
| Veteran / Term | Monthly income × 120 (= 10 years annual income replacement) |

### Carrier Ranking

Results are sorted **primary: commission rate % descending**, **secondary: estimated 1st-year commission dollars** as tiebreaker.

- This ensures a 39.5% product never outranks a 70%+ product regardless of face amount or premium size.
- `commissionDollar = monthlyPremium.mid × 12 × (commissionPct / 100)`
- Special case: Ethos `TRUSTAGE_TAWL` uses age-based commission — 39.5% ages 18–59 & 81–85, 72.5% ages 60–80.

---

## Form Data Shape

```js
formData = {
  leadType:   'mortgage_protection' | 'final_expense' | 'veteran',

  clientInfo: {
    firstName, lastName, age, sex, tobacco, tobaccoType,
    heightFt, heightIn, weight,
  },

  conditions: {
    "High Blood Pressure": true,
    "Heart Attack": "2yr",   // time-based: '6mo'|'12mo'|'2yr'|'5yr'|'5plus'
    // ...
  },

  medications: [
    { name, conditionHint, severity, flaggedCarriers: [], note, custom }
  ],

  financial: {
    occupation, income,        // income = MONTHLY dollars
    ssi,                       // Social Security / Disability monthly
    feDesiredCoverage,         // FE leads only — desired burial coverage
    bills,
    hasMortgage, mortgageBalance, mortgagePayment, yearsRemaining, homeValue, equity,
    hasInsurance, workInsurance, privateInsurance,
    k401, stocks, savings,
    notes,
  },

  monthlyExpenses: {
    mortgage, car, utilities, cableInternet, cellPhones, gasoline,
    carInsurance, foodGroceries, healthInsurance, lifeInsurance,
    loans, creditCards, extras,
  },
}
```

### Underwriting Engine Output (`rec` object on each approved result)

```js
{
  carrierId, resultKey,         // e.g. 'AMER_HMS125'
  name, amBest,
  product: { id, name, ... },
  productLabel, productCategory,// 'term' | 'WL'
  tier,                         // 'Preferred'|'Standard'|'Graded'|'Modified'|'Guaranteed'
  recommendedFace,
  monthlyPremium: { low, mid, high },
  annualPremium,
  commissionPct, commissionDollar,
  confidence,                   // 'High'|'Medium'|'Low'
  flags, medFlags,
  explanation, keyAdvantages, tobaccoRule,
  waitingPeriod,
}
```

---

## Coding Rules

1. **Always `Read` a file before editing it.** The Write/Edit tools require a prior read in the same session.

2. **Never overwrite carrier data files** (`src/data/carriers/*.js`, `src/data/carriers/underwriting.js`) unless the user explicitly instructs a carrier data change.

3. **Never overwrite `src/data/compensation.js`** unless the user explicitly provides updated FFL comp rates.

4. **All new components must use existing CSS classes** from `global.css`. Do not invent new class names unless adding them to `global.css` simultaneously.

5. **Match the active design standard** — dark navy background, gold accent, Cormorant Garamond / DM Sans typography. No component should introduce a competing color palette.

6. **Income is stored as monthly dollars.** `formData.financial.income` is monthly, not annual. The engine multiplies by 120 for 10-year face recommendations. Step 6 receives `monthlyIncome` directly (no ÷12 needed).

7. **`TERM_PRODUCT_IDS`** in `premiumCalculator.js` is the only place to define whether a product is term or WL. Do not add type logic anywhere else.

8. **Result keys** follow the pattern `carrierId_productId` (e.g. `AMER_HMS125`). This is used for declined carrier tracking (`declinedKeys` Set in App.jsx).

9. **localStorage keys:** `ffl_agent` (agent profile object), `ffl_appointments` (array of sold appointment records).

10. **Step counter** format: "Step N of 7" — there are exactly 7 steps in the appointment flow.

11. **Preserve step eyebrow labels:** Step 4 is "Step 4 of 7", Step 5 is "Step 5 of 7", etc. Update all references when the step count changes.

12. **Do not use TypeScript, Tailwind, or any CSS framework.** All styling is plain CSS in `global.css`.

---

## Deployment

- **Platform:** Vercel (auto-deploy from `main` branch)
- **Build command:** `npm run build` (Vite)
- **Output directory:** `dist`
- **`vercel.json`:** Present in root — do not delete
- **No environment variables** currently required (Supabase pending)

Before deploying: ensure no active `npm run dev` process is running on Windows (kills `esbuild` spawn).
