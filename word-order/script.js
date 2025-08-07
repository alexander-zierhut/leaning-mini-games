// Base64 encoding and decoding helpers
const toBase64 = (str) => {
    return btoa(unescape(encodeURIComponent(str)));
};

const fromBase64 = (str) => {
    return decodeURIComponent(escape(atob(str)));
};

// Application state
let tasks = [
    'I am going to school',
    'She likes playing soccer',
    'They will arrive tomorrow',
    'Can you open the window'
];
let teacherName = '';
let currentIndex = 0;

// Grab DOM elements once at startup
const bank = document.getElementById('bank');
const dropzone = document.getElementById('dropzone');
const taskCounter = document.getElementById('task-counter');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const message = document.getElementById('message');
const titleEl = document.getElementById('title');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const teacherNameInput = document.getElementById('teacherName');
const sentencesInput = document.getElementById('sentencesInput');
const saveConfigBtn = document.getElementById('saveConfig');
const generateLinkBtn = document.getElementById('generateLink');
const closeModalBtn = document.getElementById('closeModal');
const shareLinkDiv = document.getElementById('shareLink');

// Initialize tasks and teacher name from URL if present
(function initFromURL() {
    const dataParam = new URLSearchParams(location.search).get('data');
    if(!dataParam) {
        return;
    }

    try {
        const obj = JSON.parse(fromBase64(dataParam));
        if(Array.isArray(obj.sentences) && obj.sentences.length) {
            tasks = obj.sentences;
        }
        if(obj.name) {
            teacherName = obj.name;
        }
    } catch (e) {
        console.warn('Invalid share link data', e);
    }
})();

// Utility functions
const shuffle = (arr) => {
    return [...arr].sort(() => Math.random() - 0.5);
};

const clearZone = (zone) => {
    while (zone.firstChild) {
        zone.removeChild(zone.firstChild);
    }
};

const randomPastel = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
};

// Update the page title based on teacher name
const updateHeader = () => {
    if(teacherName) {
        titleEl.textContent = `${teacherName}’s Word Order Adventure`;
        return;
    }
    titleEl.textContent = '✨ Word Order Adventure ✨';
};
updateHeader();

// Create a span element for a single word
const createWordEl = (word) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.className = 'word';
    span.style.background = randomPastel();
    span.style.touchAction = 'none';
    return span;
};

// Load and render the current sentence task
function loadTask() {
    message.textContent = '';
    nextBtn.style.display = 'none';
    checkBtn.disabled = false;

    const sentence = tasks[currentIndex];
    const words = shuffle(sentence.split(' '));

    clearZone(bank);
    clearZone(dropzone);

    words.forEach((w) => {
        bank.appendChild(createWordEl(w));
    });

    taskCounter.textContent = `Sentence ${currentIndex + 1} / ${tasks.length}`;
}

// Initialize SortableJS for drag-and-drop
const sortableOptions = {
    group: 'words',
    animation: 150,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    ghostClass: 'ghost',
    fallbackOnBody: true,
    onEnd: () => {
        bank.style.minHeight = bank.children.length ? '' : '3.5rem';
        dropzone.style.minHeight = dropzone.children.length ? '' : '3.5rem';
    }
};

new Sortable(bank, { ...sortableOptions, sort: false });
new Sortable(dropzone, { ...sortableOptions, sort: true });

// Handle check button: compare arranged words to target
checkBtn.addEventListener('click', () => {
    const arranged = [...dropzone.querySelectorAll('.word')]
        .map((el) => el.textContent.trim())
        .join(' ');
    const target = tasks[currentIndex].trim();

    if(arranged === target) {
        message.textContent = 'Correct! 🌟';
        checkBtn.disabled = true;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

        if(currentIndex < tasks.length - 1) {
            nextBtn.style.display = 'inline-block';
            return;
        }

        message.textContent += ' You finished all sentences! 🎈';
        return;
    }

    message.textContent = 'Try again! 🙈';
});

// Move to next sentence when user clicks next
nextBtn.addEventListener('click', () => {
    currentIndex++;
    loadTask();
});

// Initial task load
loadTask();

// Modal open/close logic for settings
function openModal() {
    teacherNameInput.value = teacherName;
    sentencesInput.value = tasks.join('\n');
    shareLinkDiv.style.display = 'none';
    settingsModal.style.display = 'flex';
}

function closeModal() {
    settingsModal.style.display = 'none';
}

settingsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Save new configuration from modal inputs
saveConfigBtn.addEventListener('click', () => {
    teacherName = teacherNameInput.value.trim();
    const lines = sentencesInput.value
        .split(/\n+/)
        .map((l) => l.trim())
        .filter((l) => l);

    if(!lines.length) {
        alert('Please add at least one sentence.');
        return;
    }

    tasks = lines;
    currentIndex = 0;
    updateHeader();
    loadTask();
    shareLinkDiv.style.display = 'none';
    closeModal();
});

// Generate a shareable link with Base64-encoded config
generateLinkBtn.addEventListener('click', () => {
    teacherName = teacherNameInput.value.trim();
    const lines = sentencesInput.value
        .split(/\n+/)
        .map((l) => l.trim())
        .filter((l) => l);

    if(!lines.length) {
        alert('Please add at least one sentence before generating a link.');
        return;
    }

    const payload = {
        name: teacherName,
        sentences: lines
    };
    const encoded = toBase64(JSON.stringify(payload));
    const fullLink = `${location.origin + location.pathname}?data=${encoded}`;

    shareLinkDiv.textContent = fullLink;
    shareLinkDiv.style.display = 'block';

    navigator.clipboard?.writeText(fullLink).then(() => {
        generateLinkBtn.textContent = 'Copied! ✅';
        setTimeout(() => {
            generateLinkBtn.textContent = 'Generate Link';
        }, 1500);
    });

    const range = document.createRange();
    range.selectNodeContents(shareLinkDiv);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
});
