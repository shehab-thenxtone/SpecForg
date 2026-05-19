import '../style.css'
import { Settings } from './Settings'

export default function Popup() {
  return (
    <div
      className="bg-sf-bg text-sf-text"
      style={{ width: 360, minHeight: 480, padding: 16 }}
    >
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sf-blue font-bold text-base">SpecForge</span>
        </div>
        <span className="text-xs text-zinc-600">Settings</span>
      </header>
      <Settings />
    </div>
  )
}
