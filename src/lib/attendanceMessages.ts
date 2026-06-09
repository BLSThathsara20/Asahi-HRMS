const UK_TIMEZONE = 'Europe/London'

export interface AttendanceGreeting {
  title: string
  message: string
}

function getUKHourMinute(): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { hour, minute }
}

/** Roughly 11:00–13:30 UK — avoid "Good morning" around lunch. */
function isNearNoon(hour: number, minute: number): boolean {
  const mins = hour * 60 + minute
  return mins >= 11 * 60 && mins < 13 * 60 + 30
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function getSignInGreeting(firstName: string): AttendanceGreeting {
  const { hour, minute } = getUKHourMinute()

  if (hour < 12 && !isNearNoon(hour, minute)) {
    return {
      title: `Good morning, ${firstName}!`,
      message: pick([
        'A fresh start — make today count at Asahi Motors London.',
        'Glad to see you. Let’s have a productive day together.',
        'You’re in — here’s to a great shift ahead.',
        'Welcome back. Your effort makes a real difference here.',
      ]),
    }
  }

  if (isNearNoon(hour, minute)) {
    return {
      title: `Welcome, ${firstName}!`,
      message: pick([
        'Thanks for being here — hope your day is going well.',
        'Good to have you on site. Keep up the great work.',
        'You’re signed in — we appreciate you showing up.',
      ]),
    }
  }

  if (hour < 17) {
    return {
      title: `Good afternoon, ${firstName}!`,
      message: pick([
        'Great to have you here — let’s keep the momentum going.',
        'Thanks for joining us. Every hour you put in counts.',
        'Welcome on site — hope the rest of your day goes smoothly.',
      ]),
    }
  }

  return {
    title: `Good evening, ${firstName}!`,
    message: pick([
      'Thanks for clocking in — we’re glad you’re here.',
      'Welcome on site. Wishing you a steady, safe shift.',
      'Good to see you — your commitment doesn’t go unnoticed.',
    ]),
  }
}

export function getSignOutGreeting(firstName: string): AttendanceGreeting {
  const { hour } = getUKHourMinute()

  if (hour < 17) {
    return {
      title: `Thanks, ${firstName}!`,
      message: pick([
        'We appreciate your effort today — take care on your way home.',
        'Well done today. Rest up and we’ll see you next time.',
        'Thanks for your hard work — you’ve earned a good break.',
        'Your shift is logged. Have a lovely rest of your day.',
      ]),
    }
  }

  return {
    title: `Thanks for today, ${firstName}!`,
    message: pick([
      'You’ve done well — have a peaceful evening and see you soon.',
      'We appreciate everything you gave today. Travel home safely.',
      'Shift complete. Rest up — tomorrow is a new opportunity.',
      'Thank you for being part of the team today. Take care.',
    ]),
  }
}
