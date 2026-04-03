/**
 * Input Action Map — abstracts raw keys into game actions.
 * Enables future rebinding and unifies keyboard + touch under the same action system.
 */

const ACTION_MAP = {
    ATTACK_LEFT:  ['a', 'arrowleft'],
    ATTACK_RIGHT: ['d', 'arrowright'],
    PAUSE:        ['escape'],
    SUPER:        [' '],
};

// Reverse lookup: key → action (built once at load)
const KEY_TO_ACTION = {};
for (const [action, keys] of Object.entries(ACTION_MAP)) {
    for (const key of keys) {
        KEY_TO_ACTION[key] = action;
    }
}

/**
 * Resolve a raw key string to a game action.
 * @param {string} rawKey - The keyboard event key (lowercased)
 * @returns {string|null} The action name or null if unmapped
 */
export const resolveAction = (rawKey) => {
    return KEY_TO_ACTION[rawKey.toLowerCase()] ?? null;
};

/**
 * Get all keys bound to an action (for UI display).
 * @param {string} action - Action name (e.g. 'ATTACK_LEFT')
 * @returns {string[]} Array of bound key names
 */
export const getKeysForAction = (action) => {
    return ACTION_MAP[action] ?? [];
};

/**
 * Rebind an action to new keys (for future settings UI).
 * @param {string} action - Action to rebind
 * @param {string[]} newKeys - New key bindings (lowercased)
 */
export const rebindAction = (action, newKeys) => {
    // Remove old bindings for this action
    const oldKeys = ACTION_MAP[action] ?? [];
    for (const key of oldKeys) {
        delete KEY_TO_ACTION[key];
    }
    // Set new bindings
    ACTION_MAP[action] = newKeys;
    for (const key of newKeys) {
        KEY_TO_ACTION[key] = action;
    }
};

// Keys that should prevent default browser behavior (scroll, etc.)
export const PREVENT_DEFAULT_KEYS = ['arrowdown', 'arrowup', 'arrowleft', 'arrowright', ' '];

export default ACTION_MAP;
