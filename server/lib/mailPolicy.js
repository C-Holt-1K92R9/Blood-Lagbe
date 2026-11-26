export function classifySmtpFailure(error) {
  const responseCode = Number(error?.responseCode)
  const text = `${error?.code || ''} ${error?.response || ''} ${error?.message || ''}`.toLowerCase()

  if (
    responseCode === 535 ||
    error?.code === 'EAUTH' ||
    /authentication (?:failed|error)|invalid credentials|username and password not accepted/.test(text)
  ) {
    return { kind: 'credential', cooldownSeconds: 12 * 60 * 60 }
  }
  if (
    [421, 450, 451, 452, 454].includes(responseCode) ||
    /rate.?limit|quota|too many messages|daily limit|temporarily unavailable/.test(text)
  ) {
    const quota = /quota|daily limit|too many messages/.test(text)
    return { kind: 'credential', cooldownSeconds: quota ? 24 * 60 * 60 : 60 * 60 }
  }
  if (responseCode >= 500 && responseCode < 600) return { kind: 'permanent' }
  return { kind: 'retry' }
}

export function backoffSeconds(retryCount) {
  return Math.min(6 * 60 * 60, 60 * 2 ** Math.max(0, retryCount - 1))
}
