// The app's own weather icons: soft filled shapes under clean outlines, in the app's colours.
const SUN = (c) => <><circle cx="12" cy="12" r="4.2" fill="#ffd24a" stroke="none" /><circle cx="12" cy="12" r="4.2" /><path d={'M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6'} stroke={c} /></>
const MOON = <><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#ffe08a" /></>
const CLOUD = (fill = '#dfe6f3', y = 0) => <path transform={`translate(0 ${y})`} d="M7 18.5a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6-1.2A4.7 4.7 0 0 1 17.5 18.5z" fill={fill} />
const DROPS = (n) => <>{[7.5, 11.5, 15.5].slice(0, n).map((x) => <path key={x} d={`M${x} 20.2l-.9 2`} stroke="#3b82f6" strokeWidth="2" />)}</>

// code: Open-Meteo weather code. night: draw the moon instead of the sun.
export default function WeatherIcon({ code = 0, night = false, size = 24 }) {
  let body
  if (code === 0) body = night ? MOON : SUN('#f4a300')
  else if (code === 1 || code === 2) body = <><g transform="translate(-3 -2) scale(.8)">{night ? MOON : SUN('#f4a300')}</g>{CLOUD('#e6ecf7', 1)}</>
  else if (code === 3) body = <>{CLOUD('#b8c4d8', -1)}</>
  else if (code === 45 || code === 48) body = <>{CLOUD('#c9d2e2', -2)}<path d="M5 19.5h14M7 22h10" stroke="#8aa0c2" /></>
  else if ([51, 53, 55, 56, 57].includes(code)) body = <>{CLOUD('#c9d6ec', -2)}{DROPS(2)}</>
  else if ([61, 80].includes(code)) body = <>{CLOUD('#b9c8e4', -2)}{DROPS(2)}</>
  else if ([63, 81].includes(code)) body = <>{CLOUD('#9fb2d6', -2)}{DROPS(3)}</>
  else if ([65, 67, 82].includes(code)) body = <>{CLOUD('#7f94bd', -2)}{DROPS(3)}</>
  else if ([95, 96, 99].includes(code)) body = <>{CLOUD('#6d7fa6', -2)}<path d="M12.8 14.5 10 19h3l-1.2 3.8L16 17.5h-3l1.4-3z" fill="#ffd24a" stroke="#b7791f" strokeWidth="1.2" /></>
  else body = SUN('#f4a300')
  return <svg className="wicon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="#101828" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{body}</svg>
}
