import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createTranslator, type Locale } from '@/lib/i18n'

interface Props {
  languages: string[]
  locale: Locale
}

export function StarFilters({ languages, locale }: Props) {
  const t = createTranslator(locale)
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
    <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-3 shadow-sm">
      <Select value={language || '__all__'} onValueChange={handleLanguage}>
        <SelectTrigger className="h-10 w-[180px]">
          <SelectValue placeholder={t('filters.language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filters.allLanguages')}</SelectItem>
          {languages.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={analyzed || '__all__'} onValueChange={handleAnalyzed}>
        <SelectTrigger className="h-10 w-[170px]">
          <SelectValue placeholder={t('filters.analysis')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filters.all')}</SelectItem>
          <SelectItem value="true">{t('filters.analyzed')}</SelectItem>
          <SelectItem value="false">{t('filters.pending')}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          {t('filters.clear')}
        </Button>
      )}
    </div>
  )
}
