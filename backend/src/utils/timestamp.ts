/**
 *
 * @returns Current Unix timestamp
 */
export function getTimestamp(): number {
    return Date.now();
}

/**
 *
 * @returns Current ISO string
 */
export function getIsoString(): string {
    return new Date().toISOString();
}
