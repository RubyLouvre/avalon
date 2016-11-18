//https://github.com/teppeis/htmlspecialchars
export function escapeFilter(str) {
    if (str == null)
        return ''

    return String(str).
        replace(/&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;').
        replace(/"/g, '&quot;').
        replace(/'/g, '&#39;')
}
