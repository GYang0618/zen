export interface ParsedUserAgent {
  browser: string
  os: string
  label: string
  raw: string
}

export function parseUserAgent(ua?: string | null): ParsedUserAgent {
  if (!ua || ua.trim() === '') {
    return { browser: '-', os: '-', label: '-', raw: '' }
  }

  const raw = ua.trim()

  // 解析操作系统
  let os = 'Unknown OS'
  if (/Macintosh|Mac OS X/i.test(raw)) {
    os = 'macOS'
  } else if (/Windows NT 10.0/i.test(raw)) {
    os = 'Windows 10/11'
  } else if (/Windows NT 6.3/i.test(raw)) {
    os = 'Windows 8.1'
  } else if (/Windows NT 6.1/i.test(raw)) {
    os = 'Windows 7'
  } else if (/Windows/i.test(raw)) {
    os = 'Windows'
  } else if (/Android/i.test(raw)) {
    os = 'Android'
  } else if (/iPhone|iPad|iPod/i.test(raw)) {
    os = 'iOS'
  } else if (/Linux/i.test(raw)) {
    os = 'Linux'
  }

  // 解析浏览器或调用客户端
  let browser = 'Unknown'
  const edgMatch = raw.match(/Edg(?:e)?\/(\d+)/i)
  const chromeMatch = raw.match(/Chrome\/(\d+)/i)
  const safariMatch = raw.match(/Version\/(\d+).*Safari/i)
  const firefoxMatch = raw.match(/Firefox\/(\d+)/i)
  const wechatMatch = raw.match(/MicroMessenger\/(\d+)/i)
  const curlMatch = raw.match(/curl\/(\d+)/i)
  const postmanMatch = raw.match(/PostmanRuntime\/(\d+)/i)
  const pythonMatch = raw.match(/python-requests|aiohttp|urllib/i)

  if (wechatMatch) {
    browser = `WeChat ${wechatMatch[1]}`
  } else if (edgMatch) {
    browser = `Edge ${edgMatch[1]}`
  } else if (chromeMatch) {
    browser = `Chrome ${chromeMatch[1]}`
  } else if (safariMatch) {
    browser = `Safari ${safariMatch[1]}`
  } else if (firefoxMatch) {
    browser = `Firefox ${firefoxMatch[1]}`
  } else if (curlMatch) {
    browser = `curl ${curlMatch[1]}`
  } else if (postmanMatch) {
    browser = 'Postman'
  } else if (pythonMatch) {
    browser = 'Python'
  } else if (/Safari/i.test(raw) && !/Chrome/i.test(raw)) {
    browser = 'Safari'
  }

  const label =
    browser !== 'Unknown' && os !== 'Unknown OS'
      ? `${browser} · ${os}`
      : browser !== 'Unknown'
        ? browser
        : os !== 'Unknown OS'
          ? os
          : raw.length > 32
            ? `${raw.slice(0, 32)}...`
            : raw

  return { browser, os, label, raw }
}
