export function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function ordinalStay(n: number) {
  if (n === 1) return '1st stay'
  if (n === 2) return '2nd stay'
  if (n === 3) return '3rd stay'
  return `${n}th stay`
}
