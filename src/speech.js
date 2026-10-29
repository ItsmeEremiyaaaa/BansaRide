// Small helpers for sharing and reading aloud. They use what the phone already has: no accounts, no servers.

// Share text through the phone's share sheet (Messenger, SMS...), or copy it if sharing is not available.
export async function shareText(title, text, say) {
  try {
    if (navigator.share) { await navigator.share({ title, text }); return }
    await navigator.clipboard.writeText(text)
    say?.('Copied. Paste it in a message.')
  } catch (e) { if (e?.name !== 'AbortError') say?.('Could not share.') }
}

// Read something aloud with the phone's own voice. Filipino if the phone has it, otherwise English.
export function speak(text, say) {
  if (!('speechSynthesis' in window)) { say?.('This phone cannot read aloud.'); return }
  const synth = window.speechSynthesis
  if (synth.speaking) { synth.cancel(); return } // tap again to stop
  const u = new SpeechSynthesisUtterance(text)
  const voice = synth.getVoices().find((v) => /^(fil|tl)/i.test(v.lang))
  if (voice) { u.voice = voice; u.lang = voice.lang } else u.lang = 'en-PH'
  u.rate = 0.9
  synth.speak(u)
}
