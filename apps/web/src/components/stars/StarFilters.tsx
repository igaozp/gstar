import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  languages: string[]
}

export function StarFilters({ languages }: Props) {
  const [language, setLanguage] = useState<string>('')
  const [analyzed, setAnalyzed] = useState<string>('')

  // Initialize from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setLanguage(params.get('language') ?? '')
    setAnalyzed(params.get('analyzed') ?? '')
  }, [])

  function applyFilters(lang: string, ana: string) {
    const params = new URLSearchParams(window.location.search)
    params.set('page', '1')
    if (lang) params.set('language', lang)
    else params.delete('language')
    if (ana) params.set('analyzed', ana)
    else params.delete('analyzed')
    window.location.search = params.toString()
  }

  function handleLanguage(val: string) {
    const v = val === '__all__' ? '' : val
    setLanguage(v)
    applyFilters(v, analyzed)
  }

  function handleAnalyzed(val: string) {
    const v = val === '__all__' ? '' : val
    setAnalyzed(v)
    applyFilters(language, v)
  }

  function handleReset() {
    setLanguage('')
    setAnalyzed('')
    const params = new URLSearchParams()
    params.set('page', '1')
    window.location.search = params.toString()
  }

  const hasFilters = language || analyzed

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={language || '__all__'} onValueChange={handleLanguage}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All languages</SelectItem>
          {languages.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={analyzed || '__all__'} onValueChange={handleAnalyzed}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Analysis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          <SelectItem value="true">Analyzed</SelectItem>
          <SelectItem value="false">Pending</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
