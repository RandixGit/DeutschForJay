export interface FunContent {
  type: 'fact' | 'joke' | 'image'
  text?: string
  imageUrl?: string
  source: string
}

const FALLBACK_FACTS: FunContent[] = [
  { type: 'fact', text: 'German is spoken by over 100 million people worldwide!', source: 'fallback' },
  { type: 'fact', text: 'Germany has won the FIFA World Cup 4 times!', source: 'fallback' },
  { type: 'fact', text: 'The word "Kindergarten" is German and literally means "children\'s garden"!', source: 'fallback' },
  { type: 'fact', text: '"Doppelganger" is a German word meaning your look-alike double!', source: 'fallback' },
  { type: 'fact', text: 'Germans love soccer — they call it "Fussball"!', source: 'fallback' },
  { type: 'fact', text: 'Gummy Bears were invented in Germany!', source: 'fallback' },
  { type: 'fact', text: '"Wanderlust" is a German word meaning the desire to travel!', source: 'fallback' },
  { type: 'fact', text: 'The first printed book (Gutenberg Bible) was made in Germany!', source: 'fallback' },
  { type: 'fact', text: '"Angst" is a German word now used in English too!', source: 'fallback' },
  { type: 'fact', text: 'Germany has over 20,000 castles! Many are open to visitors.', source: 'fallback' },
  { type: 'fact', text: 'The longest German word in daily use is "Rechtsschutzversicherungsgesellschaften" (insurance companies)!', source: 'fallback' },
  { type: 'fact', text: 'Berlin is 9x bigger than Paris!', source: 'fallback' },
]

// In-memory cache for pre-fetched content
let prefetchedItem: FunContent | null = null
let prefetchPromise: Promise<FunContent> | null = null

async function fetchFact(): Promise<FunContent> {
  const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
  if (!res.ok) throw new Error('fact API failed')
  const data = await res.json()
  return { type: 'fact', text: data.text, source: 'uselessfacts' }
}

async function fetchJoke(): Promise<FunContent> {
  const res = await fetch('https://official-joke-api.appspot.com/random_joke')
  if (!res.ok) throw new Error('joke API failed')
  const data = await res.json()
  return { type: 'joke', text: `${data.setup}\n${data.punchline}`, source: 'official-joke-api' }
}

async function fetchDogImage(): Promise<FunContent> {
  const res = await fetch('https://dog.ceo/api/breeds/image/random')
  if (!res.ok) throw new Error('dog API failed')
  const data = await res.json()
  return { type: 'image', imageUrl: data.message, text: 'Good dog! Guter Hund!', source: 'dog.ceo' }
}

async function fetchCatImage(): Promise<FunContent> {
  const res = await fetch('https://cataas.com/cat?json=true')
  if (!res.ok) throw new Error('cat API failed')
  const data = await res.json()
  return { type: 'image', imageUrl: `https://cataas.com/cat/${data._id}`, text: 'Cool cat! Coole Katze!', source: 'cataas' }
}

const fetchers = [fetchFact, fetchJoke, fetchDogImage, fetchCatImage]

function getRandomFallback(): FunContent {
  return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)]
}

async function fetchRandom(): Promise<FunContent> {
  const fetcher = fetchers[Math.floor(Math.random() * fetchers.length)]
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const result = await fetcher()
    clearTimeout(timeout)
    return result
  } catch {
    return getRandomFallback()
  }
}

/** Get a fun content item. Returns instantly if pre-fetched, otherwise fetches. */
export async function getFunContent(): Promise<FunContent> {
  if (prefetchedItem) {
    const item = prefetchedItem
    prefetchedItem = null
    // Start pre-fetching the next one
    prefetchNext()
    return item
  }

  if (prefetchPromise) {
    try {
      const item = await prefetchPromise
      prefetchPromise = null
      prefetchNext()
      return item
    } catch {
      prefetchPromise = null
      return getRandomFallback()
    }
  }

  return fetchRandom()
}

/** Pre-fetch the next item in the background. Call this during exercises. */
export function prefetchNext(): void {
  if (prefetchPromise) return
  prefetchPromise = fetchRandom().then((item) => {
    prefetchedItem = item
    prefetchPromise = null
    return item
  }).catch(() => {
    prefetchPromise = null
    return getRandomFallback()
  })
}

/** Get a random fallback fact (sync, for SSR or immediate use). */
export function getRandomFact(): FunContent {
  return getRandomFallback()
}
