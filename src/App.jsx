import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList
} from "recharts";

/* ============================================================
   THE MONEY FOUNDATIONS SCORE
   A self diagnosis scorecard for adults of any stage.
   Built on Daniel Priestley's scorecard method (self diagnosis,
   the visible gap, real value even if they never buy) and Alex
   Hormozi's value equation (clear outcome, fast, effortless step).
   ============================================================ */

const C = {
  ink: "#16243B",
  ink2: "#54627A",
  paper: "#F4F1E9",
  card: "#FFFFFF",
  green: "#1F7A5A",
  greenSoft: "#E6F2EC",
  gold: "#C98A1F",
  goldSoft: "#FAF0D9",
  coral: "#D2543E",
  coralSoft: "#FBE5DF",
  blue: "#3E6FA3",
  blueSoft: "#E6EEF6",
  line: "#E8E2D6",
  ink05: "rgba(22,36,59,0.05)",
};

const statusColor = (v) => (v >= 70 ? C.green : v >= 40 ? C.gold : C.coral);
const statusSoft = (v) => (v >= 70 ? C.greenSoft : v >= 40 ? C.goldSoft : C.coralSoft);
const statusLabel = (v) => (v >= 70 ? "Strong" : v >= 40 ? "Building" : "Needs work");

const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";

/* ---------------------------------------------------------------
   QUESTIONS  (some appear only when relevant, via showIf)
   --------------------------------------------------------------- */
const QUESTIONS = [
  {
    id: "age",
    type: "single",
    q: "How old are you?",
    sub: "We tailor the whole thing to your stage of life",
    options: [
      { v: "u20", label: "Under 20" },
      { v: "20_23", label: "20 to 23" },
      { v: "24_27", label: "24 to 27" },
      { v: "28_32", label: "28 to 32" },
      { v: "33_36", label: "33 to 36" },
      { v: "37_40", label: "37 to 40" },
      { v: "41plus", label: "41 or older" },
    ],
  },
  {
    id: "situation",
    type: "single",
    q: "What best describes you right now?",
    options: [
      { v: "student", label: "Still studying" },
      { v: "grad", label: "Recently finished studying" },
      { v: "employed", label: "Employed on a salary" },
      { v: "freelance", label: "Freelance or contract work" },
      { v: "business", label: "I run my own business" },
      { v: "break", label: "Between jobs or on a break" },
    ],
  },
  {
    id: "income",
    type: "single",
    q: "Roughly what do you earn a year, before tax?",
    sub: "A ballpark is plenty. Nothing is stored.",
    options: [
      { v: "u20", label: "Under £20k" },
      { v: "20_35", label: "£20k to £35k" },
      { v: "35_50", label: "£35k to £50k" },
      { v: "50_75", label: "£50k to £75k" },
      { v: "75_100", label: "£75k to £100k" },
      { v: "100plus", label: "£100k or more" },
    ],
  },
  {
    id: "housing",
    type: "single",
    q: "Where do you live?",
    options: [
      { v: "family", label: "With family" },
      { v: "rent", label: "Renting" },
      { v: "mortgage", label: "Own with a mortgage" },
      { v: "outright", label: "Own outright" },
      { v: "btl", label: "Own my home plus another property" },
    ],
  },
  {
    id: "savings",
    type: "single",
    q: "How much do you have in savings?",
    sub: "Cash you could get to fairly quickly",
    options: [
      { v: "u1", label: "Less than £1k" },
      { v: "1_5", label: "£1k to £5k" },
      { v: "5_15", label: "£5k to £15k" },
      { v: "15_50", label: "£15k to £50k" },
      { v: "50plus", label: "£50k or more" },
    ],
  },
  {
    id: "buffer",
    type: "single",
    q: "If your income stopped tomorrow, how long could you cover your costs?",
    sub: "Your emergency buffer",
    options: [
      { v: "none", label: "I could not, really" },
      { v: "u1", label: "Less than a month" },
      { v: "1_3", label: "1 to 3 months" },
      { v: "3_6", label: "3 to 6 months" },
      { v: "6plus", label: "More than 6 months" },
    ],
  },
  {
    id: "student_loan",
    type: "single",
    q: "Do you have a student loan?",
    sub: "We treat this very differently to other debt, and we will explain why",
    options: [
      { v: "no", label: "No" },
      { v: "repaying", label: "Yes, and it comes out of my salary" },
      { v: "notearning", label: "Yes, but I do not earn enough to repay yet" },
      { v: "unsure", label: "Yes, but I am not sure how mine works" },
    ],
  },
  {
    id: "debt",
    type: "single",
    q: "Aside from a mortgage or student loan, how would you describe your debts?",
    sub: "Think credit cards, overdrafts, car finance, personal loans",
    options: [
      { v: "none", label: "None to speak of" },
      { v: "clear", label: "I use a card but clear it every month" },
      { v: "balance", label: "Carrying a card or overdraft balance" },
      { v: "bnpl", label: "I lean on buy now pay later fairly often" },
      { v: "struggle", label: "Struggling to keep up with payments" },
    ],
  },
  {
    id: "pension",
    type: "single",
    q: "How are you set up for a pension?",
    options: [
      { v: "none", label: "Not paying into one" },
      { v: "auto", label: "Workplace pension on the default" },
      { v: "auto_extra", label: "Workplace pension plus extra" },
      { v: "self", label: "My own pension that I manage" },
      { v: "db", label: "A final salary or defined benefit scheme" },
      { v: "unsure", label: "Not sure what I have" },
    ],
  },
  {
    id: "isa",
    type: "single",
    q: "Do you use an ISA?",
    sub: "An ISA shelters your savings or investment growth from tax",
    options: [
      { v: "sands", label: "Yes, a stocks and shares ISA" },
      { v: "cash", label: "Yes, a cash ISA" },
      { v: "both", label: "Yes, both kinds" },
      { v: "have_unsure", label: "I have one but I am not sure which" },
      { v: "no_know", label: "No, but I know what an ISA is" },
      { v: "no_unknown", label: "No, and I am not really sure what an ISA is" },
    ],
  },
  {
    id: "invested",
    type: "single",
    q: "Outside of any pension, how much do you have invested?",
    sub: "Stocks, funds, a stocks and shares ISA, anything growing that is not a pension",
    options: [
      { v: "none", label: "Nothing yet" },
      { v: "u10", label: "Under £10k" },
      { v: "10_50", label: "£10k to £50k" },
      { v: "50_150", label: "£50k to £150k" },
      { v: "150plus", label: "£150k or more" },
      { v: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "invest_types",
    type: "multi",
    q: "What are you actually invested in?",
    sub: "Pick any that apply. This helps us spot any blind spots.",
    showIf: (a) => a.invested && !["none", "unsure"].includes(a.invested),
    options: [
      { v: "funds", label: "Funds or ETFs" },
      { v: "shares", label: "Individual company shares" },
      { v: "crypto", label: "Crypto" },
      { v: "property", label: "Property other than my home" },
      { v: "bonds", label: "Bonds or fixed income" },
      { v: "pension_only", label: "Just my pension, I think" },
      { v: "unsure", label: "Not sure what it is in" },
    ],
  },
  {
    id: "know_position",
    type: "single",
    q: "How clear is your picture of what you own, owe and are worth?",
    sub: "Most people are less sure than they would like to be",
    options: [
      { v: "clear", label: "Very clear, I know my numbers" },
      { v: "rough", label: "A general sense, but not exact" },
      { v: "notreally", label: "Not very clear at the moment" },
    ],
  },
  {
    id: "values",
    type: "single",
    q: "Any values you want your money to follow?",
    sub: "Optional, but it helps us point you the right way",
    options: [
      { v: "none", label: "No particular preference" },
      { v: "ethical", label: "Ethical or sustainable investing" },
      { v: "faith", label: "Faith based, such as Islamic finance" },
      { v: "unsure", label: "I would like to understand the options" },
    ],
  },
  {
    id: "islamic_setup",
    type: "single",
    q: "When it comes to keeping your money Sharia compliant, where are you?",
    sub: "There is no wrong answer here. Most people are less sorted than they assume.",
    showIf: (a) => a.values === "faith",
    options: [
      { v: "all", label: "I have deliberately set mine up to be compliant" },
      { v: "want_howto", label: "I care about it but am not sure how to make it happen" },
      { v: "didnt_know", label: "I care, but did not realise good compliant options existed" },
      { v: "never_checked", label: "I have honestly never checked whether mine are" },
    ],
  },
  {
    id: "protection",
    type: "multi",
    q: "Which of these do you already have?",
    sub: "Pick any that apply, or none",
    options: [
      { v: "life", label: "Life insurance" },
      { v: "income", label: "Income protection" },
      { v: "critical", label: "Critical illness cover" },
      { v: "will", label: "A written will" },
      { v: "none", label: "None of these yet" },
    ],
  },
  {
    id: "confidence",
    type: "scale10",
    q: "How confident do you feel about money?",
    sub: "1 is a bit lost, 10 is completely on top of it",
  },
  {
    id: "stress",
    type: "single",
    q: 'Be honest. How true is this? "Money is a regular source of stress for me."',
    options: [
      { v: "no", label: "Not true at all" },
      { v: "rarely", label: "Rarely" },
      { v: "sometimes", label: "Sometimes" },
      { v: "often", label: "Often" },
      { v: "always", label: "Pretty much always" },
    ],
  },
  {
    id: "events",
    type: "multi",
    q: "In the next few years, are any of these on your mind?",
    sub: "Pick any that fit. If nothing does, that is completely normal.",
    options: [
      { v: "home", label: "Buying a first home" },
      { v: "move", label: "Moving or upsizing" },
      { v: "wedding", label: "A wedding" },
      { v: "family", label: "Starting or growing a family" },
      { v: "career_change", label: "Changing career or going freelance" },
      { v: "payrise", label: "A pay rise I want to make the most of" },
      { v: "redundancy", label: "Redundancy or job uncertainty" },
      { v: "windfall", label: "Coming into money (inheritance, gift, payout)" },
      { v: "support_family", label: "Supporting family financially" },
      { v: "clear_debt", label: "Clearing my debts" },
      { v: "retire_early", label: "Stopping work earlier than usual" },
      { v: "none", label: "Nothing in particular right now" },
    ],
  },
  {
    id: "want",
    type: "single",
    q: "If I could wave a wand, which of these would you genuinely pick?",
    sub: "There is a real trade off in each. Pick the one you would actually choose.",
    options: [
      { v: "learn", label: "Teach me to do it myself", desc: "Free, and it builds a skill that pays off for life. It does take a little effort." },
      { v: "guide", label: "Give me a coach or mentor I trust", desc: "Someone in my corner to guide me and keep me moving, while I stay in control." },
      { v: "manage", label: "Pay a professional to manage the lot for me", desc: "Hands off. I would rather pay an expert to run it than do it myself." },
      { v: "track", label: "Just give me a clear view to stay on top", desc: "A simple way to see everything in one place, without going deep." },
      { v: "advice", label: "Get expert advice on one specific decision", desc: "I have a particular question I want a professional opinion on." },
    ],
  },
];

function activeQuestions(a) {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
}

/* ---------------------------------------------------------------
   SCORING
   --------------------------------------------------------------- */
function scorePillars(a) {
  const bufferMap = { none: 0, u1: 15, "1_3": 45, "3_6": 82, "6plus": 100 };
  const savingsMap = { u1: 12, "1_5": 38, "5_15": 62, "15_50": 85, "50plus": 100 };
  const investedMap = { none: 8, u10: 38, "10_50": 64, "50_150": 85, "150plus": 100, unsure: 34 };
  const housingStab = { family: 55, rent: 45, mortgage: 75, outright: 100, btl: 100 };
  const propMap = { family: 25, rent: 25, mortgage: 68, outright: 100, btl: 100 };
  const pensionMap = { none: 10, auto: 58, auto_extra: 88, self: 82, db: 95, unsure: 30 };
  const debtMap = { none: 100, clear: 92, balance: 48, bnpl: 34, struggle: 6 };
  const stressInv = { no: 100, rarely: 80, sometimes: 55, often: 28, always: 8 };
  const positionMap = { clear: 100, rough: 60, notreally: 15 };
  const isaKnow = { both: 100, sands: 100, cash: 80, have_unsure: 55, no_know: 65, no_unknown: 20 };
  const isaInvest = { both: 100, sands: 100, cash: 50, have_unsure: 50, no_know: 30, no_unknown: 10 };

  const prot = a.protection || [];
  const protCount = ["life", "income", "critical", "will"].filter((x) => prot.includes(x)).length;
  const protScore = (protCount / 4) * 100;
  const buffer = bufferMap[a.buffer] ?? 0;
  const savings = savingsMap[a.savings] ?? 0;
  const invested = investedMap[a.invested] ?? 8;

  let safety = 0.62 * buffer + 0.18 * protScore + 0.1 * (housingStab[a.housing] ?? 45) + 0.1 * savings;
  let debt = debtMap[a.debt] ?? 60;
  let invest = 0.5 * invested + 0.22 * savings + 0.18 * (propMap[a.housing] ?? 25) + 0.1 * (isaInvest[a.isa] ?? 30);
  let future = 0.78 * (pensionMap[a.pension] ?? 30) + 0.22 * invested;
  if (["u20", "20_23", "24_27"].includes(a.age) && future < 45) future += 8;

  const conf = (((a.confidence || 5) - 1) / 9) * 100;
  let confidence =
    0.42 * conf +
    0.3 * (positionMap[a.know_position] ?? 55) +
    0.16 * (isaKnow[a.isa] ?? 55) +
    0.12 * (stressInv[a.stress] ?? 55);
  if (a.student_loan === "unsure") confidence -= 4;

  const clamp = (x) => Math.max(2, Math.min(100, Math.round(x)));
  return {
    safety: clamp(safety),
    debt: clamp(debt),
    invest: clamp(invest),
    future: clamp(future),
    confidence: clamp(confidence),
  };
}

function overallScore(p) {
  const w = { safety: 0.24, debt: 0.2, invest: 0.19, future: 0.2, confidence: 0.17 };
  return Math.round(p.safety * w.safety + p.debt * w.debt + p.invest * w.invest + p.future * w.future + p.confidence * w.confidence);
}

function potentialScore(overall, p) {
  const vals = [p.safety, p.debt, p.invest, p.future, p.confidence];
  const red = vals.filter((v) => v < 40).length;
  const amber = vals.filter((v) => v >= 40 && v < 70).length;
  return Math.min(95, Math.max(overall + 8, overall + red * 9 + amber * 4 + 6));
}

function gradeFor(overall) {
  if (overall >= 80) return { word: "Strong foundations", note: "You are in good shape. Now it is about optimising rather than fixing." };
  if (overall >= 65) return { word: "Solid and building", note: "A good base, with a few clear wins still on the table." };
  if (overall >= 45) return { word: "Foundations forming", note: "The bones are there. A handful of moves would change a lot." };
  if (overall >= 25) return { word: "Early days", note: "Plenty to build, and you are in exactly the right place to start." };
  return { word: "Right at the start", note: "Everyone begins here. The next few steps matter the most." };
}

/* ---------------------------------------------------------------
   ROUTING
   --------------------------------------------------------------- */
function computeFlags(a, p) {
  const events = a.events || [];
  const crisis =
    a.debt === "struggle" ||
    ((a.stress === "often" || a.stress === "always") && (a.debt === "balance" || a.debt === "bnpl" || a.debt === "struggle"));
  const wealthy =
    ["75_100", "100plus"].includes(a.income) || ["50_150", "150plus"].includes(a.invested) || a.savings === "50plus";
  const regulated =
    events.includes("windfall") ||
    events.includes("redundancy") ||
    events.includes("retire_early") ||
    a.pension === "db" ||
    a.housing === "btl" ||
    a.situation === "business" ||
    a.invested === "150plus";
  const earlyJourney =
    ["u20", "20_23", "24_27"].includes(a.age) || ["student", "grad"].includes(a.situation) || a.want === "learn";
  return { crisis, wealthy, regulated, earlyJourney, events };
}

function computeRoute(a, p, f) {
  if (f.crisis) return "SUPPORT";
  if (a.want === "advice") return "ADVISER";
  if (f.regulated) return "ADVISER";
  if (a.want === "manage") return f.wealthy ? "ADVISER" : "COACH";

  const vals = [p.safety, p.debt, p.invest, p.future, p.confidence];
  const minPillar = Math.min(...vals);
  const overall = overallScore(p);
  if (overall >= 82 && minPillar >= 68 && a.want !== "learn") return "SORTED";

  if (a.want === "guide") return "COACH";
  if (a.want === "track") return f.wealthy ? "TRACK" : "LEARN";
  return "LEARN";
}

/* ---------------------------------------------------------------
   REFLECTION  (relatable opening, persona thinking under the hood)
   --------------------------------------------------------------- */
function reflection(a, p, route, f, name) {
  const weakKey = PILLAR_META.reduce((lo, m) => (p[m.key] < p[lo.key] ? m : lo), PILLAR_META[0]);
  const weak = weakKey.label.toLowerCase();
  const lead = name ? name + ", " : "";
  let base;
  switch (route) {
    case "SUPPORT":
      base = `${lead}right now the priority is breathing room, not products or lessons. Once the pressure eases, everything else gets far easier, and there is free, expert help built for exactly this moment.`;
      break;
    case "ADVISER":
      base = `${lead}there is a decision in here worth getting right the first time. Around it, your everyday foundations look reasonable, with ${weak} the part most worth tightening alongside.`;
      break;
    case "TRACK":
      base = `${lead}you have built real momentum. What you are short on is time, not money, and a clear single view plus the odd nudge is most of what is missing. Keep half an eye on ${weak}, the one area lagging the rest.`;
      break;
    case "COACH":
      base = `${lead}you roughly know what to do, you just want someone you trust in your corner to keep it moving. With a bit of structure, ${weak} is the area that would shift fastest.`;
      break;
    case "SORTED":
      base = `${lead}honestly, you are ahead of most people. From here it is about keeping it that way and making sure nothing quietly drifts.`;
      break;
    default:
      base = `${lead}you are early enough in the journey that learning the why pays off for decades, and you have told us that is exactly what you want. Your foundations are still forming, and the biggest single gain right now sits in ${weak}.`;
  }
  if (a.values === "faith" && a.islamic_setup && a.islamic_setup !== "all" && route !== "SUPPORT") {
    base += " One thing worth checking: most workplace pension defaults are not Sharia compliant, so it is worth confirming yours.";
  }
  return base;
}

/* ---------------------------------------------------------------
   ROUTE CONTENT (educational)
   --------------------------------------------------------------- */
const ROUTES = {
  LEARN: {
    chip: "Learn and build",
    headline: "Build it yourself, with a guide in your pocket",
    body:
      "You are at the stage where understanding the why pays off for decades. The smartest move is to see your whole picture in one place and learn as you go, rather than handing it over before you know the basics.",
    teach:
      "Learning the foundations once tends to remove money worry for good. People who understand their own finances do better mostly because they make fewer expensive mistakes, not because they are cleverer.",
    product: "the Net Worth Tool and Learning hub",
    productLine:
      "See your full net worth, watch it grow, and unlock short lessons that turn each gap into a quick win. Free to start and built for exactly where you are.",
    cta: "Start the Net Worth Tool",
    secondary: "Browse the learning hub",
  },
  TRACK: {
    chip: "Track and optimise",
    headline: "You do not need lessons. You need a clear view and a steer.",
    body:
      "You have built something. What you are short on is time, not money. The job now is a simple, single view of everything, plus the occasional expert nudge so nothing slips and nothing sits idle.",
    teach:
      "At your level the risk is not making a wrong move, it is making no move and letting good money sit duplicated or idle. A clear view is what catches that, and small percentages on larger sums add up fast.",
    product: "the Tracker plus light guidance",
    productLine:
      "A clean dashboard of everything you own and owe, with quarterly prompts on the few moves that matter. Set up once, glance monthly, done.",
    cta: "Set up the Tracker",
    secondary: "Book a guidance call",
  },
  COACH: {
    chip: "Coaching",
    headline: "You know roughly what to do. You want a hand actually doing it.",
    body:
      "The gap here is not information, it is momentum and accountability. A few focused sessions turn good intentions into a plan with real dates against it.",
    teach:
      "Information is everywhere and free. The rare thing is doing it consistently, month after month. That follow through is what a coach actually gives you, and it is usually the missing ingredient rather than knowledge.",
    product: "a money coach",
    productLine:
      "Work one to one with a coach who builds your plan with you, keeps you honest, and uses a live money simulator so you can see the impact of a decision before you make it.",
    cta: "Meet the coaches",
    secondary: "See how coaching works",
  },
  ADVISER: {
    chip: "Speak to a professional",
    headline: "There is a decision here worth getting right the first time",
    body:
      "Something in your answers points to a regulated decision: a sizeable sum, a pension question, a business, or a life event with real money attached. This is precisely what a qualified, independent adviser exists for, and not something to guess at.",
    teach:
      "A good independent adviser is paid to act in your interest. Ask three things before you commit: how are you paid, are you genuinely independent or restricted, and what is the all in cost in pounds, not just percentages. You can and should walk in informed.",
    product: "an independent financial adviser",
    productLine:
      "We can point you to a vetted, regulated, independent adviser for the specific decision, and give you the questions to ask so you arrive informed rather than sold to.",
    cta: "Get matched to an adviser",
    secondary: "What to ask an adviser",
  },
  SUPPORT: {
    chip: "Support first",
    headline: "Let us take the pressure off before anything else",
    body:
      "From your answers, the priority right now is breathing room, not products or lessons. Free, confidential, expert help exists for exactly this, and using it is a smart, normal move that thousands make every week.",
    teach:
      "Using free debt help does not harm your credit any more than the situation already is, and it can stop things getting worse. These charities do not judge and do not sell you anything. They can even pause pressure and speak to lenders for you.",
    product: "free debt support",
    productLine:
      "Charities like StepChange and National Debtline give free, judgement free help. They can pause pressure, deal with lenders, and build a plan around what you can actually afford.",
    cta: "See free support options",
    secondary: "Read the first steps",
  },
  SORTED: {
    chip: "Already sorted",
    headline: "Honestly? You are doing better than most.",
    body:
      "Your foundations are strong across the board. You do not need rescuing or teaching. What helps people like you is a single clear view to keep it that way, and an occasional check that nothing is quietly drifting.",
    teach:
      "The main risk in your position is complacency, and fees you have simply stopped noticing. A yearly once over catches both, and on larger balances even a small fee saving compounds into a meaningful sum.",
    product: "the Tracker for a yearly check",
    productLine:
      "Pull everything into one place, set a yearly review, and spend ten minutes confirming you are still on track. That is all it takes from here.",
    cta: "Set up your Tracker",
    secondary: "Run a yearly check",
  },
};

/* ---------------------------------------------------------------
   MICRO LESSONS
   --------------------------------------------------------------- */
const LESSONS = {
  emergency_fund: {
    title: "Why a buffer beats almost everything",
    body:
      "Before investing or overpaying anything, aim for three to six months of essential costs in easy access savings. It is what stops a surprise bill turning into expensive debt. Keep it separate from your everyday account, in the best paying easy access or cash ISA you can find.",
  },
  employer_match: {
    title: "The free money most people leave behind",
    body:
      "If you are employed, your workplace pension often comes with employer matching. Many pay the minimum and miss the rest. Contributing enough to capture the full match is one of the only places you get an instant return on your money, before any growth.",
  },
  expensive_debt: {
    title: "Clear the costly stuff first",
    body:
      "Debt above roughly ten percent interest, which is most credit cards and overdrafts, costs more than investments are likely to make. Pay minimums on everything, then throw all spare money at the highest rate first. Rarely exciting, usually the highest return move you can make.",
  },
  bnpl_trap: {
    title: "The quiet cost of buy now pay later",
    body:
      "Spreading payments feels free, but it hides how much you are really spending and stacks up across several purchases at once. Add the commitments together and most people are surprised. Pausing it for a month and seeing the true number is often the eye opener.",
  },
  student_loan_different: {
    title: "Your student loan is not like other debt",
    body:
      "In the UK a student loan behaves more like a graduate tax than a normal debt. You repay a small slice of income only above a threshold, the balance is written off after a set period whether or not it is cleared, and it does not show on your credit file the way a card does. For most people, overpaying it voluntarily is not the priority. Clearing expensive card debt and building a pension usually wins.",
  },
  cash_drag: {
    title: "Why cash quietly shrinks",
    body:
      "Money sitting in cash beyond your buffer slowly loses spending power to inflation every year. Over a decade that is a lot of forgone growth. Once your emergency fund is set, money you will not need for five years or more usually belongs somewhere it can grow, like a stocks and shares ISA.",
  },
  compound_early: {
    title: "Starting early does the heavy lifting",
    body:
      "Because returns compound, money invested in your twenties can end up worth far more than the same amount added in your forties. Time in the market matters more than the amount. Even small, regular contributions started now tend to beat larger ones started later.",
  },
  isa_explainer: {
    title: "What an ISA actually is",
    body:
      "An ISA is a wrapper that shelters your money from tax, with a generous yearly allowance. A cash ISA protects savings interest. A stocks and shares ISA protects investment growth and is usually the better home for money you will not touch for years. You pick the wrapper first, then what goes inside it.",
  },
  diversification: {
    title: "Do not put it all in one basket",
    body:
      "Holding a single stock or sitting entirely in crypto means one bad run can wipe out years of progress. Spreading across many companies and assets, which a broad fund or ETF does for you in one go, smooths the ride without giving up long term growth. Concentration is how fortunes are made and far more often lost.",
  },
  islamic_pension: {
    title: "Your pension and your faith",
    body:
      "Most workplace pension defaults invest in interest based and other non compliant sectors. The good news is that nearly every large provider now offers a Sharia compliant fund option you can switch into, often at no extra cost, and Sharia compliant ISAs and investments are widely available. Your values and sensible long term growth are not in conflict.",
  },
  budgeting_system: {
    title: "You cannot improve what you cannot see",
    body:
      "A simple system that shows what comes in, what goes out and what you are worth changes behaviour on its own. The aim is not penny pinching, it is a clear view so decisions get easier. Five minutes a week beats a perfect spreadsheet you never open.",
  },
  protection_basics: {
    title: "Protect the income, not just the things",
    body:
      "If people depend on you, the question is what happens to them if your income stops through illness or worse. Life cover and income protection are cheaper than most expect while you are young and healthy. This sits under everything else once the basics are in place.",
  },
  will_basics: {
    title: "A will is for the living",
    body:
      "Without one, the law decides who gets what, which often is not what you would choose, and it can leave loved ones with delays and stress at the worst possible time. A straightforward will is quick and inexpensive, and worth revisiting after big life events.",
  },
  confidence_foundations: {
    title: "Confidence comes from understanding, not income",
    body:
      "Plenty of high earners feel lost, and plenty of modest earners feel calm and in control. The difference is grasping a few core ideas and having a simple system. Learn the foundations once and the worry tends to fade for good.",
  },
};

/* ---------------------------------------------------------------
   ACTION PLAN  (priority first, protection and will lower down)
   --------------------------------------------------------------- */
function buildActions(a, p, f) {
  const priority = [];
  const later = [];
  const e = a.events || [];
  const prot = a.protection || [];
  const itypes = a.invest_types || [];
  const has = (k) => prot.includes(k);

  if (f.crisis) {
    priority.push({
      title: "Get free support in place this week",
      why: "When payments are a struggle, breathing room comes first. Everything else can wait.",
      how: "Contact StepChange or National Debtline. It is free and confidential, and they can deal with lenders on your behalf.",
      lesson: null,
    });
  }
  if (a.buffer === "none" || a.buffer === "u1" || p.safety < 40) {
    priority.push({
      title: "Build a starter safety net",
      why: "A buffer is the single thing that stops a surprise turning into a setback or expensive debt.",
      how: "Open a separate easy access savings account and set a standing order, even a small one, for the day after payday. Aim first for one month of costs, then three.",
      lesson: "emergency_fund",
    });
  }
  if (a.debt === "balance" || a.debt === "bnpl") {
    priority.push({
      title: "Clear the expensive debt first",
      why: "Card and overdraft interest usually costs more than any investment will earn, so clearing it is a guaranteed return.",
      how: "List debts by interest rate, pay minimums on all, and throw everything spare at the most expensive one until it is gone.",
      lesson: a.debt === "bnpl" ? "bnpl_trap" : "expensive_debt",
    });
  }
  if ((a.pension === "none" || a.pension === "unsure") && a.situation === "employed") {
    priority.push({
      title: "Grab your full employer pension match",
      why: "Matching is free money and an instant return you cannot get anywhere else.",
      how: "Ask HR or check your pension portal for the maximum your employer will match, then raise your contribution to meet it.",
      lesson: "employer_match",
    });
  }
  if ((a.pension === "none" || a.pension === "unsure") && (a.situation === "freelance" || a.situation === "business")) {
    priority.push({
      title: "Start your own pension",
      why: "With no employer scheme, nobody sets this up for you, and the tax relief is generous.",
      how: "Open a personal pension or SIPP with a low cost provider and set a regular contribution you can sustain.",
      lesson: "compound_early",
    });
  }
  if (a.values === "faith" && a.islamic_setup && a.islamic_setup !== "all") {
    priority.push({
      title: "Make your pension and investing Sharia compliant",
      why: "Most workplace defaults are not compliant, and switching is usually free and quick.",
      how: "Ask your pension provider for their Sharia compliant fund option and switch into it, and choose compliant funds for any ISA.",
      lesson: "islamic_pension",
    });
  }
  if ((a.savings === "15_50" || a.savings === "50plus") && a.invested === "none") {
    priority.push({
      title: "Stop your spare cash quietly shrinking",
      why: "Cash beyond your buffer loses value to inflation every year it sits still.",
      how: "Keep your emergency fund in cash, then move longer term money into a stocks and shares ISA so it can grow.",
      lesson: "cash_drag",
    });
  }
  if (a.invested === "none" && p.safety >= 40 && !(a.savings === "15_50" || a.savings === "50plus")) {
    priority.push({
      title: "Put your first money to work",
      why: "With a buffer in place, the next pound is better off growing than waiting.",
      how: "Start small and regular in a stocks and shares ISA with a broad, low cost fund. Consistency beats timing.",
      lesson: "isa_explainer",
    });
  }
  if (a.invested !== "none" && a.invested !== "unsure" && ((itypes.includes("crypto") && !itypes.includes("funds")) || (itypes.includes("shares") && !itypes.includes("funds")))) {
    priority.push({
      title: "Spread your investments wider",
      why: "Sitting in a single stock or only in crypto means one bad run can undo years of progress.",
      how: "Add a broad, low cost global fund or ETF as your core holding, and keep concentrated bets small.",
      lesson: "diversification",
    });
  }
  if (a.know_position === "notreally" || a.know_position === "rough") {
    priority.push({
      title: "See your whole picture in one place",
      why: "A clear view of what you own, owe and are worth changes behaviour before you even try.",
      how: "Pull your accounts, savings, debts and pensions into one simple tracker and check it for five minutes a week.",
      lesson: "budgeting_system",
    });
  }
  if ((a.confidence || 5) <= 4) {
    priority.push({
      title: "Learn the foundations once",
      why: "Confidence comes from understanding a few core ideas, not from earning more.",
      how: "Work through short lessons on budgeting, debt, saving and investing in order. It compounds faster than you think.",
      lesson: "confidence_foundations",
    });
  }

  // Lower priority: protection and the will, by request
  if (prot.includes("none") && (e.includes("family") || a.housing === "mortgage" || a.housing === "btl")) {
    later.push({
      title: "Cover the people who rely on you",
      why: "If others depend on your income, protection is the foundation under the foundation.",
      how: "Get quotes for life cover and income protection. While young and healthy it is usually cheaper than expected.",
      lesson: "protection_basics",
    });
  }
  if (!has("will") && (a.invested !== "none" || e.includes("family") || (a.housing !== "rent" && a.housing !== "family"))) {
    later.push({
      title: "Write a will",
      why: "Without one, the law decides, and it rarely matches what you would choose.",
      how: "A simple will is quick and inexpensive. Use a solicitor or a reputable will service and revisit it after big life events.",
      lesson: "will_basics",
    });
  }

  if (priority.length < 3) {
    priority.push({
      title: "Nudge your pension up by one percent",
      why: "Small increases now, while you barely notice them, become large sums later.",
      how: "Raise your contribution by one percent and repeat it each time your pay goes up.",
      lesson: "compound_early",
    });
    later.push({
      title: "Book a yearly money review",
      why: "Strong foundations stay strong when you check them on purpose, not by accident.",
      how: "Put a recurring date in the diary to review savings, investments, pension and protection in one sitting.",
      lesson: "budgeting_system",
    });
  }
  return { priority: priority.slice(0, 5), later: later.slice(0, 3) };
}

/* ---------------------------------------------------------------
   INSIGHTS  (short educational notes from their answers)
   --------------------------------------------------------------- */
function buildInsights(a) {
  const out = [];
  if (["repaying", "notearning", "unsure"].includes(a.student_loan)) out.push("student_loan_different");
  if (a.isa === "no_unknown" || a.isa === "have_unsure") out.push("isa_explainer");
  const itypes = a.invest_types || [];
  if ((itypes.includes("crypto") || itypes.includes("shares")) && !itypes.includes("funds")) out.push("diversification");
  if (a.values === "faith" && a.islamic_setup !== "all") out.push("islamic_pension");
  return out.slice(0, 3);
}

/* ---------------------------------------------------------------
   RESOURCES
   --------------------------------------------------------------- */
const RESOURCES = [
  { name: "MoneyHelper", desc: "Free, government backed money guidance on almost everything", url: "moneyhelper.org.uk" },
  { name: "StepChange", desc: "Free, confidential debt advice and managed plans", url: "stepchange.org" },
  { name: "National Debtline", desc: "Free debt help by phone and online", url: "nationaldebtline.org" },
  { name: "Citizens Advice", desc: "Free local help with money, benefits and bills", url: "citizensadvice.org.uk" },
  { name: "Pension Wise", desc: "Free government guidance on your pension options", url: "moneyhelper.org.uk/pensionwise" },
  { name: "State Pension forecast", desc: "Check your future state pension on gov.uk", url: "gov.uk/check-state-pension" },
  { name: "Unbiased and VouchedFor", desc: "Find a vetted, regulated independent adviser", url: "unbiased.co.uk" },
];

function resourcesFor(route) {
  if (route === "SUPPORT") return RESOURCES.filter((r) => ["StepChange", "National Debtline", "Citizens Advice", "MoneyHelper"].includes(r.name));
  if (route === "ADVISER") return RESOURCES.filter((r) => ["Unbiased and VouchedFor", "Pension Wise", "State Pension forecast", "MoneyHelper"].includes(r.name));
  return RESOURCES.filter((r) => ["MoneyHelper", "State Pension forecast", "Pension Wise", "Citizens Advice"].includes(r.name));
}

/* ===============================================================
   UI HELPERS
   =============================================================== */
const PILLAR_META = [
  { key: "safety", label: "Safety net", blurb: "Your buffer and protection" },
  { key: "debt", label: "Debt health", blurb: "How much debt costs you" },
  { key: "invest", label: "Saving and investing", blurb: "Money put to work" },
  { key: "future", label: "Future and pension", blurb: "Your long game" },
  { key: "confidence", label: "Confidence and control", blurb: "How on top of it you feel" },
];

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const h = () => setR(m.matches);
    m.addEventListener && m.addEventListener("change", h);
    return () => m.removeEventListener && m.removeEventListener("change", h);
  }, []);
  return r;
}

function CountUp({ target, duration = 1100, reduce }) {
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setN(target); return; }
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return <>{n}</>;
}

function ScoreRing({ value, reduce }) {
  const size = 230, stroke = 18;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const col = statusColor(value);
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    let raf;
    const start = performance.now();
    const dur = 1200;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(eased * value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  const off = circ - (shown / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.ink05} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 64, fontWeight: 600, color: C.ink, lineHeight: 1 }}>
          <CountUp target={value} reduce={reduce} />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink2, letterSpacing: 1, marginTop: 4 }}>OUT OF 100</div>
      </div>
    </div>
  );
}

/* ===============================================================
   MAIN
   =============================================================== */
export default function App() {
  const [stage, setStage] = useState("welcome");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [firstName, setFirstName] = useState("");
  const [openLesson, setOpenLesson] = useState(null);
  const [showMethod, setShowMethod] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); } catch (e) {}
  }, [stage, step, reduce]);

  const results = useMemo(() => {
    if (stage !== "results") return null;
    const pillars = scorePillars(answers);
    const overall = overallScore(pillars);
    const potential = potentialScore(overall, pillars);
    const flags = computeFlags(answers, pillars);
    const route = computeRoute(answers, pillars, flags);
    const plan = buildActions(answers, pillars, flags);
    const insights = buildInsights(answers);
    return { pillars, overall, potential, flags, route, plan, insights };
  }, [stage, answers]);

  const active = activeQuestions(answers);
  const safeStep = Math.min(step, active.length - 1);
  const q = active[safeStep];
  const total = active.length;
  const answeredCurrent = (() => {
    if (!q) return false;
    const v = answers[q.id];
    if (q.type === "multi") return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== null;
  })();

  function advanceFrom(id, nextAns) {
    const list = activeQuestions(nextAns);
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0 && idx < list.length - 1) setStep(idx + 1);
    else setStage("results");
  }

  function setSingle(id, v) {
    const nextAns = { ...answers, [id]: v };
    setAnswers(nextAns);
    setTimeout(() => advanceFrom(id, nextAns), reduce ? 0 : 170);
  }

  function setScale(id, v) {
    const nextAns = { ...answers, [id]: v };
    setAnswers(nextAns);
    setTimeout(() => advanceFrom(id, nextAns), reduce ? 0 : 220);
  }

  function toggleMulti(id, v) {
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? a[id] : [];
      let next;
      if (v === "none") next = cur.includes("none") ? [] : ["none"];
      else next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== "none"), v];
      return { ...a, [id]: next };
    });
  }

  function nextMulti() {
    advanceFrom(q.id, answers);
  }

  function back() {
    if (safeStep === 0) setStage("welcome");
    else setStep(safeStep - 1);
  }

  const wrap = {
    fontFamily: FONT_BODY, color: C.ink, background: C.paper,
    minHeight: "100vh", WebkitFontSmoothing: "antialiased",
  };

  return (
    <div className="mf-app" style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${C.paper}; }
        @media print {
          @page { margin: 12mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .mf-noprint { display: none !important; }
          .mf-reveal { animation: none !important; opacity: 1 !important; transform: none !important; }
          .mf-app { background: #ffffff !important; min-height: auto !important; }
          .mf-report { background: #ffffff !important; padding: 0 !important; }
          .mf-block { break-inside: avoid; page-break-inside: avoid; }
        }
        .mf-opt { transition: transform .12s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease; }
        .mf-opt:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(22,36,59,0.08); }
        .mf-opt:focus-visible { outline: 3px solid ${C.gold}; outline-offset: 2px; }
        .mf-btn { transition: transform .12s ease, box-shadow .15s ease, opacity .15s ease; cursor: pointer; }
        .mf-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(22,36,59,0.16); }
        .mf-btn:focus-visible { outline: 3px solid ${C.gold}; outline-offset: 2px; }
        .mf-card { transition: transform .15s ease, box-shadow .2s ease; }
        .mf-reveal { animation: mfUp .55s ease both; }
        @keyframes mfUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .mf-opt, .mf-btn, .mf-card, .mf-reveal { animation: none !important; transition: none !important; } }
        .mf-input:focus { outline: none; border-color: ${C.green}; box-shadow: 0 0 0 3px ${C.greenSoft}; }
        a { color: ${C.green}; }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 18px 64px" }}>
        {stage === "welcome" && <Welcome onStart={() => { setStage("quiz"); setStep(0); }} />}
        {stage === "quiz" && q && (
          <Quiz
            q={q} step={safeStep} total={total} answers={answers}
            answeredCurrent={answeredCurrent}
            setSingle={setSingle} setScale={setScale} toggleMulti={toggleMulti}
            onBack={back} onNext={nextMulti}
          />
        )}
        {stage === "results" && results && (
          <Results
            r={results} answers={answers} firstName={firstName} reduce={reduce}
            openLesson={openLesson} setOpenLesson={setOpenLesson}
            showMethod={showMethod} setShowMethod={setShowMethod}
            onRestart={() => { setAnswers({}); setStep(0); setFirstName(""); setStage("welcome"); }}
          />
        )}
      </div>
    </div>
  );
}

/* ===============================================================
   WELCOME
   =============================================================== */
function Welcome({ onStart }) {
  return (
    <div className="mf-reveal" style={{ paddingTop: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontFamily: FONT_DISPLAY }}>L</div>
        <span style={{ fontWeight: 600, letterSpacing: 0.3 }}>LifeSmart</span>
      </div>
      <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 100, background: C.goldSoft, color: C.gold, fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
        A few minutes, a clearer picture
      </div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 52, lineHeight: 1.05, fontWeight: 600, margin: "0 0 18px", letterSpacing: -0.5 }}>
        The Money Foundations Score
      </h1>
      <p style={{ fontSize: 20, lineHeight: 1.5, color: C.ink2, maxWidth: 600, margin: "0 0 14px" }}>
        Answer a few quick questions and find out exactly where you stand with money, and the few moves that would change the most.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: C.ink2, maxWidth: 600, margin: "0 0 34px" }}>
        You will leave with your score, a clear picture of your strengths and gaps, and a short action plan you can start today, even if we never speak again. No real figures needed. Nothing is stored.
      </p>
      <button className="mf-btn" onClick={onStart} style={primaryBtn}>Get my score</button>
      <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 48 }}>
        {[["5", "foundations scored"], ["3 min", "to finish"], ["0", "real figures needed"], ["1", "clear plan"]].map(([a, b]) => (
          <div key={b}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, color: C.green }}>{a}</div>
            <div style={{ fontSize: 13, color: C.ink2 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   QUIZ
   =============================================================== */
function Quiz({ q, step, total, answers, answeredCurrent, setSingle, setScale, toggleMulti, onBack, onNext }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ paddingTop: 36 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button className="mf-btn" onClick={onBack} style={linkBtn}>‹ Back</button>
        <span style={{ fontSize: 13, color: C.ink2, fontWeight: 600 }}>{step + 1} of {total}</span>
      </div>
      <div style={{ height: 6, background: C.ink05, borderRadius: 100, overflow: "hidden", marginBottom: 38 }}>
        <div style={{ height: "100%", width: pct + "%", background: C.green, borderRadius: 100, transition: "width .3s ease" }} />
      </div>

      <div className="mf-reveal" key={q.id}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, lineHeight: 1.18, margin: "0 0 8px" }}>{q.q}</h2>
        {q.sub ? <p style={{ color: C.ink2, fontSize: 15, margin: "0 0 26px" }}>{q.sub}</p> : <div style={{ height: 18 }} />}

        {q.type === "scale10" && <Scale10 value={answers[q.id]} onPick={(v) => setScale(q.id, v)} />}

        {(q.type === "single" || q.type === "multi") && (
          <div style={{ display: "grid", gap: 12 }}>
            {q.options.map((o) => {
              const selected = q.type === "multi" ? (answers[q.id] || []).includes(o.v) : answers[q.id] === o.v;
              return (
                <button
                  key={o.v}
                  className="mf-opt"
                  onClick={() => (q.type === "multi" ? toggleMulti(q.id, o.v) : setSingle(q.id, o.v))}
                  style={{
                    textAlign: "left", padding: o.desc ? "15px 18px" : "16px 18px", borderRadius: 14,
                    border: `1.5px solid ${selected ? C.green : C.line}`,
                    background: selected ? C.greenSoft : C.card, color: C.ink, cursor: "pointer",
                    display: "flex", alignItems: o.desc ? "flex-start" : "center", justifyContent: "space-between", gap: 12,
                  }}
                >
                  <span>
                    <span style={{ fontSize: 16, fontWeight: 600, display: "block" }}>{o.label}</span>
                    {o.desc && <span style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.45, display: "block", marginTop: 3 }}>{o.desc}</span>}
                  </span>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, marginTop: o.desc ? 2 : 0,
                    borderRadius: q.type === "multi" ? 6 : 100,
                    border: `2px solid ${selected ? C.green : C.line}`,
                    background: selected ? C.green : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13,
                  }}>{selected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === "multi" && (
          <button className="mf-btn" onClick={onNext} disabled={!answeredCurrent}
            style={{ ...primaryBtn, marginTop: 26, opacity: answeredCurrent ? 1 : 0.4, cursor: answeredCurrent ? "pointer" : "not-allowed" }}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function Scale10({ value, onPick }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const sel = value === n;
          return (
            <button key={n} className="mf-opt" onClick={() => onPick(n)}
              style={{
                flex: "1 1 44px", minWidth: 44, padding: "18px 0", borderRadius: 12,
                border: `1.5px solid ${sel ? C.green : C.line}`,
                background: sel ? C.green : C.card, color: sel ? "#fff" : C.ink,
                fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, cursor: "pointer",
              }}>{n}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13, color: C.ink2 }}>
        <span>A bit lost</span><span>Completely on top of it</span>
      </div>
    </div>
  );
}

/* ===============================================================
   RESULTS
   =============================================================== */
function Results({ r, answers, firstName, reduce, openLesson, setOpenLesson, showMethod, setShowMethod, onRestart }) {
  const { pillars, overall, potential, route, plan, insights, flags } = r;
  const grade = gradeFor(overall);
  const name = firstName.trim();
  function handleDownloadPdf() {
    window.print();
  }
  const greeting = name ? `Here is where you stand, ${name}.` : "Here is where you stand.";
  const reflect = reflection(answers, pillars, route, flags, name);
  const radarData = PILLAR_META.map((m) => ({ area: m.label, value: pillars[m.key] }));
  const gapData = [
    { name: "Where you are", value: overall, fill: statusColor(overall) },
    { name: "Within reach", value: potential, fill: C.green },
  ];

  return (
    <div style={{ paddingTop: 28 }}>
      <div className="mf-noprint" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="mf-btn" onClick={handleDownloadPdf} style={{ ...ghostBtn, padding: "10px 18px", fontSize: 14 }}>
          Download as PDF
        </button>
      </div>
      <div className="mf-report" style={{ background: C.paper, padding: "12px 2px 2px" }}>
      <div className="mf-reveal" style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 100, background: statusSoft(overall), color: statusColor(overall), fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{grade.word}</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 600, margin: "0 0 26px" }}>{greeting}</h2>
        <div style={{ display: "flex", justifyContent: "center" }}><ScoreRing value={overall} reduce={reduce} /></div>
        <p style={{ color: C.ink2, fontSize: 16.5, lineHeight: 1.55, maxWidth: 540, margin: "20px auto 0" }}>{grade.note}</p>
      </div>

      <Section delay={0.05}>
        <div style={{ fontSize: 13, color: C.ink2, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>YOUR SITUATION, IN A NUTSHELL</div>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0 }}>{reflect}</p>
      </Section>

      <Section delay={0.1} title="The gap worth closing" sub="Where you are today, against where a few focused moves could realistically get you.">
        <div style={{ width: "100%", height: 150 }}>
          <ResponsiveContainer>
            <BarChart data={gapData} layout="vertical" margin={{ left: 0, right: 44, top: 6, bottom: 6 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13, fill: C.ink2, fontFamily: FONT_BODY }} axisLine={false} tickLine={false} />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={28} isAnimationActive={!reduce}>
                {gapData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                <LabelList dataKey="value" position="right" style={{ fill: C.ink, fontWeight: 700, fontFamily: FONT_DISPLAY, fontSize: 16 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ color: C.ink2, fontSize: 14.5, margin: "6px 0 0" }}>That climb of {potential - overall} points is not luck. It is the action plan below, done in order.</p>
      </Section>

      <Section delay={0.15} title="Your five foundations" sub="Strong areas to build on, and the ones quietly holding you back.">
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="78%">
              <PolarGrid stroke={C.line} />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: C.ink2, fontFamily: FONT_BODY }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={C.green} fill={C.green} fillOpacity={0.28} isAnimationActive={!reduce} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {PILLAR_META.map((m) => {
            const v = pillars[m.key];
            return (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: "0 0 150px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: C.ink2 }}>{m.blurb}</div>
                </div>
                <div style={{ flex: 1, height: 12, background: C.ink05, borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: v + "%", background: statusColor(v), borderRadius: 100, transition: reduce ? "none" : "width .8s ease" }} />
                </div>
                <div style={{ flex: "0 0 96px", textAlign: "right" }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, color: C.ink }}>{v}</span>
                  <span style={{ fontSize: 12, color: statusColor(v), fontWeight: 600, marginLeft: 8 }}>{statusLabel(v)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section delay={0.2} title="Your plan, in order of impact" sub="Top of the list is your biggest single win. Do these one at a time and the score follows.">
        <div style={{ display: "grid", gap: 12 }}>
          {plan.priority.map((act, i) => (
            <ActionCard key={i} act={act} index={i} num={i + 1} highlight={i === 0} openLesson={openLesson} setOpenLesson={setOpenLesson} />
          ))}
        </div>
        {plan.later.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: C.ink2, fontWeight: 700, letterSpacing: 0.5, margin: "22px 0 12px" }}>NEXT, ONCE THE BASICS ARE COVERED</div>
            <div style={{ display: "grid", gap: 12 }}>
              {plan.later.map((act, i) => (
                <ActionCard key={"l" + i} act={act} index={"l" + i} num={"•"} muted openLesson={openLesson} setOpenLesson={setOpenLesson} />
              ))}
            </div>
          </>
        )}
      </Section>

      {insights.length > 0 && (
        <Section delay={0.22} title="Worth understanding" sub="A few things from your answers that are genuinely useful to know.">
          <div style={{ display: "grid", gap: 12 }}>
            {insights.map((k) => (
              <div key={k} className="mf-block" style={{ background: C.blueSoft, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{LESSONS[k].title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>{LESSONS[k].body}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section delay={0.3} title="Free help, no strings" sub="Genuinely useful, independent resources. Worth a look whatever you decide to do next.">
        <div style={{ display: "grid", gap: 10 }}>
          {resourcesFor(route).map((res) => (
            <div key={res.name} className="mf-block" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1.5px solid ${C.line}`, borderRadius: 12, background: C.card }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{res.name}</div>
                <div style={{ fontSize: 13.5, color: C.ink2 }}>{res.desc}</div>
              </div>
              <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{res.url}</div>
            </div>
          ))}
        </div>
      </Section>

      <Doors route={route} />

        <p style={{ fontSize: 12.5, color: C.ink2, marginTop: 24, lineHeight: 1.5, textAlign: "center", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          The Money Foundations Score is a guide to help you see your situation clearly. It is general education and not regulated financial advice. For decisions about specific products, speak to a qualified, regulated adviser.
        </p>
      </div>

      <div className="mf-noprint" style={{ marginTop: 24 }}>
        <button className="mf-btn" onClick={() => setShowMethod((s) => !s)} style={{ ...linkBtn, fontSize: 14 }}>
          {showMethod ? "Hide how this is worked out ›" : "How is this score worked out? ›"}
        </button>
        {showMethod && (
          <p style={{ color: C.ink2, fontSize: 14, lineHeight: 1.6, marginTop: 10, maxWidth: 640 }}>
            Your answers feed five foundations: safety net, debt health, saving and investing, future and pension, and confidence and control. Each is scored from 0 to 100, then blended into your overall score. The plan and recommended next step come from your weakest areas and what you told us you actually want. A student loan is treated gently because it works differently to other debt. This is general education, not personal financial advice.
          </p>
        )}
      </div>

      <div className="mf-noprint" style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.line}`, textAlign: "center", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="mf-btn" onClick={handleDownloadPdf} style={primaryBtn}>Download as PDF</button>
        <button className="mf-btn" onClick={onRestart} style={ghostBtn}>Start again</button>
      </div>
    </div>
  );
}

function ActionCard({ act, index, num, muted, highlight, openLesson, setOpenLesson }) {
  const open = openLesson === String(index);
  return (
    <div className="mf-block" style={{ border: `1.5px solid ${highlight ? C.green : C.line}`, borderRadius: 14, background: highlight ? C.greenSoft : C.card, overflow: "hidden", opacity: muted ? 0.96 : 1 }}>
      <div style={{ display: "flex", gap: 14, padding: "16px 18px" }}>
        <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: muted ? C.ink2 : C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontWeight: 600 }}>{num}</div>
        <div style={{ flex: 1 }}>
          {highlight && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: C.green, background: "#fff", border: `1px solid ${C.green}`, padding: "2px 8px", borderRadius: 100, marginBottom: 8 }}>START HERE</div>}
          <div style={{ fontWeight: 600, fontSize: 16.5, marginBottom: 4 }}>{act.title}</div>
          <div style={{ color: C.ink2, fontSize: 14.5, lineHeight: 1.5, marginBottom: 6 }}>{act.why}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.5 }}><span style={{ fontWeight: 600 }}>How: </span><span>{act.how}</span></div>
          {act.lesson && LESSONS[act.lesson] && (
            <button className="mf-btn" onClick={() => setOpenLesson(open ? null : String(index))} style={{ ...linkBtn, marginTop: 10, fontSize: 13.5 }}>
              {open ? "Hide the why ›" : "Learn the why ›"}
            </button>
          )}
        </div>
      </div>
      {act.lesson && LESSONS[act.lesson] && open && (
        <div style={{ background: highlight ? "#fff" : C.greenSoft, padding: "16px 18px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 6 }}>{LESSONS[act.lesson].title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>{LESSONS[act.lesson].body}</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, sub, children, delay = 0 }) {
  return (
    <div className="mf-reveal mf-card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "24px 22px", marginTop: 16, animationDelay: `${delay}s` }}>
      {title && <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>{title}</h3>}
      {sub && <p style={{ color: C.ink2, fontSize: 14.5, lineHeight: 1.5, margin: "0 0 20px" }}>{sub}</p>}
      {!sub && title && <div style={{ height: 14 }} />}
      {children}
    </div>
  );
}

const DOORS = {
  learn: { title: "Learn and build it yourself", desc: "Free lessons and the Net Worth Tool, so you understand your money and watch it grow.", cta: "Start learning" },
  track: { title: "Track everything in one place", desc: "A simple dashboard of all you own and owe, with nudges on the moves that matter.", cta: "Open the Tracker" },
  coach: { title: "Talk it through with a coach", desc: "A relaxed intro call to map out your plan with someone in your corner.", cta: "Book a call" },
};

function recommendedDoor(route) {
  if (route === "COACH" || route === "ADVISER") return "coach";
  if (route === "TRACK" || route === "SORTED") return "track";
  return "learn";
}

function Doors({ route }) {
  const rec = recommendedDoor(route);
  const order = [rec, ...["learn", "track", "coach"].filter((k) => k !== rec)];
  const intro =
    route === "SUPPORT"
      ? "The free support above comes first, with no rush. These are here for whenever you are ready."
      : "You already have a plan you can start today on your own. If you would like a hand going further, here are three ways we can help. Pick whatever fits, or none at all.";
  return (
    <Section delay={0.34} title="Where to from here">
      <p style={{ color: C.ink2, fontSize: 14.5, lineHeight: 1.55, margin: "0 0 18px" }}>{intro}</p>
      <div style={{ display: "grid", gap: 12 }}>
        {order.map((k) => {
          const d = DOORS[k];
          const isRec = k === rec && route !== "SUPPORT";
          return (
            <div key={k} className="mf-block" style={{ border: `1.5px solid ${isRec ? C.green : C.line}`, background: isRec ? C.greenSoft : C.card, borderRadius: 14, padding: "18px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                {isRec && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: C.green, background: "#fff", border: `1px solid ${C.green}`, padding: "2px 8px", borderRadius: 100, marginBottom: 8 }}>RECOMMENDED FOR YOU</div>}
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
                <div style={{ color: C.ink2, fontSize: 14.5, lineHeight: 1.5 }}>{d.desc}</div>
              </div>
              <button className="mf-btn" onClick={() => {}} style={isRec ? { ...primaryBtn, padding: "13px 22px", fontSize: 15 } : { ...ghostBtn, padding: "12px 20px" }}>{d.cta}</button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ===============================================================
   STYLES
   =============================================================== */
const primaryBtn = { background: C.green, color: "#fff", border: "none", padding: "15px 26px", borderRadius: 100, fontSize: 16, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer" };
const ghostBtn = { background: C.card, color: C.ink, border: `1.5px solid ${C.line}`, padding: "14px 22px", borderRadius: 100, fontSize: 15, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer" };
const linkBtn = { background: "transparent", border: "none", color: C.green, fontWeight: 600, fontSize: 15, cursor: "pointer", padding: 0, fontFamily: FONT_BODY };
