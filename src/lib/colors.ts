const palette = [
  { backgroundColor: '#3cffd0', color: '#000000' }, // mint
  { backgroundColor: '#5200ff', color: '#ffffff' }, // ultraviolet
  { backgroundColor: '#e8ff00', color: '#000000' }, // yellow
  { backgroundColor: '#ff3366', color: '#ffffff' }, // pink
  { backgroundColor: '#ff6b00', color: '#000000' }, // orange
  { backgroundColor: '#0099ff', color: '#ffffff' }, // electric blue
  { backgroundColor: '#3cffd0', color: '#000000' }, // mint
  { backgroundColor: '#5200ff', color: '#ffffff' }, // ultraviolet
  { backgroundColor: '#e8ff00', color: '#000000' }, // yellow
  { backgroundColor: '#ff3366', color: '#ffffff' }, // pink
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
