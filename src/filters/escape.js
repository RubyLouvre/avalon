
//https://github.com/teppeis/htmlspecialchars
function escape(str) {
    if (str == null)
        return ''

    return String(str).
            replace(/&/g, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;').
            replace(/"/g, '&quot;').
            replace(/'/g, '&#039;')
}

module.exports = escape



      



