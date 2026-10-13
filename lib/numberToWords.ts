/**
 * Utility to convert numbers into Indian Rupees words representation.
 * Example: 56640 -> "Indian Rupees Fifty-Six Thousand Six Hundred Forty Only"
 */
export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(Number(amount) || 0)
  if (rounded <= 0) return 'Indian Rupees Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n]
    const t = tens[Math.floor(n / 10)]
    const o = ones[n % 10]
    return t + (o ? ' ' + o : '')
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100)
    const rest = n % 100
    let str = ''
    if (hundred > 0) str += ones[hundred] + ' Hundred'
    if (rest > 0) {
      if (str) str += ' '
      str += convertTwoDigits(rest)
    }
    return str
  }

  const crore = Math.floor(rounded / 10000000)
  let remainder = rounded % 10000000
  const lakh = Math.floor(remainder / 100000)
  remainder = remainder % 100000
  const thousand = Math.floor(remainder / 1000)
  const hundred = remainder % 1000

  const parts: string[] = []
  if (crore > 0) parts.push(convertTwoDigits(crore) + ' Crore')
  if (lakh > 0) parts.push(convertTwoDigits(lakh) + ' Lakh')
  if (thousand > 0) parts.push(convertTwoDigits(thousand) + ' Thousand')
  if (hundred > 0) parts.push(convertThreeDigits(hundred))

  const words = parts.join(' ').trim()
  return `Indian Rupees ${words} Only`
}
