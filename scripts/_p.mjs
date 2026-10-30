import fs from 'node:fs'
const p = 'D:/temp/claude/d--Doydoy-BansaRide/f6b54189-2ccd-461b-9d26-55eb49efe9db/scratchpad/patch42b.mjs'
let s = fs.readFileSync(p, 'utf8')
const a = '  ["  ], [sel])\n  const focus", "  ], [sel, poiKinds])\n  const focus"],'
if (!s.includes(a)) throw new Error('anchor not found')
s = s.replace(a, '  ["  ], [sel])\n  const ride = ", "  ], [sel, poiKinds])\n  const ride = "],')
fs.writeFileSync(p, s)
