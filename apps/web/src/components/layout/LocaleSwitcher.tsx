import { Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localeCookie, localeLabels, locales, type Locale } from '@/lib/i18n'

interface Props {
  locale: Locale
  label: string
}

export function LocaleSwitcher({ locale, label }: Props) {
  function handleChange(nextLocale: string) {
    const maxAge = 60 * 60 * 24 * 365
    document.cookie = `${localeCookie}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
    window.localStorage.setItem(localeCookie, nextLocale)
    window.location.reload()
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger aria-label={label} className="h-10 w-[150px] gap-2">
        <Languages className="size-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((option) => (
          <SelectItem key={option} value={option}>
            {localeLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
