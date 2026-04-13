const palette = [
  { backgroundColor: '#eef2ff', color: '#4338ca' }, // indigo
  { backgroundColor: '#eff6ff', color: '#1d4ed8' }, // blue
  { backgroundColor: '#ecfdf5', color: '#047857' }, // emerald
  { backgroundColor: '#faf5ff', color: '#7e22ce' }, // purple
  { backgroundColor: '#fffbeb', color: '#b45309' }, // amber
  { backgroundColor: '#fdf2f8', color: '#be185d' }, // pink
  { backgroundColor: '#ecfeff', color: '#0e7490' }, // cyan
  { backgroundColor: '#fef2f2', color: '#b91c1c' }, // red
  { backgroundColor: '#f0fdfa', color: '#0f766e' }, // teal
  { backgroundColor: '#fff7ed', color: '#c2410c' }, // orange
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getItemColor(name: string) {
  return palette[hashString(name) % palette.length]
}
