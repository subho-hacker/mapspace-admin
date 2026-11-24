const PATH='M6 40c8-6 14-2 20-6s10-2 16-8'
export default function Logo({collapsed}){
 return <div className={'logo'+(collapsed?' mini':'')}>
  <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"><defs><linearGradient id="lgp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9BE0FF"/><stop offset="1" stopColor="#2D99DC"/></linearGradient></defs>
   <circle cx="24" cy="21" r="17" className="ring"/>
   <path d="M24 4c-8 0-14 6-14 13.5C10 28 24 44 24 44s14-16 14-26.5C38 10 32 4 24 4z" fill="url(#lgp)"/>
   <circle cx="24" cy="17.5" r="5.5" fill="#050C1E"/><circle cx="24" cy="17.5" r="2" fill="#58B9F5" className="core"/>
   <path d={PATH} fill="none" stroke="#58B9F5" strokeWidth="1.6" strokeDasharray="3 3" className="rt"/>
   <circle r="2.3" fill="#00E676"><animateMotion dur="3.5s" repeatCount="indefinite" path={PATH}/></circle></svg>
  {!collapsed&&<span className="wm"><b>Map</b>Space</span>}</div>}
