import { redirect } from 'next/navigation'

export default function SiteSettingsPage() {
  redirect('/?site-settings=true')
}
