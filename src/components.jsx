import { createContext, useContext, useEffect, useState } from 'react'
import { shortName, vehicleLabel, fareText, standNow, motorPossible } from './data'
import { useLook } from './mood'

export const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/* One hidden SVG holds the shared drawings (tricycle and folk pattern) so screens can reuse them. */
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="folk" width="40" height="10" patternUnits="userSpaceOnUse">
          <polygon points="0,10 10,0 20,10" fill="#E5322D" />
          <polygon points="20,10 30,0 40,10" fill="#1F7A8C" />
        </pattern>
      </defs>
      <symbol id="trike" viewBox="0 0 420 290">
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M228 158 H300 L306 218 H228 Z" fill="#2a2d34"/>
          <path d="M238 150 Q264 134 292 150 V164 H238 Z" fill="#111"/>
          <path d="M248 156 H284" stroke="#fff" strokeWidth="3" fill="none"/>
          <path d="M354 238 L344 142" strokeWidth="8" fill="none"/>
          <path d="M266 138 L324 130 L338 148 L328 220 L266 220 Z" fill="#2F8FD8"/>
          <path d="M38 116 Q38 106 50 106 H252 V216 H38 Z" style={{ fill: 'var(--vc, #FFFFFF)' }}/>
          <path d="M38 180 H252" fill="none" strokeWidth="3"/>
          <rect x="29" y="152" width="9" height="16" rx="3" fill="#E5322D" strokeWidth="3"/>
          <path d="M60 124 H176 Q190 124 190 138 V172 H60 Z" fill="#1f3b52"/>
          <path d="M60 158 H190" stroke="#2F8FD8" strokeWidth="13" strokeLinecap="butt" fill="none"/>
          <rect x="204" y="128" width="32" height="44" rx="16" fill="#1f3b52"/>
          <path d="M294 102 L342 96 L358 132 L322 138 Z" fill="#d6ecf9"/>
          <path d="M332 140 L352 126" strokeWidth="7" fill="none"/>
          <circle cx="354" cy="124" r="6" fill="#2a2d34" strokeWidth="3"/>
          <circle cx="358" cy="160" r="11" fill="#fff"/>
          <path d="M30 98 Q30 82 52 80 L338 68 Q364 66 366 82 V90 Q366 98 354 98 L56 110 Q30 112 30 98 Z" fill="#2a2d34"/>
          <path d="M56 93 L338 80 M56 101 L338 88" stroke="#4b5160" strokeWidth="3" fill="none"/>
          <path d="M338 68 L364 60 L378 76 L366 88 Z" fill="#5BB8E8"/>
          <path d="M72 218 Q72 178 122 178 Q172 178 172 218 Z" fill="#2a2d34"/>
          <circle cx="122" cy="236" r="40" fill="#111"/>
          <circle cx="122" cy="236" r="31" fill="#e4e7ec" stroke="none"/>
          <path d="M122 236 L151.0 236.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L142.5 256.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L122.0 265.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L101.5 256.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L93.0 236.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L101.5 215.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L122.0 207.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M122 236 L142.5 215.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="122" cy="236" r="8" fill="#E5322D" strokeWidth="3"/>
          <circle cx="352" cy="238" r="40" fill="#111"/>
          <circle cx="352" cy="238" r="31" fill="#e4e7ec" stroke="none"/>
          <path d="M352 238 L381.0 238.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L372.5 258.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L352.0 267.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L331.5 258.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L323.0 238.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L331.5 217.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L352.0 209.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M352 238 L372.5 217.5" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="352" cy="238" r="8" fill="#98a2b3" strokeWidth="3"/>
          <path d="M318 220 Q352 182 386 220" fill="none" stroke="#2a2d34" strokeWidth="9"/>
          </g>
      </symbol>
      <symbol id="moto" viewBox="0 0 420 290">
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="96" cy="226" r="48" fill="#111"/>
          <circle cx="96" cy="226" r="40" fill="#e4e7ec" stroke="none"/>
          <path d="M96 226 L134.0 226.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L130.2 242.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L119.7 255.7" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L104.5 263.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L87.5 263.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L72.3 255.7" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L61.8 242.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L58.0 226.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L61.8 209.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L72.3 196.3" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L87.5 189.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L104.5 189.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L119.7 196.3" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M96 226 L130.2 209.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <circle cx="96" cy="226" r="9" fill="#98a2b3" strokeWidth="3"/>
          <path d="M112 198 H214 Q224 198 224 208 Q224 218 214 218 H112 Q102 218 102 208 Q102 198 112 198 Z" fill="#1d1d22"/>
          <path d="M172 200 H214 L226 216 H172 Z" fill="#d0d5dd" strokeWidth="3"/>
          <path d="M36 176 Q62 150 100 164 L128 172 L112 186 Q80 170 52 192 Z" fill="#1d1d22"/>
          <path d="M24 134 H72 M30 134 V152" fill="none" stroke="#98a2b3" strokeWidth="5"/>
          <rect x="32" y="150" width="10" height="16" rx="3" fill="#E5322D" strokeWidth="3"/>
          <rect x="232" y="148" width="46" height="34" fill="#c9ced6"/>
          <path d="M240 148 V182 M250 148 V182 M260 148 V182 M270 148 V182" stroke="#98a2b3" strokeWidth="3" fill="none"/>
          <path d="M214 182 H282 V214 H214 Z" fill="#c9ced6"/>
          <circle cx="244" cy="198" r="10" fill="#1d1d22" strokeWidth="3"/>
          <path d="M140 152 L226 152 L232 192 L158 200 Z" fill="#1d1d22"/>
          <path d="M164 172 H208" stroke="#fff" strokeWidth="4" fill="none"/>
          <path d="M50 142 Q50 128 68 126 H196 Q222 126 232 140 L226 152 H68 Q50 152 50 142 Z" fill="#1d1d22"/>
          <path d="M194 116 Q236 98 284 112 L296 146 H214 Z" fill="#111"/>
          <path d="M214 126 Q250 114 286 124" stroke="#fff" strokeWidth="3" fill="none"/>
          <path d="M218 134 Q252 123 290 134" style={{ stroke: 'var(--vc, #B3202A)' }} strokeWidth="7" fill="none"/>
          <path d="M334 226 L308 128" strokeWidth="9" fill="none"/>
          <circle cx="334" cy="226" r="48" fill="#111"/>
          <circle cx="334" cy="226" r="40" fill="#e4e7ec" stroke="none"/>
          <path d="M334 226 L372.0 226.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L368.2 242.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L357.7 255.7" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L342.5 263.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L325.5 263.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L310.3 255.7" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L299.8 242.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L296.0 226.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L299.8 209.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L310.3 196.3" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L325.5 189.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L342.5 189.0" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L357.7 196.3" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <path d="M334 226 L368.2 209.5" stroke="#98a2b3" strokeWidth="1.8" fill="none"/>
          <circle cx="334" cy="226" r="9" fill="#98a2b3" strokeWidth="3"/>
          <path d="M292 190 Q336 156 384 190 L380 200 Q336 174 298 202 Z" style={{ fill: 'var(--vc, #B3202A)' }}/>
          <path d="M308 128 L292 104 H318" fill="none" strokeWidth="7"/>
          <path d="M298 104 L304 70" fill="none" strokeWidth="4"/>
          <ellipse cx="306" cy="62" rx="7" ry="11" fill="#d0d5dd" strokeWidth="3"/>
          <path d="M318 78 Q348 66 366 82 L360 122 H320 Z" fill="#1d1d22"/>
          <path d="M328 90 L352 86 L348 112 L328 112 Z" style={{ fill: 'var(--vc, #B3202A)' }} strokeWidth="3"/>
          <circle cx="364" cy="124" r="7" fill="#F4B400" strokeWidth="3"/>
          </g>
      </symbol>
      <symbol id="bus" viewBox="0 0 420 290">
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M26 62 Q26 46 44 46 H336 Q372 46 388 82 L398 124 V198 Q398 216 380 216 H44 Q26 216 26 198 Z" fill="#F3E7CB"/>
          <rect x="128" y="30" width="150" height="18" rx="7" fill="#fff"/>
          <path d="M46 66 H326 V132 H46 Z" fill="#1f2937" strokeLinejoin="miter"/>
          <path d="M338 66 H368 Q380 66 386 86 L392 132 H338 Z" fill="#1f2937"/>
          <path d="M100 66 V132 M154 66 V132 M208 66 V132 M262 66 V132" stroke="#F3E7CB" strokeWidth="9" fill="none" strokeLinecap="butt"/>
          <path d="M60 74 L88 74 L66 124 L60 124 Z" fill="#fff" fillOpacity=".18" stroke="none"/>
          <path d="M26 146 H306 L326 164 H398 V188 H26 Z" style={{ fill: 'var(--vc, #C8372D)' }}/>
          <path d="M300 66 V214" strokeWidth="3" fill="none"/>
          <rect x="380" y="168" width="22" height="14" rx="5" fill="#fff" strokeWidth="4"/>
          <rect x="394" y="70" width="14" height="38" rx="7" fill="#4b57c9"/>
          <path d="M68 218 Q68 176 114 176 Q160 176 160 218 Z" fill="#2a2d34"/>
          <path d="M268 218 Q268 176 314 176 Q360 176 360 218 Z" fill="#2a2d34"/>
          <circle cx="114" cy="220" r="38" fill="#111"/>
          <circle cx="114" cy="220" r="29" fill="#e4e7ec" stroke="none"/>
          <path d="M114 220 L141.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L133.1 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L114.0 247.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L94.9 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L87.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L94.9 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L114.0 193.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M114 220 L133.1 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="114" cy="220" r="7" fill="#98a2b3" strokeWidth="3"/>
          <circle cx="314" cy="220" r="38" fill="#111"/>
          <circle cx="314" cy="220" r="29" fill="#e4e7ec" stroke="none"/>
          <path d="M314 220 L341.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L333.1 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L314.0 247.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L294.9 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L287.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L294.9 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L314.0 193.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M314 220 L333.1 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="314" cy="220" r="7" fill="#98a2b3" strokeWidth="3"/>
          </g>
      </symbol>
      <symbol id="mini" viewBox="0 0 420 290">
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M30 74 Q30 56 50 56 H320 Q352 56 370 84 L396 130 V198 Q396 216 378 216 H46 Q30 216 30 200 Z" fill="#FFFFFF"/>
          <rect x="120" y="40" width="150" height="16" rx="7" fill="#fff"/>
          <path d="M46 74 H294 V132 H46 Z" fill="#1f2937" strokeLinejoin="miter"/>
          <path d="M104 74 V132 M162 74 V132 M220 74 V132" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="butt"/>
          <path d="M300 70 H338 V204 H300 Z" fill="#fff"/>
          <rect x="308" y="80" width="22" height="52" rx="4" fill="#1f2937" strokeWidth="3"/>
          <path d="M346 72 H362 Q374 72 382 92 L392 132 H346 Z" fill="#1f2937"/>
          <path d="M30 152 H396 V172 H30 Z" style={{ fill: 'var(--vc, #1F7A8C)' }}/>
          <path d="M388 60 Q408 58 408 84 V106" fill="none" strokeWidth="9"/>
          <path d="M388 60 Q408 58 408 84 V106" fill="none" stroke="#fff" strokeWidth="3"/>
          <rect x="384" y="176" width="20" height="16" rx="5" fill="#e4e7ec" strokeWidth="4"/>
          <path d="M66 218 Q66 176 112 176 Q158 176 158 218 Z" fill="#2a2d34"/>
          <path d="M270 218 Q270 176 316 176 Q362 176 362 218 Z" fill="#2a2d34"/>
          <circle cx="112" cy="220" r="38" fill="#111"/>
          <circle cx="112" cy="220" r="29" fill="#e4e7ec" stroke="none"/>
          <path d="M112 220 L139.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L131.1 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L112.0 247.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L92.9 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L85.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L92.9 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L112.0 193.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 220 L131.1 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="112" cy="220" r="7" fill="#98a2b3" strokeWidth="3"/>
          <circle cx="316" cy="220" r="38" fill="#111"/>
          <circle cx="316" cy="220" r="29" fill="#e4e7ec" stroke="none"/>
          <path d="M316 220 L343.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L335.1 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L316.0 247.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L296.9 239.1" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L289.0 220.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L296.9 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L316.0 193.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M316 220 L335.1 200.9" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="316" cy="220" r="7" fill="#98a2b3" strokeWidth="3"/>
          </g>
      </symbol>
      <symbol id="van" viewBox="0 0 420 290">
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M30 80 Q30 54 56 52 H270 Q292 52 308 70 L330 100 L376 118 Q398 124 398 146 V200 H30 Z" fill="#FFFFFF"/>
          <rect x="46" y="76" width="112" height="54" rx="8" fill="#33475b"/>
          <path d="M102 76 V130" stroke="#fff" strokeWidth="5" fill="none"/>
          <rect x="172" y="76" width="92" height="54" rx="8" fill="#33475b"/>
          <path d="M278 78 H304 L328 106 H278 Z" fill="#33475b"/>
          <path d="M168 70 V196 M272 70 V196" strokeWidth="3" fill="none"/>
          <path d="M246 146 h12" strokeWidth="6" fill="none"/>
          <path d="M30 150 H398 V166 H30 Z" style={{ fill: 'var(--vc, #1560F0)' }}/>
          <path d="M356 168 H404 Q406 198 394 202 H346 Z" fill="#1d2939"/>
          <rect x="386" y="126" width="14" height="16" rx="4" fill="#cfe9f7" strokeWidth="4"/>
          <rect x="332" y="96" width="14" height="18" rx="4" fill="#111" strokeWidth="3"/>
          <path d="M66 202 Q66 170 112 170 Q158 170 158 202 Z" fill="#2a2d34"/>
          <path d="M276 202 Q276 170 322 170 Q368 170 368 202 Z" fill="#2a2d34"/>
          <circle cx="112" cy="212" r="36" fill="#111"/>
          <circle cx="112" cy="212" r="27" fill="#e4e7ec" stroke="none"/>
          <path d="M112 212 L137.0 212.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L129.7 229.7" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L112.0 237.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L94.3 229.7" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L87.0 212.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L94.3 194.3" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L112.0 187.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M112 212 L129.7 194.3" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="112" cy="212" r="7" fill="#98a2b3" strokeWidth="3"/>
          <circle cx="322" cy="212" r="36" fill="#111"/>
          <circle cx="322" cy="212" r="27" fill="#e4e7ec" stroke="none"/>
          <path d="M322 212 L347.0 212.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L339.7 229.7" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L322.0 237.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L304.3 229.7" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L297.0 212.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L304.3 194.3" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L322.0 187.0" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <path d="M322 212 L339.7 194.3" stroke="#98a2b3" strokeWidth="2.5" fill="none"/>
          <circle cx="322" cy="212" r="7" fill="#98a2b3" strokeWidth="3"/>
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
export const Mini = art('mini', 'BansaRide mini bus', 'm-mini')

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
  // the tab bar's own icons: each has a soft filled shape (duo) under a clean outline
  tabHome: <><path className="duo" d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z" /><path d="M3 11.5 12 3.5l9 8" /><path d="M5.5 10.2V20.2a.8.8 0 0 0 .8.8h3.2v-5.5h5V21h3.2a.8.8 0 0 0 .8-.8V10.2" /><path d="M16.5 5.5V3.2h2.3v4.4" /></>,
  tabRoutes: <><circle className="duo" cx="6.5" cy="17.5" r="3" /><circle cx="6.5" cy="17.5" r="3" /><path className="duo" d="M17.5 3.2a3.6 3.6 0 0 1 3.6 3.6c0 2.8-3.6 6.4-3.6 6.4s-3.6-3.6-3.6-6.4a3.6 3.6 0 0 1 3.6-3.6z" /><path d="M17.5 3.2a3.6 3.6 0 0 1 3.6 3.6c0 2.8-3.6 6.4-3.6 6.4s-3.6-3.6-3.6-6.4a3.6 3.6 0 0 1 3.6-3.6z" /><circle cx="17.5" cy="6.8" r="1.2" /><path d="M9.5 17.5h4.2a3 3 0 0 0 0-6h-1.5" strokeDasharray="1.2 3" /></>,
  tabMap: <><path className="duo" d="M9 5 3.5 7v12.5L9 17.5l6 2 5.5-2V5L15 7z" /><path d="M9 5 3.5 7v12.5L9 17.5l6 2 5.5-2V5L15 7z" /><path d="M9 5v12.5M15 7v12.5" /><circle cx="12" cy="10.5" r="1.6" /></>,
  tabTrike: <><path className="duo" d="M5 8.5h8.5a2 2 0 0 1 2 2V15H4v-4.5a2 2 0 0 1 2-2z" /><path d="M4.5 15V10a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v5" /><path d="M2.5 15h15.5l2 1.2" /><path d="M15 8.5l2.3-3H20" /><circle cx="7" cy="18" r="2.2" /><circle cx="18.5" cy="18" r="2.2" /><path d="M7.5 8.5V5.5h4" /></>,
  tabMoto: <><circle className="duo" cx="6" cy="17" r="3" /><circle cx="6" cy="17" r="3" /><circle className="duo" cx="18.5" cy="17" r="3" /><circle cx="18.5" cy="17" r="3" /><path className="duo" d="M6 17l3.5-6.5h5l4 6.5-4.5-2.5z" /><path d="M6 17l3.5-6.5h5M14.5 10.5 18.5 17M9.5 10.5 8.5 7.5H6.5M14.5 10.5l1-3.5h2.5" /></>,
  // a street: a street-name sign on a post, above a road that runs away into the distance
  street: <><rect className="duo" x="3" y="3" width="15" height="6" rx="1.4" /><rect x="3" y="3" width="15" height="6" rx="1.4" /><path d="M6 6h6" /><path d="m14.6 6 1.6 0" /><path d="M10.5 9v5.5" /><path className="duo" d="M9.5 14.5h-6L1.8 21h20.4l-1.7-6.5z" /><path d="M2.3 21 6.2 14.5M21.7 21l-3.9-6.5M12 15v1.4M12 18v1.4" /></>,
  // a barangay: a small community, with two houses and a tree
  barangay: <><path className="duo" d="M2.5 20v-7.5L8 8l5.5 4.5V20z" /><path d="M2.5 20v-7.5L8 8l5.5 4.5V20zM1.5 12.8 8 7.4l6.5 5.4" /><path d="M6 20v-4h4v4" /><path className="duo" d="M14 20v-5.5l4.2-3.4 4.3 3.4V20z" /><path d="M14 20v-5.5l4.2-3.4 4.3 3.4V20" /><path d="M16.5 20v-3h3.4v3M2 20.5h20" /><circle cx="19" cy="6" r="2.6" /><path d="M19 8.6v2.4" /></>,
  // a sitio: a hut up on a hill, for the small mountain places
  sitio: <><path className="duo" d="M1.5 20.5 8.5 9l4.5 7 2.5-3.5 6.5 8z" /><path d="M1.5 20.5 8.5 9l4.5 7 2.5-3.5 6.5 8z" /><path className="duo" d="M15 11.5V7.2l3-2.4 3 2.4v4.3z" /><path d="M15 11.5V7.2l3-2.4 3 2.4v4.3" /></>,
  // a place: a map pin with a soft fill
  place: <><path className="duo" d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  tabFare: <><circle className="duo" cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" /><path d="M9.3 17V7.3h3.4a2.5 2.5 0 0 1 0 5H9.3M7.6 9.2h6.9M7.6 11.2h6.9" /></>,
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
        {route.fare === null ? <b className="price">~{motorPossible(route.km)}</b> : <b className="price">{fareText(route)}</b>}
        <span className="eta">{route.fare === null ? 'Ask driver · ' : ''}~{route.minutes} min</span>
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
