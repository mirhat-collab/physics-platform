import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { taskQuality, type QualityAnswer } from '@/lib/task-quality'
import { templateIndex } from '@/lib/templates'
import { withLocale, type Template } from '@/lib/templates/helpers'
import type { EntSubject } from '@/lib/ent'

type Sample = { question: string; options: string[]; correct: number; solution: string; figure?: string }

// Пример задания по ключу: шаблон генерируем (по-русски), задачу банка читаем
function templateSample(t: Template): Sample {
  const g = withLocale('ru', () => t.gen(4))
  return { question: g.question, options: g.options, correct: g.correct, solution: g.solution, ...(g.figure ? { figure: g.figure } : {}) }
}

// Отчёт о качестве заданий: жалобы учеников и задания, которые решают
// подозрительно плохо или подозрительно легко
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  const admin = createSupabaseAdmin()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const answers: QualityAnswer[] = []
  for (let from = 0; from < 300000; from += 1000) {
    const { data, error } = await admin.from('answer_log').select('task_key, subject, topic, correct')
      .not('task_key', 'is', null).gte('created_at', since).order('id').range(from, from + 999)
    if (error) {
      // Миграция ещё не применена — отчёт по заданиям пока пустой
      if (/task_key/.test(error.message)) break
      console.error('quality answers:', error)
      return NextResponse.json({ error: 'Не удалось загрузить статистику' }, { status: 500 })
    }
    answers.push(...((data || []) as QualityAnswer[]))
    if (!data || data.length < 1000) break
  }

  const { data: reports, error: repErr } = await admin.from('task_reports')
    .select('id, task_key, subject, topic, reason, comment, payload, locale, status, created_at')
    .order('created_at', { ascending: false }).limit(300)
  if (repErr && !/task_reports/.test(repErr.message)) console.error('quality reports:', repErr)

  const tasks = taskQuality(answers)
  const flagged = tasks.filter(x => x.flags.length).slice(0, 60)

  // Число жалоб по заданию — подсвечиваем в списке
  const reportCount: Record<string, number> = {}
  for (const r of reports || []) if (r.task_key && r.status === 'new') reportCount[r.task_key] = (reportCount[r.task_key] || 0) + 1

  const templates = new Map<string, Template>()
  for (const subject of ['physics', 'math'] as EntSubject[]) for (const x of templateIndex(subject)) templates.set(x.key, x.template)
  const bankIds = flagged.filter(x => x.key.startsWith('b:')).map(x => Number(x.key.slice(2))).filter(Number.isInteger)
  const bank = new Map<number, Sample>()
  if (bankIds.length) {
    const { data } = await admin.from('ent_bank').select('id, question, options, correct, solution').in('id', bankIds)
    for (const b of data || []) bank.set(b.id, { question: b.question, options: b.options, correct: b.correct, solution: b.solution || '' })
  }

  const items = flagged.map(x => {
    let sample: Sample | null = null
    const tpl = templates.get(x.key)
    if (tpl) { try { sample = templateSample(tpl) } catch { sample = null } }
    else if (x.key.startsWith('b:')) sample = bank.get(Number(x.key.slice(2))) ?? null
    return { ...x, sample, source: x.key.startsWith('b:') ? 'bank' : 'template', reports: reportCount[x.key] || 0 }
  })

  return NextResponse.json({
    reports: reports || [],
    tasks: items,
    checked: tasks.length, // сколько заданий набрали достаточно ответов
    answers: answers.length,
  })
}

// Отметить жалобу: исправлено / отклонено / снова новая
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const body = await req.json().catch(() => null)
  const id = Number(body?.id), status = String(body?.status)
  if (!Number.isInteger(id) || !['new', 'fixed', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 })
  }
  const { error } = await createSupabaseAdmin().from('task_reports').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Не удалось сохранить' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
