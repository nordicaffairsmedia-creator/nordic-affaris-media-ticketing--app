import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchChat, fetchMembers, postJoin, sendChat, type ChatMessage } from '../lib/api'
import { getVisitor } from '../lib/storage'
import { Notice } from './ui'

type Kind = 'community' | 'organisation'

/** Everyone who signed up in the app can see who joined (first names only). */
export function MembersPanel({ kind, slug, name, joined }: { kind: Kind; slug: string; name: string; joined: boolean }) {
  const [data, setData] = useState<{ count: number; members: string[] } | null | undefined>(undefined)
  useEffect(() => {
    const email = getVisitor()?.email
    if (!email) return setData(null)
    let stop = false
    setData(undefined)
    const v = getVisitor()
    ;(async () => {
      // re-send the join (harmless if already saved) so people who joined before this feature also appear
      if (joined && v) await postJoin({ slug, name, kind }, { name: v.name, email: v.email })
      const r = await fetchMembers(kind, slug, email)
      if (!stop) setData(r)
    })()
    return () => {
      stop = true
    }
  }, [kind, slug, name, joined])

  if (data === undefined) return <p className="px-gutter pt-space-lg font-body-md text-body-md text-on-surface-variant">Loading…</p>
  if (data === null)
    return (
      <div className="px-gutter pt-space-lg">
        <Notice icon="groups" title="Members could not be loaded">Please check your connection and try again.</Notice>
      </div>
    )
  if (!data.count)
    return (
      <div className="px-gutter pt-space-lg">
        <Notice icon="groups" title="No members yet">Be the first to join.</Notice>
      </div>
    )
  // my own name first, marked "(you)"
  const mine = (getVisitor()?.name ?? '').trim().split(/\s+/)[0] ?? ''
  const at = joined && mine ? data.members.findIndex((m) => m.toLowerCase() === mine.toLowerCase()) : -1
  const rows = joined && mine ? [mine, ...data.members.filter((_, i) => i !== at)] : data.members
  const count = joined && mine && at < 0 ? data.count + 1 : data.count
  return (
    <section className="px-gutter pt-space-lg">
      <h2 className="pb-space-sm font-headline-md text-headline-md text-on-surface">
        {count} {count === 1 ? 'member' : 'members'}
      </h2>
      <ul className="flex flex-col gap-space-xs">
        {rows.map((m, i) => (
          <li key={`${m}-${i}`} className="flex items-center gap-space-sm rounded-xl bg-surface-container px-space-sm py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 font-label-lg text-label-lg text-primary">{m.charAt(0).toUpperCase()}</span>
            <span className="font-body-md text-body-md text-on-surface">
              {m}
              {joined && mine && i === 0 ? <span className="text-primary"> (you)</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const time = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** The group chat of one community: members only, refreshes every few seconds. */
export function ChatPanel({ kind, slug, joined }: { kind: Kind; slug: string; joined: boolean }) {
  const email = getVisitor()?.email ?? ''
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const last = useRef('')

  useEffect(() => {
    if (!joined || !email) return
    let stop = false
    const load = async () => {
      const r = await fetchChat(kind, slug, email)
      if (!stop && r) setMsgs(r)
    }
    void load()
    const t = setInterval(() => {
      if (!document.hidden) void load()
    }, 4000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [joined, kind, slug, email])

  useEffect(() => {
    const id = msgs[msgs.length - 1]?.id ?? ''
    if (id !== last.current && box.current) box.current.scrollTop = box.current.scrollHeight
    last.current = id
  }, [msgs])

  if (!joined)
    return (
      <div className="px-gutter pt-space-lg">
        <Notice icon="chat" title="Join to chat">Tap Join above to read and write in the group chat.</Notice>
      </div>
    )

  async function send(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || busy) return
    setBusy(true)
    setErr('')
    const r = await sendChat(kind, slug, email, t)
    setBusy(false)
    if (r === 'ok') {
      setText('')
      const m = await fetchChat(kind, slug, email)
      if (m) setMsgs(m)
    } else setErr(r === 'slow' ? 'Please wait a moment before sending again.' : 'Message not sent. Please try again.')
  }

  return (
    <section className="px-gutter pt-space-md">
      <div ref={box} className="flex h-[48vh] flex-col gap-2 overflow-y-auto rounded-2xl bg-surface-container-low p-space-sm" aria-live="polite">
        {msgs.length === 0 ? (
          <p className="m-auto text-center font-body-sm text-body-sm text-on-surface-variant">No messages yet. Say hello!</p>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`max-w-[82%] rounded-2xl px-3 py-2 ${m.mine ? 'self-end bg-primary text-on-primary' : 'self-start bg-surface-container text-on-surface'}`}>
              {!m.mine ? <p className="font-label-sm text-label-sm text-secondary">{m.name}</p> : null}
              <p className="whitespace-pre-wrap break-words font-body-md text-body-md">{m.text}</p>
              <p className={`text-right font-label-sm text-label-sm ${m.mine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{time(m.at)}</p>
            </div>
          ))
        )}
      </div>
      {err ? <p role="alert" className="pt-1 font-body-sm text-body-sm text-error">{err}</p> : null}
      <form onSubmit={send} className="flex gap-space-xs pt-space-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Write a message"
          className="h-12 min-w-0 flex-1 rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70"
        />
        <button type="submit" disabled={busy || !text.trim()} className="h-12 rounded-lg bg-primary px-5 font-label-lg text-label-lg text-on-primary active:scale-95 disabled:opacity-50">
          Send
        </button>
      </form>
    </section>
  )
}
