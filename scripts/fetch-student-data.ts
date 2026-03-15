/**
 * Fetches student performance data from Firestore for curriculum generation.
 *
 * Usage:
 *   npx tsx scripts/fetch-student-data.ts [--player <name>]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a Firebase
 * service account key JSON file.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// ── Firebase Admin init ──────────────────────────────────────────────

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!credPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS env var is not set.')
  console.error('Point it at your Firebase service account key JSON file.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf-8')) as ServiceAccount
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── Load curriculum data for enrichment ──────────────────────────────

interface Task {
  type: string
  german?: string
  english?: string
  answer?: string
  question?: string
  options?: string[]
  correct?: number
}

interface Lesson { id: string; title: string; tasks: Task[] }
interface Chapter { id: string; title: string; lessons: Lesson[] }
interface Module { id: string; title: string; chapters: Chapter[] }

function loadModules(): Module[] {
  const curriculumDir = join(import.meta.dirname, '..', 'src', 'curriculum')
  const files = readdirSync(curriculumDir).filter(f => f.match(/^module-\d+\.json$/))
  return files.map(f => JSON.parse(readFileSync(join(curriculumDir, f), 'utf-8')) as Module)
}

function getLessonTitle(modules: Module[], lessonId: string): string {
  for (const mod of modules) {
    for (const ch of mod.chapters) {
      for (const ls of ch.lessons) {
        if (ls.id === lessonId) return ls.title
      }
    }
  }
  return lessonId
}

function extractVocabulary(modules: Module[]): string[] {
  const words = new Set<string>()
  for (const mod of modules) {
    for (const ch of mod.chapters) {
      for (const ls of ch.lessons) {
        for (const task of ls.tasks) {
          if (task.german) words.add(task.german)
          if (task.answer) words.add(task.answer)
          if (task.question) words.add(task.question)
        }
      }
    }
  }
  return [...words].sort()
}

// ── XP level helper (mirrors gameStore.ts) ───────────────────────────

const XP_LEVELS = [
  { name: 'Rookie', minXP: 0 },
  { name: 'Ball Boy', minXP: 100 },
  { name: 'Midfielder', minXP: 300 },
  { name: 'Striker', minXP: 600 },
  { name: 'Captain', minXP: 1000 },
  { name: 'Pro Player', minXP: 1500 },
  { name: 'World Class', minXP: 2500 },
  { name: 'Legend', minXP: 4000 },
]

function getLevelName(xp: number): string {
  let name = XP_LEVELS[0].name
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXP) name = lvl.name
  }
  return name
}

// ── Main ─────────────────────────────────────────────────────────────

interface PlayerProfile {
  id: string
  name: string
  xp: number
  completedLessons: Record<string, {
    lessonId: string
    score: number
    stars: number
    xpEarned: number
    completedAt: string
    taskResults?: Array<{
      correct: boolean
      attempts: number
      taskType?: string
      wrongAnswers?: string[]
      expectedAnswer?: string
    }>
  }>
  struggledLessons: string[]
}

async function main() {
  const args = process.argv.slice(2)
  const playerFilter = args.indexOf('--player') !== -1
    ? args[args.indexOf('--player') + 1]?.toLowerCase()
    : null

  const modules = loadModules()
  const vocabulary = extractVocabulary(modules)

  // Read all user documents
  const usersSnap = await db.collection('users').get()
  const reports: unknown[] = []

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data()
    const players: Record<string, PlayerProfile> = data.players ?? {}

    for (const player of Object.values(players)) {
      if (playerFilter && player.name.toLowerCase() !== playerFilter) continue

      const completedLessons = Object.values(player.completedLessons ?? {}).map(lr => ({
        id: lr.lessonId,
        title: getLessonTitle(modules, lr.lessonId),
        score: lr.score,
        stars: lr.stars,
        xpEarned: lr.xpEarned,
        completedAt: lr.completedAt,
        taskResults: lr.taskResults ?? [],
      }))

      reports.push({
        player: player.name,
        totalXP: player.xp,
        level: getLevelName(player.xp),
        completedLessons,
        struggledLessons: player.struggledLessons ?? [],
        vocabularyCovered: vocabulary,
      })
    }
  }

  if (reports.length === 0) {
    console.error(playerFilter
      ? `No player found with name "${playerFilter}".`
      : 'No players found in Firestore.')
    process.exit(1)
  }

  // Output single player directly, or array for multiple
  const output = reports.length === 1 ? reports[0] : reports
  console.log(JSON.stringify(output, null, 2))
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
