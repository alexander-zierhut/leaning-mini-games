// Shared helpers for all Learning Mini-Games.
// Loaded as a classic <script>; everything is exposed on window.MiniGame.
(function () {
    'use strict';

    // --- Share links -------------------------------------------------------
    // URL-safe base64 (no '+', '/', '='): survives URLSearchParams, which turns
    // '+' into a space, and survives chat apps that break links on '/'.
    const encodeShare = (obj) => {
        const bytes = new TextEncoder().encode(JSON.stringify(obj));
        let bin = '';
        bytes.forEach((b) => {
            bin += String.fromCharCode(b);
        });
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const decodeShare = (str) => {
        // Accept old-style links too: a '+' that became a space is restored.
        let s = str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '+');
        while (s.length % 4) {
            s += '=';
        }
        const bin = atob(s);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    };

    const readShareParam = (key = 'data') => {
        const raw = new URLSearchParams(location.search).get(key);
        if (!raw) {
            return null;
        }
        try {
            return decodeShare(raw);
        } catch (e) {
            console.warn('Invalid share link data', e);
            return null;
        }
    };

    const buildShareLink = (obj, key = 'data') => {
        return `${location.origin}${location.pathname}?${key}=${encodeShare(obj)}`;
    };

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            return false;
        }
    };

    // --- Local progress ----------------------------------------------------
    // localStorage that never throws (private mode, blocked storage, old browsers).
    const storage = {
        get(key, fallback = null) {
            try {
                const v = localStorage.getItem(key);
                return v === null ? fallback : JSON.parse(v);
            } catch (e) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                /* ignore */
            }
        }
    };

    // Short stable hash, e.g. to key saved progress by teacher config.
    const hashString = (str) => {
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h + str.charCodeAt(i)) | 0;
        }
        return (h >>> 0).toString(36);
    };

    // --- Misc --------------------------------------------------------------
    // Fisher-Yates shuffle. With avoidOriginal the result never equals the
    // input order (as long as the input has at least two different values).
    const shuffle = (arr, avoidOriginal = false) => {
        const out = [...arr];
        const distinct = new Set(arr).size > 1;
        let guard = 0;
        do {
            for (let i = out.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [out[i], out[j]] = [out[j], out[i]];
            }
        } while (avoidOriginal && distinct && out.every((v, i) => v === arr[i]) && ++guard < 20);
        return out;
    };

    const randomPastel = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;

    const confettiBurst = (opts = {}) => {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, ...opts });
        }
    };

    // Modal helper: .open class toggles it; closes on Escape and backdrop click.
    const modal = (el, { onClose } = {}) => {
        const isOpen = () => el.classList.contains('open');
        const open = () => {
            el.classList.add('open');
            el.setAttribute('aria-hidden', 'false');
            const first = el.querySelector('input, textarea, select, button');
            if (first) {
                first.focus();
            }
        };
        const close = () => {
            if (!isOpen()) {
                return;
            }
            el.classList.remove('open');
            el.setAttribute('aria-hidden', 'true');
            if (onClose) {
                onClose();
            }
        };
        el.addEventListener('click', (e) => {
            if (e.target === el) {
                close();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) {
                close();
            }
        });
        return { open, close, isOpen };
    };

    window.MiniGame = {
        encodeShare,
        decodeShare,
        readShareParam,
        buildShareLink,
        copyText,
        storage,
        hashString,
        shuffle,
        randomPastel,
        confettiBurst,
        modal
    };
})();
