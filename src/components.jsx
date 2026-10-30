import { createContext, useContext, useEffect, useState } from 'react'
import { shortName, vehicleLabel, fareText, standNow } from './data'
import { useLook } from './mood'

export const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/* One hidden SVG holds the shared drawings (tricycle and folk pattern) so screens can reuse them. */
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="cabin"><path d="M98 80 H262 V212 H74 V160 Z" /></clipPath>
        <clipPath id="cab2"><path d="M262 80 L318 76 L342 172 V212 H262 Z" /></clipPath>
        <pattern id="folk" width="40" height="10" patternUnits="userSpaceOnUse">
          <polygon points="0,10 10,0 20,10" fill="#E5322D" />
          <polygon points="20,10 30,0 40,10" fill="#1F7A8C" />
        </pattern>
      </defs>
      <symbol id="trike" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <g transform="translate(26 74)">
            <path d="M26 0 C 48 22 54 62 26 100 C -2 62 4 22 26 0 Z" fill="#E5322D" />
            <path d="M8 34 L26 50 L44 34 M8 56 L26 72 L44 56" fill="none" stroke="#fff" strokeWidth="6" />
            <path d="M12 18 L26 30 L40 18" fill="none" stroke="#1F7A8C" strokeWidth="5" />
          </g>
          <circle cx="120" cy="234" r="52" fill="#111" />
          <circle cx="120" cy="234" r="44" fill="#fff" stroke="none" />
          <circle cx="120" cy="234" r="28" fill="none" stroke="#E5322D" strokeWidth="30" strokeDasharray="10.99 10.99" />
          <circle cx="120" cy="234" r="28" fill="none" stroke="#F4B400" strokeWidth="30" strokeDasharray="10.99 10.99" strokeDashoffset="10.99" />
          <circle cx="120" cy="234" r="14" fill="#F4B400" />
          <circle cx="120" cy="234" r="5" fill="#fff" strokeWidth="3" />
          <circle cx="338" cy="238" r="40" fill="#111" />
          <circle cx="338" cy="238" r="32" fill="#fff" stroke="none" />
          <circle cx="338" cy="238" r="19" fill="none" stroke="#F4B400" strokeWidth="12" strokeDasharray="7 7.1" />
          <circle cx="338" cy="238" r="10" fill="#1F7A8C" strokeWidth="3" />
          <g clipPath="url(#cabin)" stroke="none">
            <rect x="70" y="76" width="200" height="136" style={{ fill: 'var(--vc, #F4B400)' }} />
            <circle cx="160" cy="118" r="30" fill="#E5322D" /><circle cx="160" cy="118" r="22" fill="#F4B400" />
            <circle cx="160" cy="118" r="14" fill="#E5322D" /><circle cx="160" cy="118" r="6" fill="#F4B400" />
            <polygon points="98,80 114,80 106,96" fill="#1F7A8C" /><polygon points="114,80 130,80 122,96" fill="#E5322D" />
            <polygon points="130,80 146,80 138,96" fill="#1F7A8C" /><polygon points="178,80 194,80 186,96" fill="#E5322D" />
            <polygon points="194,80 210,80 202,96" fill="#1F7A8C" />
            <rect x="70" y="150" width="200" height="18" fill="#E5322D" /><rect x="70" y="168" width="200" height="16" fill="#7FB8C9" />
            <rect x="70" y="184" width="200" height="14" fill="#F4B400" /><rect x="70" y="198" width="200" height="14" fill="#1F7A8C" />
            <polygon points="90,198 104,212 118,198" fill="#fff" /><polygon points="130,198 144,212 158,198" fill="#fff" /><polygon points="170,198 184,212 198,198" fill="#fff" />
          </g>
          <rect x="206" y="84" width="42" height="124" fill="#fff" />
          <path d="M206 168 H250" stroke="#1F7A8C" strokeWidth="9" fill="none" />
          <g clipPath="url(#cab2)" stroke="none"><rect x="262" y="70" width="90" height="150" style={{ fill: 'var(--vc, #E5322D)' }} /><rect x="262" y="190" width="90" height="22" fill="#1F7A8C" /></g>
          <polygon points="296,112 314,142 296,172 278,142" fill="#F4B400" strokeWidth="4" />
          <path d="M68 210 Q120 156 172 210 L158 214 Q120 182 84 216 Z" fill="#1F7A8C" />
          <path d="M298 224 Q338 188 380 224 L368 226 Q338 202 310 226 Z" fill="#1F7A8C" />
          <path d="M352 178 L340 238" strokeWidth="7" fill="none" />
          <rect x="346" y="150" width="26" height="28" rx="7" fill="#fff" /><rect x="354" y="130" width="10" height="16" rx="3" fill="#1F7A8C" />
          <path d="M66 62 Q66 50 82 50 L336 42 Q352 42 352 54 Q352 64 336 64 L88 72 Q66 72 66 62 Z" fill="#fff" />
          <path d="M96 58 H320" stroke="#1F7A8C" strokeWidth="4" fill="none" />
        </g>
      </symbol>
      <symbol id="moto" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="92" cy="226" r="48" fill="#111" /><circle cx="92" cy="226" r="40" fill="#fff" stroke="none" />
          <circle cx="92" cy="226" r="24" fill="none" stroke="#E5322D" strokeWidth="24" strokeDasharray="9.4 9.4" />
          <circle cx="92" cy="226" r="24" fill="none" stroke="#F4B400" strokeWidth="24" strokeDasharray="9.4 9.4" strokeDashoffset="9.4" />
          <circle cx="92" cy="226" r="11" fill="#1F7A8C" strokeWidth="3" />
          <circle cx="334" cy="226" r="48" fill="#111" /><circle cx="334" cy="226" r="40" fill="#fff" stroke="none" />
          <circle cx="334" cy="226" r="24" fill="none" stroke="#E5322D" strokeWidth="24" strokeDasharray="9.4 9.4" />
          <circle cx="334" cy="226" r="24" fill="none" stroke="#F4B400" strokeWidth="24" strokeDasharray="9.4 9.4" strokeDashoffset="9.4" />
          <circle cx="334" cy="226" r="11" fill="#1F7A8C" strokeWidth="3" />
          <path d="M334 226 L302 150 L276 112" fill="none" strokeWidth="9" />
          <path d="M302 150 L318 108 H350" fill="none" strokeWidth="8" />
          <rect x="336" y="92" width="32" height="22" rx="8" fill="#F4B400" />
          <circle cx="368" cy="112" r="11" fill="#fff" />
          <path d="M92 226 L150 168 H238 L270 226" style={{ fill: 'var(--vc, #E5322D)' }} />
          <path d="M150 168 L120 118 H214 L238 168 Z" fill="#F4B400" />
          <polygon points="136,128 150,128 143,142" fill="#1F7A8C" /><polygon points="150,128 164,128 157,142" fill="#E5322D" /><polygon points="164,128 178,128 171,142" fill="#1F7A8C" />
          <rect x="158" y="176" width="86" height="26" rx="8" fill="#1F7A8C" />
          <path d="M238 168 H286 Q300 168 296 180 L282 202 H244 Z" fill="#fff" />
          <path d="M120 118 H286 Q296 118 296 128 Q296 138 286 138 H128 Q114 138 120 118 Z" fill="#fff" />
          <path d="M60 110 Q60 92 80 92 H132 Q150 92 150 110 V122 H60 Z" fill="#E5322D" />
          <path d="M44 232 Q74 206 106 224" fill="none" stroke="#1F7A8C" strokeWidth="7" />
          <g transform="translate(40 40)">
            <path d="M20 40 Q10 4 52 6 Q96 4 84 40 Q92 70 52 74 Q12 70 20 40 Z" fill="#F2D49B" />
            <path d="M36 12 Q52 24 68 12" fill="none" strokeWidth="5" />
            <path d="M16 46 H88" stroke="#E5322D" strokeWidth="8" fill="none" />
            <path d="M16 46 H88" stroke="#fff" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
            <rect x="34" y="22" width="36" height="16" rx="4" fill="#fff" strokeWidth="3" /><path d="M40 30 H64" stroke="#1F7A8C" strokeWidth="4" fill="none" />
          </g>
          <path d="M122 120 L88 108 M122 128 L88 138" fill="none" strokeWidth="6" />
        </g>
      </symbol>
      <symbol id="bus" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="24" y="52" width="372" height="170" rx="26" style={{ fill: 'var(--vc, #F4B400)' }} />
          <rect x="24" y="150" width="372" height="26" fill="#E5322D" /><rect x="24" y="176" width="372" height="18" fill="#1F7A8C" />
          <path d="M24 194 H396 V196 Q396 222 370 222 H50 Q24 222 24 196 Z" fill="#fff" />
          <rect x="46" y="74" width="52" height="62" rx="6" fill="#bfe3ee" /><rect x="108" y="74" width="52" height="62" rx="6" fill="#bfe3ee" /><rect x="170" y="74" width="52" height="62" rx="6" fill="#bfe3ee" /><rect x="232" y="74" width="52" height="62" rx="6" fill="#bfe3ee" /><rect x="294" y="74" width="52" height="62" rx="6" fill="#bfe3ee" />
          <path d="M338 70 H372 Q384 70 384 84 V136 H338 Z" fill="#bfe3ee" />
          <polygon points="46,58 62,58 54,70" fill="#E5322D" /><polygon points="62,58 78,58 70,70" fill="#1F7A8C" /><polygon points="78,58 94,58 86,70" fill="#E5322D" />
          <rect x="130" y="34" width="150" height="26" rx="8" fill="#fff" /><path d="M146 47 H264" stroke="#E5322D" strokeWidth="6" fill="none" />
          <rect x="378" y="190" width="22" height="14" rx="5" fill="#fff" />
          <circle cx="110" cy="228" r="36" fill="#111" /><circle cx="110" cy="228" r="29" fill="#fff" stroke="none" /><circle cx="110" cy="228" r="17" fill="none" stroke="#E5322D" strokeWidth="14" strokeDasharray="8.9 8.9" /><circle cx="110" cy="228" r="17" fill="none" stroke="#F4B400" strokeWidth="14" strokeDasharray="8.9 8.9" strokeDashoffset="8.9" /><circle cx="110" cy="228" r="8" fill="#1F7A8C" strokeWidth="3" /><circle cx="310" cy="228" r="36" fill="#111" /><circle cx="310" cy="228" r="29" fill="#fff" stroke="none" /><circle cx="310" cy="228" r="17" fill="none" stroke="#E5322D" strokeWidth="14" strokeDasharray="8.9 8.9" /><circle cx="310" cy="228" r="17" fill="none" stroke="#F4B400" strokeWidth="14" strokeDasharray="8.9 8.9" strokeDashoffset="8.9" /><circle cx="310" cy="228" r="8" fill="#1F7A8C" strokeWidth="3" />
        </g>
      </symbol>
      <symbol id="van" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M26 206 V92 Q26 66 52 66 H262 Q286 66 300 88 L352 150 Q384 156 394 176 V206 Z" style={{ fill: 'var(--vc, #E5322D)' }} />
          <path d="M26 150 H394 V176 H26 Z" fill="#F4B400" /><path d="M26 176 H394 V192 H26 Z" fill="#1F7A8C" />
          <rect x="46" y="84" width="62" height="52" rx="6" fill="#bfe3ee" /><rect x="118" y="84" width="62" height="52" rx="6" fill="#bfe3ee" /><rect x="190" y="84" width="62" height="52" rx="6" fill="#bfe3ee" />
          <path d="M262 84 H284 L332 140 H262 Z" fill="#bfe3ee" />
          <polygon points="46,70 62,70 54,82" fill="#fff" /><polygon points="62,70 78,70 70,82" fill="#F4B400" /><polygon points="78,70 94,70 86,82" fill="#fff" />
          <rect x="376" y="168" width="22" height="16" rx="5" fill="#fff" />
          <path d="M26 192 H394 V198 Q394 214 378 214 H42 Q26 214 26 198 Z" fill="#fff" />
          <circle cx="110" cy="220" r="36" fill="#111" /><circle cx="110" cy="220" r="29" fill="#fff" stroke="none" /><circle cx="110" cy="220" r="17" fill="none" stroke="#E5322D" strokeWidth="14" strokeDasharray="8.9 8.9" /><circle cx="110" cy="220" r="17" fill="none" stroke="#F4B400" strokeWidth="14" strokeDasharray="8.9 8.9" strokeDashoffset="8.9" /><circle cx="110" cy="220" r="8" fill="#1F7A8C" strokeWidth="3" /><circle cx="310" cy="220" r="36" fill="#111" /><circle cx="310" cy="220" r="29" fill="#fff" stroke="none" /><circle cx="310" cy="220" r="17" fill="none" stroke="#E5322D" strokeWidth="14" strokeDasharray="8.9 8.9" /><circle cx="310" cy="220" r="17" fill="none" stroke="#F4B400" strokeWidth="14" strokeDasharray="8.9 8.9" strokeDashoffset="8.9" /><circle cx="310" cy="220" r="8" fill="#1F7A8C" strokeWidth="3" />
        </g>
      </symbol>
      <symbol id="i-barangay" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="50" y="238" width="320" height="20" rx="10" fill="#7FB8C9" />
          <path d="M338 36 V150" fill="none" strokeWidth="6" />
          <path d="M338 40 H392 L376 60 L392 80 H338 Z" fill="#E5322D" />
          <rect x="92" y="142" width="236" height="98" fill="#F4B400" />
          <path d="M66 148 L210 60 L354 148 Z" fill="#E5322D" />
          <polygon points="120,134 140,134 130,148" fill="#fff" /><polygon points="150,126 170,126 160,140" fill="#1F7A8C" /><polygon points="250,126 270,126 260,140" fill="#fff" /><polygon points="280,134 300,134 290,148" fill="#1F7A8C" />
          <rect x="146" y="116" width="128" height="24" rx="6" fill="#fff" /><path d="M162 128 H258" stroke="#E5322D" strokeWidth="6" fill="none" />
          <rect x="186" y="178" width="48" height="62" rx="6" fill="#1F7A8C" />
          <rect x="112" y="166" width="42" height="38" rx="5" fill="#bfe3ee" /><rect x="266" y="166" width="42" height="38" rx="5" fill="#bfe3ee" />
          <path d="M112 185 H154 M133 166 V204" stroke="#111" strokeWidth="4" fill="none" /><path d="M266 185 H308 M287 166 V204" stroke="#111" strokeWidth="4" fill="none" />
        </g>
      </symbol>
      <symbol id="i-sitio" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="340" cy="62" r="26" fill="#FFD24A" />
          <path d="M30 240 L158 66 L286 240 Z" fill="#4CAE74" />
          <path d="M158 66 L132 102 L150 96 L162 112 L176 96 L190 102 Z" fill="#fff" />
          <path d="M200 240 L296 118 L392 240 Z" fill="#6CC28A" />
          <rect x="30" y="238" width="360" height="20" rx="10" fill="#F2D49B" />
          <rect x="132" y="196" width="76" height="44" fill="#F2D49B" />
          <path d="M118 204 L170 154 L222 204 Z" fill="#F4B400" />
          <rect x="160" y="212" width="20" height="28" rx="3" fill="#7a5a2b" />
          <rect x="316" y="204" width="14" height="38" fill="#7a5a2b" />
          <circle cx="323" cy="190" r="28" fill="#3f9a52" /><circle cx="312" cy="180" r="8" fill="#fff" fillOpacity=".3" stroke="none" />
        </g>
      </symbol>
      <symbol id="i-place" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="210" cy="262" rx="84" ry="13" fill="#111" fillOpacity=".22" stroke="none" />
          <path d="M210 28 C146 28 108 76 108 128 C108 196 210 258 210 258 C210 258 312 196 312 128 C312 76 274 28 210 28 Z" fill="#E5322D" />
          <circle cx="210" cy="126" r="48" fill="#fff" />
          <path d="M210 98 L219 118 L241 121 L225 136 L229 158 L210 147 L191 158 L195 136 L179 121 L201 118 Z" fill="#F4B400" />
          <path d="M146 58 Q164 40 190 36" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="9" />
        </g>
      </symbol>
      <symbol id="i-street" viewBox="0 0 420 290">
        <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M96 266 L168 168 H252 L324 266 Z" fill="#475467" />
          <path d="M210 256 V238 M210 220 V204 M210 188 V176" fill="none" stroke="#fff" strokeWidth="9" />
          <rect x="198" y="100" width="24" height="70" fill="#F4B400" />
          <rect x="52" y="30" width="316" height="76" rx="12" fill="#1F7A8C" />
          <rect x="64" y="42" width="292" height="52" rx="7" fill="none" stroke="#fff" strokeWidth="4" />
          <path d="M92 68 H214" stroke="#fff" strokeWidth="11" fill="none" />
          <path d="M252 68 H322 M300 52 L322 68 L300 84" stroke="#F4B400" strokeWidth="9" fill="none" />
        </g>
      </symbol>
    </svg>
  )
}

const art = (id, label, mode) => ({ className, width = 128, height = 88 }) => (
  <svg className={(mode ? mode + ' ' : '') + (className ?? '')} viewBox="0 0 420 290" width={width} height={height} role="img" aria-label={label}><use href={'#' + id} /></svg>
)
export const Bus = art('bus', 'BansaRide bus', 'm-bus')
export const Van = art('van', 'BansaRide van', 'm-van')

export const Trike = ({ className, width = 128, height = 88 }) => (
  <svg className={'m-vehicle ' + (className ?? '')} viewBox="0 0 420 290" width={width} height={height} role="img" aria-label="BansaRide tricycle"><use href="#trike" /></svg>
)

export const Moto = ({ className, width = 128, height = 88 }) => (
  <svg className={'m-moto ' + (className ?? '')} viewBox="0 0 420 290" width={width} height={height} role="img" aria-label="Farm motorcycle with a load"><use href="#moto" /></svg>
)

export const FolkStrip = () => (
  <svg className="folk" width="100%" height="10" aria-hidden="true"><rect width="100%" height="10" fill="url(#folk)" /></svg>
)

const ICONS = {
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  star: <><path className="duo" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></>,
  home: <><path className="duo" d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  routes: <><circle className="duo" cx="6" cy="18" r="3.2" /><circle className="duo" cx="18" cy="6" r="3.2" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M6 15.5c0-6 12-3 12-7.5" strokeDasharray="1 3.2" /></>,
  map: <><path className="duo" d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  pin: <><path className="duo" d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  calc: <><rect className="duo" x="5" y="3" width="14" height="18" rx="2.5" /><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8 7h8" /><path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" strokeWidth="2.6" /></>,
  swap: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
  flag: <><path className="duo" d="M5 4h11l-2 4 2 4H5z" /><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></>,
  clock: <><circle className="duo" cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  ruler: <><path className="duo" d="M3 17 17 3l4 4L7 21z" /><path d="M3 17 17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  locate: <><circle className="duo" cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  alert: <><path className="duo" d="M12 3l10 18H2z" /><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  info: <><circle className="duo" cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  town: <><path className="duo" d="M5 21V8l7-4 7 4v13z" /><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M9 21v-6h6v6" /></>,
  vehicle: <><path d="M3 15V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /><path d="M2 15h15M15 10h3.5l2 5" /><circle cx="6" cy="18" r="2" /><circle cx="19" cy="18" r="2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  wifioff: <path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.2-2.1M19 12.9a10 10 0 0 0-5-2.7M12 20h.01" />,
  wifi: <path d="M5 12.9a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0M12 20h.01" />,
  drivers: <><circle className="duo" cx="9" cy="8" r="3.2" /><circle className="duo" cx="17" cy="9" r="2.5" /><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c3 0 5 2 5 5" /></>,
  phone: <><path className="duo" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
  moto: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l3-6h5l4 6M9 11 8 8H6M14 11l1-4h3" /></>,
  road: <path d="M8 3 5 21M16 3l3 18M12 4v3M12 10v4M12 17v3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle className="duo" cx="11" cy="11" r="7" /><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  repeat: <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  minus: <path d="M5 12h14" />,
}

const ICON_ART = {"vehicle":"trike","moto":"moto","bus":"bus","van":"van","barangay":"i-barangay","sitio":"i-sitio","place":"i-place","street":"i-street"}
export const Icon = ({ name, filled, className }) =>
  ICON_ART[name] ? (
    <svg className={'ico-art m-' + name + ' ' + (className ?? '')} viewBox="0 0 420 290" aria-hidden="true"><use href={'#' + ICON_ART[name]} /></svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" style={filled ? { fill: '#F4B400', stroke: '#B7791F' } : undefined}>{ICONS[name]}</svg>
  )

export const BackButton = ({ to, params }) => {
  const { back } = useApp()
  return (
    <button className="icon-btn" aria-label="Back" onClick={() => back(to, params)}><Icon name="back" /></button>
  )
}

// Counts a number up from 0 (skipped when the phone asks for less motion).
export function CountUp({ value }) {
  const calm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(0)
  useEffect(() => {
    if (calm) return
    let raf, start
    const tick = (t) => {
      start ??= t
      const p = Math.min(1, (t - start) / 650)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, calm])
  return <>{calm ? value : n}</>
}

// Whether drivers are around right now at a stand (by Bansalan time). Re-checks every minute.
const NOW_LABEL = { open: 'Drivers around', few: 'A few around', closed: 'Closed now', unknown: 'Hours not confirmed' }
export function StandPill({ s, now }) {
  useLook() // re-draws as the clock moves
  const n = now ?? standNow(s)
  return <span className={'stand-pill ' + n.state} title={n.label}><i aria-hidden="true" />{NOW_LABEL[n.state]}</span>
}
// A clear "closed" notice with the reason, when it opens again, and the nearest stand that has drivers.
export function ClosedNotice({ now, near, onNear }) {
  if (!now || now.state !== 'closed') return null
  return (
    <div className="closed-notice" role="status">
      <b>Closed now</b>
      <span>{now.label}{now.back ? '. Back at ' + now.back : ''}</span>
      {near && <button className="closed-near" onClick={onNear}>Nearest with drivers: {near.station.name} · {near.meters} m<Icon name="chevron" className="chev" /></button>}
    </div>
  )
}
// How sure we are about a waiting spot or group.
export const StatusTag = ({ status }) => (status === 'confirmed' ? <Tag tone="green">Confirmed</Tag> : status === 'reported' ? <Tag tone="gold">Reported by riders</Tag> : <Tag>To confirm</Tag>)
export const Tag = ({ children, tone = 'amber' }) => <span className={`tag ${tone}`}>{children}</span>

export function RouteRow({ route, onOpen, isSaved, index = 0 }) {
  const moto = route.vehicle === 'Motor'
  return (
    <button className="row-item line rise" style={{ '--i': index }} onClick={() => onOpen(route.id)}>
      {moto ? <span className="badge-line moto"><Moto width={34} height={24} /></span> : <span className="badge-line trike"><Trike width={34} height={24} /></span>}
      <span className="row-main">
        <span className="row-title">{shortName(route.to)}</span>
        <span className="row-sub">from {shortName(route.from)} · {route.km} km · {vehicleLabel(route.vehicle)}</span>
      </span>
      {isSaved && <Icon name="star" filled className="saved-star" />}
      <span className="row-right">
        {route.fare === null ? <Tag>Ask driver</Tag> : <b className="price">{fareText(route)}</b>}
        <span className="eta">~{route.minutes} min</span>
      </span>
    </button>
  )
}

// Yellow rounded header sheet used at the top of list screens (title, optional back button, search field).
export function YHeader({ title, back, children }) {
  const { t } = useApp()
  return (
    <header className="yhead">
      <div className="yhead-top">
        <span className="yhead-side">{back}</span>
        <h1>{t(title)}</h1>
        <span className="yhead-side" />
      </div>
      {children}
    </header>
  )
}
