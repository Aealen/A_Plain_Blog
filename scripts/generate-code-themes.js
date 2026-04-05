const fs = require('fs')
const path = require('path')

const hljsDir = path.resolve(__dirname, '..', 'node_modules', 'highlight.js', 'styles')

var THEMES = {
  'atom-one-dark': { file: 'atom-one-dark.css', label: 'Atom One Dark' },
  'atom-one-light': { file: 'atom-one-light.css', label: 'Atom One Light' },
  'nord': { file: 'nord.css', label: 'Nord' },
  'tokyo-night-dark': { file: 'tokyo-night-dark.css', label: 'Tokyo Night' },
  'vs2015': { file: 'vs2015.css', label: 'VS 2015' },
  'github-dark-dimmed': { file: 'github-dark-dimmed.css', label: 'GitHub Dark Dimmed' },
  'mono-blue': { file: 'mono-blue.css', label: 'Mono Blue' },
}

var DEFAULT_THEME = 'github-dark-dimmed'
var OUT_CSS = path.resolve(__dirname, '..', 'src', 'styles', 'code-themes.css')
var OUT_JSON = path.resolve(__dirname, '..', 'src', 'lib', 'code-themes.json')

function scopeSelectors(css, themeName) {
  var prefix = '[data-code-theme="' + themeName + '"]'
  // Strategy: collect complete CSS rules, then scope each rule's selectors
  // A rule = everything from outside a block to the matching closing brace
  var output = ''
  var i = 0
  var len = css.length

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(css[i])) {
      output += css[i]
      i++
    }
    if (i >= len) break

    // Check for comment
    if (css[i] === '/' && i + 1 < len && css[i + 1] === '*') {
      var commentEnd = css.indexOf('*/', i + 2)
      if (commentEnd === -1) commentEnd = len - 2
      output += css.substring(i, commentEnd + 2)
      i = commentEnd + 2
      continue
    }

    // Collect selector(s) until opening brace
    var selectorStart = i
    var braceDepth = 0
    while (i < len) {
      if (css[i] === '{') {
        braceDepth++
        break
      }
      if (css[i] === '/' && i + 1 < len && css[i + 1] === '*') {
        // Skip comment within selector area
        var ce = css.indexOf('*/', i + 2)
        if (ce === -1) ce = len - 2
        i = ce + 2
        continue
      }
      i++
    }
    if (i >= len) {
      output += css.substring(selectorStart)
      break
    }

    var selectorText = css.substring(selectorStart, i).trim()
    // Scope each selector
    if (selectorText) {
      var parts = selectorText.split(',').map(function(seg) {
        var s = seg.trim()
        if (!s) return ''
        return prefix + ' ' + s
      }).filter(Boolean).join(',\n')
      output += parts + ' '
    }

    // Now collect the block content (from { to matching })
    output += '{'
    i++ // skip opening {
    var depth = 1
    var blockStart = i
    while (i < len && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') {
        depth--
        if (depth === 0) break
      }
      else if (css[i] === '/' && i + 1 < len && css[i + 1] === '*') {
        var ce2 = css.indexOf('*/', i + 2)
        if (ce2 === -1) ce2 = len - 2
        i = ce2 + 2
        continue
      }
      i++
    }
    var blockContent = css.substring(blockStart, i)
    output += blockContent + '}'
    i++ // skip closing }
  }

  return output
}

fs.mkdirSync(path.dirname(OUT_CSS), { recursive: true })
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })

var output = '/* Auto-generated code theme CSS - do not edit manually */\n'
output += '/* Run: node scripts/generate-code-themes.js */\n\n'

Object.keys(THEMES).forEach(function(id) {
  var config = THEMES[id]
  var themePath = path.join(hljsDir, config.file)
  if (!fs.existsSync(themePath)) {
    console.warn('Warning: theme not found: ' + config.file)
    return
  }
  var rawCss = fs.readFileSync(themePath, 'utf-8')
  output += '/* Theme: ' + id + ' (' + config.label + ') */\n'
  output += scopeSelectors(rawCss, id) + '\n'
})

fs.writeFileSync(OUT_CSS, output)

var themesList = Object.keys(THEMES).map(function(id) {
  return {
    id: id,
    label: THEMES[id].label,
    isDefault: id === DEFAULT_THEME
  }
})

fs.writeFileSync(OUT_JSON, JSON.stringify({ themes: themesList, defaultTheme: DEFAULT_THEME }, null, 2))

console.log('Generated ' + Object.keys(THEMES).length + ' code themes')
console.log('  CSS: ' + OUT_CSS)
console.log('  JSON: ' + OUT_JSON)
