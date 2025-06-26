# Kasoli‑ku‑Mukutu — Front‑End Style & Setup Cheat‑Sheet

> **Purpose** Hand this file to any new engineer or designer and they’ll have the colour tokens, motion specs, wallet/contract boilerplate, role‑access notes, DB seeding command and mobile UX rules in one place.

---

## 🎨 Colour Palette (ColorHunt scheme)

| Token          | Hex       | Usage                                         |
| -------------- | --------- | --------------------------------------------- |
| **lime‑lush**  | `#D0F66A` | Vibrant highlight, primary CTAs, hover states |
| **aqua‑mint**  | `#36C186` | Success toasts, progress bars                 |
| **teal‑deep**  | `#158A8C` | Secondary buttons, links                      |
| **ocean‑navy** | `#1E5287` | Headers, deep backgrounds                     |
| **warm‑white** | `#FAFAF7` | Default surface (light mode)                  |
| **dusk‑gray**  | `#6C757D` | Disabled text, subtle borders                 |

### Motion

```
motionEase: cubic-bezier(0.22, 0.61, 0.36, 1)  // fast‑out‑slow‑in
spring:     stiffness 380, damping 28          // Framer Motion defaults
```

---

## 🔐 Wallet Connection & Contract Interactions

- **Wagmi v2 + viem** already installed.
- Environment variables (set in `.env.local`):
  ```
  NEXT_PUBLIC_RPC        = https://sepolia.base.org
  NEXT_PUBLIC_ESCROW     = 0xEscrow...
  NEXT_PUBLIC_RECEIPT    = 0xReceipt...
  NEXT_PUBLIC_ORACLE     = 0xOracle...
  NEXT_PUBLIC_USDC       = 0xMockUSDC...
  ```
- ABIs live in `/abis/*`. Use `useContractWrite/read` hooks from `lib/useEscrow.ts`.
- Auto‑payout flow: `farmerSign -> transporterSign -> buyerSign` triggers funds; `forceFinalize` is fallback.

---

## 👥 Role‑Based Access (documented in README)

| Role        | Pages                   | Actions                          |
| ----------- | ----------------------- | -------------------------------- |
| Farmer      | `/farmer`, `/deal/[id]` | List batch, sign at warehouse    |
| Transporter | `/transporter`          | Scan QR, sign pick‑up            |
| Buyer       | `/buyer`                | Commit & pay, sign delivery      |
| Platform    | `/platform`             | Force finalize, resolve disputes |

> Routing guard: `useRole()` compares wallet to Prisma `User.role` field.

---

## 🗄️ Seed Database

```bash
pnpm prisma migrate reset   # drops + recreates schema
pnpm prisma db seed         # runs prisma/seed.ts
```

- `seed.ts` creates mock farmers, transporters, buyers and 3 grain batches with random weights.

---

## 📱 Mobile‑First Theme Rules

- Max card width = **90 %** viewport; gutters 12 px.
- Sticky bottom nav with 4 tabs (Lucide icons).
- Primary CTA: full‑width, 56 px tall, lime‑lush background, rounded‑full.
- Text scalable to 125 % without layout break.

### Minimal Forms

- **List Batch** – 3 fields: *Weight kg*, *Grade* (select), *Photo upload*.
- **Commit & Pay** – auto‑filled freight; buyer only confirms quantity and taps *Pay*.
- **Dispute Modal** (platform) – slider (0‑100 %) + textarea (optional).

---

## 🚀 UI Flow & Transitions (Urus‑style)

> **Goal** Ensure every navigation step feels like the ultra‑slick micro‑interaction patterns used on **urus.org**.

| Flow Step                  | Animation / Transition                                                 | Implementation Hint                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| App launch → Dashboard     | **Fade‑in + upward slide** of first section over 400 ms (`motionEase`) | `<motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} transition={{ease:"cubic-bezier(0.22,0.61,0.36,1)", duration:0.4}} />` |
| Bottom‑tab switch          | **Ink ripple** (lime‑lush) + content cross‑fade                        | Use `FramerMotion` layoutId for tab icon, cross‑fade parent `<AnimatePresence>`                                                          |
| BatchCard tap → DealDetail | Card **zooms & morphs** into header image; rest of page fades in       | Wrap card in `<Link>` with shared `layoutId='batch-<id>'`                                                                                |
| QRSheet pull‑up            | **Modal rises** from bottom with spring (stiffness 380, damping 28)    | `<motion.div drag='y' dragConstraints={{top:0,bottom:600}}>`                                                                             |
| Signature success          | **Confetti** burst + haptic + green toasts slide‑down                  | Use `react-confetti` with 30 particles of lime‑lush & aqua‑mint                                                                          |
| Auto‑payout complete       | Timeline chip flips from gray → green with **flip‑card** 3D rotation   | keyframe rotateY 0→180°, half‑way swap colour                                                                                            |
| Dispute resolution         | Modal shakes horizontally 8 px if % not selected                       | `<motion.div animate={{x:[0,8,-6,4,-2,0]}}>`                                                                                             |

All motion tokens (`duration`, `curve`, `stiffness`, `damping`) reference the **Motion** section above to keep consistency.

---

*Last updated: 26 Jun 2025*

