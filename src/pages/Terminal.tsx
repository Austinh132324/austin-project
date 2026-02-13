import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { kb } from '../lib/utils/matchResponse'
import '../styles/Terminal.css'

const PAGES: Record<string, string> = {
  home: '/', aboutme: '/aboutme', projects: '/projects',
  games: '/games', tools: '/tools', terminal: '/terminal',
}

const NEOFETCH = `
  \x1b[31m   ___    __  __\x1b[0m   Austin Howell
  \x1b[31m  / _ |  / / / /\x1b[0m   ──────────────
  \x1b[35m / __ | / /_/ /\x1b[0m    Role: Software Engineer
  \x1b[35m/_/ |_| \\____/\x1b[0m     Company: JB Hunt
                      Stack: TypeScript, React, Angular
                      Education: U of A (CS, 4.0 GPA)
                      Terminal: austinshowell.dev
                      Theme: Dark Mode
`.trim()

interface Line {
  text: string
  type: 'input' | 'output' | 'error'
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: "Welcome to Austin's terminal! Type 'help' to get started.", type: 'output' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addOutput = useCallback((text: string, type: 'output' | 'error' = 'output') => {
    setLines(prev => [...prev, { text, type }])
  }, [])

  const execute = useCallback((cmd: string) => {
    const parts = cmd.trim().split(/\s+/)
    const command = parts[0]?.toLowerCase()
    const args = parts.slice(1)

    setLines(prev => [...prev, { text: `$ ${cmd}`, type: 'input' }])
    setHistory(prev => [...prev, cmd])
    setHistoryIdx(-1)

    if (!command) return

    switch (command) {
      case 'help':
        addOutput([
          'Available commands:',
          '  help          Show this help message',
          '  about         Display bio',
          '  skills        List tech stack',
          '  experience    Show work history',
          '  education     Show education',
          '  projects      List projects',
          '  contact       Show contact info',
          '  neofetch      System info card',
          '  ls            List available pages',
          '  cd <page>     Navigate to a page',
          '  cat resume    Display resume summary',
          '  clear         Clear terminal',
          '  echo <text>   Print text',
          '  date          Show current date',
          '  whoami        Display identity',
        ].join('\n'))
        break
      case 'about':
        addOutput(kb.greeting)
        break
      case 'skills':
        addOutput(kb.skills)
        break
      case 'experience':
        addOutput(kb.experience + '\n\n' + kb.jbhunt)
        break
      case 'education':
        addOutput(kb.education)
        break
      case 'projects':
        addOutput(kb.projects)
        break
      case 'contact':
        addOutput(kb.contact)
        break
      case 'neofetch':
        addOutput(NEOFETCH)
        break
      case 'clear':
        setLines([])
        return
      case 'ls':
        addOutput(Object.keys(PAGES).join('  '))
        break
      case 'cd': {
        const target = args[0]?.toLowerCase()
        if (!target) { addOutput('Usage: cd <page>', 'error'); break }
        const path = PAGES[target]
        if (path) { navigate(path) } else { addOutput(`cd: ${target}: No such directory`, 'error') }
        break
      }
      case 'cat':
        if (args[0]?.toLowerCase() === 'resume') {
          addOutput([kb.greeting, '', kb.experience, '', kb.skills, '', kb.education].join('\n'))
        } else {
          addOutput(`cat: ${args[0] || ''}: No such file`, 'error')
        }
        break
      case 'echo':
        addOutput(args.join(' '))
        break
      case 'date':
        addOutput(new Date().toString())
        break
      case 'whoami':
        addOutput('visitor@austinshowell.dev')
        break
      default:
        addOutput(`${command}: command not found. Type 'help' for available commands.`, 'error')
    }
  }, [addOutput, navigate])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIdx = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(newIdx)
        setInput(history[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1
        if (newIdx >= history.length) { setHistoryIdx(-1); setInput('') }
        else { setHistoryIdx(newIdx); setInput(history[newIdx]) }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const cmds = ['help','about','skills','experience','education','projects','contact','neofetch','ls','cd','cat','clear','echo','date','whoami']
      const match = cmds.filter(c => c.startsWith(input.toLowerCase()))
      if (match.length === 1) setInput(match[0])
      else if (match.length > 1) addOutput(match.join('  '))
    }
  }

  return (
    <div className="term-page" onClick={() => inputRef.current?.focus()}>
      <div className="term-window">
        <div className="term-title-bar">
          <div className="term-dots">
            <span className="term-dot red" />
            <span className="term-dot yellow" />
            <span className="term-dot green" />
          </div>
          <span className="term-title">visitor@austinshowell.dev</span>
        </div>
        <div className="term-body">
          {lines.map((line, i) => (
            <div key={i} className={`term-line ${line.type}`}>
              <pre>{line.text}</pre>
            </div>
          ))}
          <div className="term-input-line">
            <span className="term-prompt">$ </span>
            <input
              ref={inputRef}
              type="text"
              className="term-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
