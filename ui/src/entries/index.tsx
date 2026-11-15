/**
 * The dashboard page (`ui.entry`): the companion's settings, reminders and
 * memories, the built-in's `/crew-companion` page.
 */
import { useAppApi, useLanguageGeneration } from '@kirocrew/app-sdk'
import CrewCompanionPage from '../CrewCompanionPage'
import { setTransport } from '../host/appFetch'

export default function CrewCompanionRoot() {
  // Set during render so the page's first request already goes through it.
  setTransport(useAppApi())
  useLanguageGeneration()
  return <CrewCompanionPage />
}
