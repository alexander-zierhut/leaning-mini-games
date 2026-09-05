// Emoji Sentences: students read a sentence written in emojis (inspired by
// Xu Bing's "Book from the Ground") and say / type it in English.
const { readShareParam, buildShareLink, copyText, storage, hashString, modal, confettiBurst, randomPastel } = window.MiniGame;

const GAME_KEY = 'emoji-sentences';

// One tense = one time cue. The cue is shown as a chip above the emojis.
const TENSES = {
    present: { icon: '🔁', label: 'Every day', hint: '🔁 Every day → present tense: <b>eats, plays, goes</b>' },
    past: { icon: '🕰️', label: 'Yesterday', hint: '🕰️ Yesterday → past tense: <b>ate, played, went</b>' },
    future: { icon: '🔮', label: 'Tomorrow', hint: '🔮 Tomorrow → future: <b>will eat, will play, will go</b>' }
};
const TENSE_ORDER = ['present', 'past', 'future'];

// Helper symbols keep their word on every level (like the fixed symbols in Book from the Ground).
const HELPERS = { '➡️': 'to go to', '➕': 'and', '💭': 'because', '❌': 'not', '❓': 'question' };

// Default content: little stories, ordered easy → hard. The list is cut into
// thirds: level 1 (all words), level 2 (some words), level 3 (emojis only).
const DEFAULT_LINES = [
    // Level 1 – Tom's day (present)
    "👦(Tom) ⏰(to wake up) 🕖(at seven o'clock) | present | Tom wakes up at seven o'clock. / Tom wakes up at seven. / Tom gets up at seven o'clock. / Tom gets up at seven.",
    '👦(Tom) 🍽️(to eat) 🍎(apple) | present | Tom eats an apple.',
    '👦(Tom) ➡️ 🏫(school) 🚌(by bus) | present | Tom goes to school by bus. / Tom takes the bus to school.',
    '👦(Tom) ⚽(to play football) 👫(with his friends) | present | Tom plays football with his friends. / Tom plays soccer with his friends.',
    // Level 1 – Mia yesterday (past)
    '👧(Mia) 🥤(to drink) 🥛(milk) | past | Mia drank milk. / Mia drank some milk. / Mia drank a glass of milk.',
    '👧(Mia) 📖(to read) 📚(book) | past | Mia read a book.',
    '👧(Mia) 🏊(to swim) 🌊(sea) | past | Mia swam in the sea.',
    "👧(Mia) ➡️ 🛏️(bed) 🕘(at nine o'clock) | past | Mia went to bed at nine o'clock. / Mia went to bed at nine.",
    // Level 1 – Max the dog tomorrow (future)
    '🐶(Max the dog) 🏃(to run) 🌳(park) | future | Max will run in the park. / Max the dog will run in the park. / The dog will run in the park.',
    '🐶(Max) 🍽️(to eat) 🦴(bone) | future | Max will eat a bone. / The dog will eat a bone.',
    '🐶(Max) 🏊(to swim) 🏞️(lake) | future | Max will swim in the lake. / The dog will swim in the lake.',
    '🐶(Max) 😴(to sleep) 🛋️(sofa) | future | Max will sleep on the sofa. / The dog will sleep on the sofa. / Max will sleep on the couch.',
    // Level 2 – Grandma's day (present)
    '👵(Grandma) 👩‍🍳(to bake) 🎂(cake) 🌅(in the morning) | present | Grandma bakes a cake in the morning.',
    "👵(Grandma) 📞(to call) 👧(Mia) 🕛(at twelve o'clock) | present | Grandma calls Mia at twelve o'clock. / Grandma calls Mia at twelve.",
    '👵(Grandma) 🛒(to buy) 🍌(bananas) 🏪(at the shop) | present | Grandma buys bananas at the shop. / Grandma buys bananas at the store.',
    '👵(Grandma) 📺(to watch TV) 🌙(in the evening) | present | Grandma watches TV in the evening. / Grandma watches television in the evening.',
    // Level 2 – The family at the beach (past)
    '👨‍👩‍👧(the family) 🚗(to drive) 🏖️(beach) | past | The family drove to the beach.',
    '☀️(sunny) ➕ 🥵(hot) | past | It was sunny and hot. / The weather was sunny and hot.',
    '👦(Tom) 👷(to build) 🏰(sandcastle) | past | Tom built a sandcastle.',
    "👨‍👩‍👧(the family) 🍽️(to eat) 🍦(ice cream) 🕔(at five o'clock) | past | The family ate ice cream at five o'clock. / The family ate ice cream at five.",
    // Level 2 – Mia's birthday party (future)
    '👧(Mia) 🎉(to have a party) 🏠(at home) | future | Mia will have a party at home.',
    "👫(her friends) 🎁(to bring presents) | future | Her friends will bring presents. / The friends will bring presents. / Mia's friends will bring presents.",
    '👧(Mia) 🎸(to play the guitar) ➕ 🎤(to sing) | future | Mia will play the guitar and sing.',
    '👨‍👩‍👧(the family) 💃(to dance) 🌙(at night) | future | The family will dance at night.',
    // Level 3 – Tom at school (present)
    '❓ 👦(Tom) 🎹(to play the piano) | present | Does Tom play the piano?',
    "👦(Tom) ❌ 🍽️(to eat) 🥦(broccoli) 💭 ❌ 👍(to like it) | present | Tom does not eat broccoli because he does not like it. / Tom doesn't eat broccoli because he doesn't like it. / Tom does not eat broccoli because he hates it.",
    "🧑‍🏫(the teacher) 📚(to teach) 🗣️(English) 🕘(at nine o'clock) | present | The teacher teaches English at nine o'clock. / The teacher teaches English at nine.",
    '👦(Tom) 📚(to study) 🌙(in the evening) 💭 📋(a test) | present | Tom studies in the evening because he has a test. / Tom studies in the evening because of the test.',
    // Level 3 – Max runs away (past)
    '🐶(Max) 🏃(to run away) 💭 😱(scared) 🎆(fireworks) | past | Max ran away because he was scared of the fireworks. / The dog ran away because he was scared of the fireworks. / Max ran away because he was afraid of the fireworks.',
    '👧(Mia) 😢(sad) ➕ 🔍(to look for) 🐶(Max) | past | Mia was sad and looked for Max. / Mia was sad and she looked for Max.',
    '❓ 👧(Mia) 🔍(to find) 🐶(Max) 🌳(in the park) | past | Did Mia find Max in the park?',
    '👧(Mia) 🔍(to find) 🐶(Max) 🛋️(under the sofa) ➕ 😊(happy) | past | Mia found Max under the sofa and she was happy. / Mia found Max under the sofa and was happy.',
    // Level 3 – Holiday in Paris (future)
    '👨‍👩‍👧(the family) ✈️(to fly) 🗼(Paris) 🌅(in the morning) | future | The family will fly to Paris in the morning.',
    '❓ 👦(Tom) 🧗(to climb) 🗼(the Eiffel Tower) | future | Will Tom climb the Eiffel Tower? / Is Tom going to climb the Eiffel Tower?',
    "👧(Mia) ❌ 🏊(to swim) 💭 🥶(cold) | future | Mia will not swim because it is cold. / Mia won't swim because it is cold. / Mia will not swim because it will be cold. / Mia will not swim because the water is cold.",
    '👨‍👩‍👧(the family) 🍽️(to eat dinner) 🍕(pizza) ➕ 📸(to take photos) | future | The family will eat pizza for dinner and take photos. / The family will eat pizza and take photos. / The family will have pizza for dinner and take photos.'
];

// --- Parsing teacher content ---------------------------------------------
// Line format:  👧(girl) 🍎(apple) 🍽️(eat) | past | The girl ate an apple. / She ate an apple.
const TOKEN_RE = /(\S+?)\(([^)]*)\)|(\S+)/g;

function parseLine(line) {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 3) {
        return null;
    }
    const [emojiPart, tensePart, answerPart] = parts;
    const tense = tensePart.toLowerCase();
    if (!TENSES[tense]) {
        return null;
    }
    const tokens = [];
    for (const m of emojiPart.matchAll(TOKEN_RE)) {
        const emoji = m[1] ?? m[3];
        const word = m[2] ?? HELPERS[emoji] ?? '';
        const clean = word.trim();
        tokens.push({ emoji, word: clean, helper: emoji in HELPERS, verb: /^to\s/i.test(clean) });
    }
    const answers = answerPart
        .split('/')
        .map((a) => a.trim())
        .filter(Boolean);
    if (!tokens.length || !answers.length) {
        return null;
    }
    return { tokens, tense, answers };
}

function parseLines(lines) {
    return lines.map(parseLine).filter(Boolean);
}

// --- Answer checking ------------------------------------------------------
// Normalises both the student's sentence and the accepted answers so that
// punctuation, contractions, time words, "going to" and articles don't matter.
function normalize(s) {
    let t = s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"');
    t = t.replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot').replace(/\bshan't\b/g, 'shall not');
    t = t.replace(/n't\b/g, ' not').replace(/\bi'm\b/g, 'i am').replace(/'re\b/g, ' are').replace(/'ll\b/g, ' will').replace(/'ve\b/g, ' have').replace(/'d\b/g, ' would');
    t = t.replace(/\b(he|she|it|that|there|what|who|where|how|here)'s\b/g, '$1 is');
    t = t.replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/'/g, '');
    t = t.replace(/\b(every day|everyday|yesterday|tomorrow|today|right now|now)\b/g, ' ');
    t = t.replace(/\b(am|is|are) going to\b/g, 'will').replace(/\bgonna\b/g, 'will');
    t = t.replace(/\b(a|an|the)\b/g, 'the');
    return t.replace(/\s+/g, ' ').trim();
}

// Even more forgiving: ignores articles and small possessive words.
function lenient(t) {
    return t
        .replace(/\b(the|his|her|their|its|my|our|your|some)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Dice coefficient over words, used to tell "almost" from "try again".
function similarity(a, b) {
    const A = a.split(' ').filter(Boolean);
    const B = b.split(' ').filter(Boolean);
    if (!A.length || !B.length) {
        return 0;
    }
    const counts = new Map();
    B.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
    let common = 0;
    A.forEach((w) => {
        if (counts.get(w) > 0) {
            common++;
            counts.set(w, counts.get(w) - 1);
        }
    });
    return (2 * common) / (A.length + B.length);
}

function grade(input, item) {
    const s = normalize(input);
    const l = lenient(s);
    let best = { score: -1, answer: item.answers[0] };
    for (const ans of item.answers) {
        const ns = normalize(ans);
        if (ns === s) {
            return { correct: true, answer: ans };
        }
        if (lenient(ns) === l) {
            return { correct: true, answer: ans };
        }
        const score = similarity(lenient(ns), l);
        if (score > best.score) {
            best = { score, answer: ans };
        }
    }
    const studentWords = new Set(s.split(' '));
    const missing = best.answer
        .replace(/[^\p{L}\p{N}\s']/gu, ' ')
        .split(/\s+/)
        .filter((w) => {
            const n = normalize(w);
            return n && !studentWords.has(n);
        })
        .slice(0, 3);
    return { correct: false, near: best.score >= 0.5, missing, answer: best.answer };
}

// --- Config & state -------------------------------------------------------
const defaultConfig = () => ({
    name: '',
    tenses: [...TENSE_ORDER],
    hintMode: 'auto',
    lines: [...DEFAULT_LINES]
});

let config = defaultConfig();
let items = [];
let state = { index: 0, stars: 0, attempts: 0, solved: false };

function configFromShare(obj) {
    const cfg = defaultConfig();
    if (obj.n) {
        cfg.name = String(obj.n);
    }
    if (Array.isArray(obj.t) && obj.t.length) {
        cfg.tenses = TENSE_ORDER.filter((t) => obj.t.includes(t));
    }
    if (obj.h === 'always' || obj.h === 'never') {
        cfg.hintMode = obj.h;
    }
    if (typeof obj.s === 'string' && obj.s.trim()) {
        cfg.lines = obj.s.split('\n');
    }
    return cfg;
}

function shareFromConfig(cfg) {
    const obj = {};
    if (cfg.name) {
        obj.n = cfg.name;
    }
    if (cfg.tenses.length !== TENSE_ORDER.length) {
        obj.t = cfg.tenses;
    }
    if (cfg.hintMode !== 'auto') {
        obj.h = cfg.hintMode;
    }
    if (cfg.lines.join('\n') !== DEFAULT_LINES.join('\n')) {
        obj.s = cfg.lines.join('\n');
    }
    return obj;
}

const progressKey = () => `${GAME_KEY}:${hashString(JSON.stringify([config.tenses, config.hintMode, config.lines]))}`;

function saveProgress() {
    storage.set(progressKey(), { index: state.index, stars: state.stars });
}

function buildItems() {
    const all = parseLines(config.lines).filter((it) => config.tenses.includes(it.tense));
    const n = all.length;
    items = all.map((it, i) => ({ ...it, level: n < 3 ? 1 : Math.min(3, Math.floor((i * 3) / n) + 1) }));
}

const levelOf = (index) => {
    const item = items[Math.min(index, items.length - 1)];
    return item ? item.level : 1;
};

function showWord(token, tokenIndex, itemIndex) {
    if (token.helper) {
        return true;
    }
    if (!token.word) {
        return false;
    }
    if (config.hintMode === 'always') {
        return true;
    }
    if (config.hintMode === 'never') {
        return false;
    }
    const level = levelOf(itemIndex);
    if (level === 1) {
        return true;
    }
    if (level === 2) {
        return (tokenIndex + itemIndex) % 2 === 0;
    }
    return false;
}

// --- DOM ------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
// On touch devices, don't pop the keyboard up over the emojis on every sentence.
const HAS_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const titleEl = $('title');
const counterEl = $('counter');
const progressBar = $('progressBar');
const tenseChip = $('tenseChip');
const emojiRow = $('emojiRow');
const legendEl = $('legend');
const answerForm = $('answerForm');
const answerInput = $('answerInput');
const micBtn = $('micBtn');
const checkBtn = $('checkBtn');
const revealBtn = $('revealBtn');
const nextBtn = $('nextBtn');
const messageEl = $('message');
const answerBox = $('answerBox');
const answerText = $('answerText');
const listenBtn = $('listenBtn');

const overlayEl = $('overlay');
const overlayEmoji = $('overlayEmoji');
const overlayTitle = $('overlayTitle');
const overlayText = $('overlayText');
const overlayActions = $('overlayActions');

const settingsModalEl = $('settingsModal');
const teacherNameInput = $('teacherName');
const tenseChecks = [...document.querySelectorAll('#tenseChecks input')];
const hintModeSelect = $('hintMode');
const sentencesInput = $('sentencesInput');
const shareLinkDiv = $('shareLink');
const generateLinkBtn = $('generateLink');

const settingsModal = modal(settingsModalEl);
const overlay = modal(overlayEl);

// --- Rendering ------------------------------------------------------------
function updateHeader() {
    titleEl.textContent = config.name ? `${config.name}’s Emoji Sentences` : '✨ Emoji Sentences ✨';
}

function updateCounter() {
    const n = items.length;
    const pos = Math.min(state.index + 1, n);
    counterEl.textContent = `Level ${levelOf(state.index)} · Sentence ${pos} / ${n} · ⭐ ${state.stars}`;
    progressBar.style.width = `${n ? (state.index / n) * 100 : 0}%`;
}

function setMessage(text, hintHtml = '') {
    messageEl.textContent = text;
    if (hintHtml) {
        const hint = document.createElement('span');
        hint.className = 'hint';
        hint.innerHTML = hintHtml;
        messageEl.appendChild(hint);
    }
}

function renderItem() {
    const item = items[state.index];
    state.attempts = 0;
    state.solved = false;

    const tense = TENSES[item.tense];
    tenseChip.textContent = `${tense.icon} ${tense.label}`;

    emojiRow.replaceChildren();
    let hidden = 0;
    let verbsShown = 0;
    item.tokens.forEach((token, i) => {
        const el = document.createElement('div');
        el.className = 'token';
        const emoji = document.createElement('div');
        emoji.className = 'emoji';
        emoji.textContent = token.emoji;
        el.appendChild(emoji);
        if (showWord(token, i, state.index)) {
            const word = document.createElement('div');
            word.className = 'chip word' + (token.helper ? ' helper' : '') + (token.verb ? ' verb' : '');
            if (token.verb) {
                // "to wake up": the "to" is shown lighter so the card reads as a verb to conjugate
                const to = document.createElement('span');
                to.className = 'to';
                to.textContent = token.word.slice(0, 2);
                word.append(to, token.word.slice(2));
                verbsShown++;
            } else {
                word.textContent = token.word;
                word.style.setProperty('--chip-bg', randomPastel());
            }
            el.appendChild(word);
        } else if (token.word) {
            hidden++;
        }
        emojiRow.appendChild(el);
    });
    const legend = [];
    if (verbsShown) {
        legend.push('💙 Blue card = verb. Change it to the right tense!');
    }
    if (hidden) {
        legend.push('🤫 Some words are hidden. What do you see?');
    }
    legendEl.hidden = legend.length === 0;
    legendEl.replaceChildren(...legend.map((t) => {
        const line = document.createElement('div');
        line.textContent = t;
        return line;
    }));

    answerInput.value = '';
    answerInput.disabled = false;
    checkBtn.disabled = false;
    revealBtn.disabled = false;
    nextBtn.hidden = true;
    answerBox.hidden = true;
    setMessage('');
    updateCounter();
    if (HAS_POINTER) {
        answerInput.focus({ preventScroll: true });
    }
}

function showAnswer(item) {
    answerText.textContent = item.answers[0];
    answerBox.hidden = false;
    answerInput.disabled = true;
    checkBtn.disabled = true;
    revealBtn.disabled = true;
    nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
}

function check() {
    if (state.solved) {
        return;
    }
    const item = items[state.index];
    const value = answerInput.value.trim();
    if (!value) {
        setMessage('Say it out loud, then type it here ✏️');
        answerInput.focus();
        return;
    }
    state.attempts++;
    const result = grade(value, item);

    if (result.correct) {
        const earned = state.attempts === 1 ? 3 : state.attempts === 2 ? 2 : 1;
        state.stars += earned;
        state.solved = true;
        setMessage(`Correct! 🌟 +${'⭐'.repeat(earned)}`);
        confettiBurst();
        showAnswer(item);
        updateCounter();
        return;
    }

    let hint;
    if (state.attempts === 1) {
        hint = TENSES[item.tense].hint;
    } else if (result.missing.length) {
        hint = `Missing words: <b>${result.missing.join(', ')}</b>`;
    } else {
        hint = 'Check the word order, or tap 👀 Show answer.';
    }
    setMessage(result.near ? 'Almost there! ✨' : 'Try again! 🙈', hint);
    answerInput.select();
}

function reveal() {
    if (state.solved) {
        return;
    }
    const item = items[state.index];
    state.solved = true;
    setMessage('Here it is 👀 Say it out loud!');
    showAnswer(item);
    speak(item.answers[0]);
}

function next() {
    const from = state.index;
    state.index++;
    saveProgress();
    if (state.index >= items.length) {
        finish();
        return;
    }
    if (levelOf(state.index) !== levelOf(from)) {
        showLevelUp(levelOf(state.index));
        return;
    }
    renderItem();
}

// --- Overlays -------------------------------------------------------------
function showOverlay({ emoji, title, text, actions }) {
    overlayEmoji.textContent = emoji;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayActions.replaceChildren();
    actions.forEach(({ label, secondary, onClick }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        if (secondary) {
            btn.className = 'secondary';
        }
        btn.addEventListener('click', () => {
            overlay.close();
            onClick();
        });
        overlayActions.appendChild(btn);
    });
    overlay.open();
}

function showLevelUp(level) {
    const texts = {
        auto: {
            2: 'Some words are hidden now. Look at the emojis and say the whole sentence!',
            3: 'Emojis only! You can do it!'
        },
        other: {
            2: 'The sentences get a little longer now.',
            3: 'The hardest sentences: questions, "not" and "because"!'
        }
    };
    const group = config.hintMode === 'auto' ? texts.auto : texts.other;
    showOverlay({
        emoji: level === 3 ? '🔥' : '🚀',
        title: `Level ${level}!`,
        text: group[level] || 'Keep going!',
        actions: [{ label: 'Let’s go! 🎉', onClick: renderItem }]
    });
}

function finish() {
    const max = items.length * 3;
    updateCounter();
    progressBar.style.width = '100%';
    confettiBurst({ particleCount: 250, spread: 120 });
    showOverlay({
        emoji: '🎉🏆🎉',
        title: 'All done!',
        text: `${config.name ? config.name + ' says: ' : ''}Great job! You collected ${state.stars} of ${max} stars.`,
        actions: [{ label: 'Play again 🔄', onClick: restart }]
    });
}

function restart() {
    state = { index: 0, stars: 0, attempts: 0, solved: false };
    storage.remove(progressKey());
    renderItem();
}

function start() {
    buildItems();
    updateHeader();
    if (!items.length) {
        emojiRow.replaceChildren();
        tenseChip.textContent = '🤔';
        setMessage('No sentences yet. Open the 🔧 settings to add some.');
        updateCounter();
        return;
    }
    state = { index: 0, stars: 0, attempts: 0, solved: false };
    const saved = storage.get(progressKey());
    if (saved && saved.index > 0 && saved.index < items.length) {
        showOverlay({
            emoji: '👋',
            title: 'Welcome back!',
            text: `You stopped at sentence ${saved.index + 1} with ${saved.stars} ${saved.stars === 1 ? 'star' : 'stars'}. Continue?`,
            actions: [
                {
                    label: 'Continue ▶️',
                    onClick: () => {
                        state.index = saved.index;
                        state.stars = saved.stars;
                        renderItem();
                    }
                },
                { label: 'Start over 🔄', secondary: true, onClick: restart }
            ]
        });
        updateCounter();
        return;
    }
    renderItem();
}

// --- Speech: dictate the answer, listen to the model sentence ------------
function speak(text) {
    if (!('speechSynthesis' in window)) {
        return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (voice) {
        u.voice = voice;
    }
    speechSynthesis.speak(u);
}

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognitionCtor) {
    micBtn.hidden = false;
    let recognition = null;
    micBtn.addEventListener('click', () => {
        if (recognition) {
            recognition.stop();
            return;
        }
        recognition = new SpeechRecognitionCtor();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        micBtn.classList.add('listening');
        setMessage('Listening… 🎤');
        recognition.onresult = (e) => {
            answerInput.value = e.results[0][0].transcript;
            check();
        };
        recognition.onerror = (e) => {
            setMessage(e.error === 'not-allowed' ? 'Please allow the microphone 🎤' : 'I did not catch that. Try again 🎤');
        };
        recognition.onend = () => {
            micBtn.classList.remove('listening');
            recognition = null;
        };
        recognition.start();
    });
}

listenBtn.addEventListener('click', () => speak(answerText.textContent));

// --- Wiring ---------------------------------------------------------------
answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    check();
});
revealBtn.addEventListener('click', reveal);
nextBtn.addEventListener('click', next);

$('settingsBtn').addEventListener('click', () => {
    teacherNameInput.value = config.name;
    tenseChecks.forEach((cb) => {
        cb.checked = config.tenses.includes(cb.value);
    });
    hintModeSelect.value = config.hintMode;
    sentencesInput.value = config.lines.join('\n');
    shareLinkDiv.hidden = true;
    settingsModal.open();
});
$('closeModal').addEventListener('click', settingsModal.close);

function readSettings() {
    const cfg = {
        name: teacherNameInput.value.trim(),
        tenses: TENSE_ORDER.filter((t) => tenseChecks.find((cb) => cb.value === t).checked),
        hintMode: hintModeSelect.value,
        lines: sentencesInput.value
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
    };
    if (!cfg.tenses.length) {
        alert('Please tick at least one tense.');
        return null;
    }
    const valid = parseLines(cfg.lines);
    if (!valid.length) {
        alert('Please add at least one sentence in the format\nemojis(word) … | tense | answer');
        return null;
    }
    if (!valid.some((it) => cfg.tenses.includes(it.tense))) {
        alert('None of the sentences use the ticked tenses.');
        return null;
    }
    if (valid.length < cfg.lines.length) {
        const bad = cfg.lines.length - valid.length;
        if (!confirm(`${bad} line(s) could not be read and will be skipped. Continue?`)) {
            return null;
        }
    }
    return cfg;
}

$('saveConfig').addEventListener('click', () => {
    const cfg = readSettings();
    if (!cfg) {
        return;
    }
    config = cfg;
    settingsModal.close();
    start();
});

$('resetDefaults').addEventListener('click', () => {
    sentencesInput.value = DEFAULT_LINES.join('\n');
    tenseChecks.forEach((cb) => {
        cb.checked = true;
    });
    hintModeSelect.value = 'auto';
});

generateLinkBtn.addEventListener('click', async () => {
    const cfg = readSettings();
    if (!cfg) {
        return;
    }
    const link = buildShareLink(shareFromConfig(cfg));
    shareLinkDiv.textContent = link;
    shareLinkDiv.hidden = false;
    if (await copyText(link)) {
        generateLinkBtn.textContent = 'Copied! ✅';
        setTimeout(() => {
            generateLinkBtn.textContent = 'Generate Link';
        }, 1500);
    }
    const range = document.createRange();
    range.selectNodeContents(shareLinkDiv);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
});

// --- Boot -----------------------------------------------------------------
const shared = readShareParam();
if (shared) {
    config = configFromShare(shared);
}
start();
