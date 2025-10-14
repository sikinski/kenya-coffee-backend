export function parseCommaList(input) {
    if (!input) return null;

    return input
        .split(',')
        .map(item => {
            const trimmed = item.trim();
            const num = Number(trimmed);
            return !isNaN(num) && trimmed !== '' ? num : trimmed;
        })
        .filter(item => item !== '' && item != null);
}
