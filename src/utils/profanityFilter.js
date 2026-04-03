// Basic profanity filter for leaderboard usernames
// Covers PT-BR + EN common slurs. Extensible.
const BLOCKED_WORDS = [
    // PT-BR
    'puta', 'caralho', 'foda', 'merda', 'viado', 'buceta', 'piroca',
    'cacete', 'porra', 'cuzao', 'arrombado', 'otario', 'vagabunda',
    'desgraca', 'fdp', 'pqp', 'vsf', 'tnc', 'krl', 'pnc',
    // EN
    'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'nigger',
    'faggot', 'retard', 'whore', 'slut', 'bastard', 'cock',
    'pussy', 'damn', 'stfu', 'wtf', 'porn', 'nazi',
];

// Normalize: remove accents, lowercase, collapse repeated chars
const normalize = (str) =>
    str.toLowerCase()
       .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/(.)\1{2,}/g, '$1$1') // aaa → aa
       .replace(/[^a-z0-9]/g, '');    // strip non-alphanumeric

export const containsProfanity = (input) => {
    const normalized = normalize(input);
    return BLOCKED_WORDS.some(word => normalized.includes(word));
};

export const sanitizeUsername = (input) => {
    if (containsProfanity(input)) return null;
    return input.trim().slice(0, 20);
};
