import { useState, useCallback, useRef } from 'react'

const PISTON_API = '/api/execute'
const EXECUTION_TIMEOUT = 15_000 // 15 seconds

/** Maps our language names to Piston-recognized language identifiers. */
const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  go: 'go',
}

interface UseCodeExecutionReturn {
  output: string
  isRunning: boolean
  error: string | null
  runCode: (language: string, code: string) => Promise<void>
}

export function useCodeExecution(): UseCodeExecutionReturn {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runCode = useCallback(async (language: string, code: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort()

    setIsRunning(true)
    setError(null)
    setOutput('')

    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT)

    try {
      const res = await fetch(PISTON_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          language: LANGUAGE_MAP[language] || language,
          version: '*',
          files: [{ content: code }],
        }),
      })

      if (!res.ok) {
        throw new Error(`Execution service error (${res.status})`)
      }

      const data = await res.json()

      // Piston returns { run: { stdout, stderr, code, signal, output }, compile?: { ... } }
      const compileErr = data.compile?.stderr
      const runStdout = data.run?.stdout || ''
      const runStderr = data.run?.stderr || ''

      let result = ''
      if (compileErr) {
        result += `[Compilation Error]\n${compileErr}\n`
      }
      if (runStdout) {
        result += runStdout
      }
      if (runStderr) {
        result += (result ? '\n' : '') + `[stderr]\n${runStderr}`
      }

      setOutput(result || '(no output)')
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Execution timed out (15s limit)')
        setOutput('[Timeout] Code execution exceeded the 15-second limit.')
      } else {
        const msg = err instanceof Error ? err.message : 'Code execution failed'
        setError(msg)
        setOutput(`[Error] ${msg}`)
      }
    } finally {
      clearTimeout(timeoutId)
      setIsRunning(false)
    }
  }, [])

  return { output, isRunning, error, runCode }
}
