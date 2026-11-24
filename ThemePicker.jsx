import {useState} from 'react'
import {Sun,Moon,Monitor,Layers,Droplet} from 'lucide-react'
import {GlassCard} from './ui.jsx'
import {getPref,setPref,getStyle,setStyle} from '../services/theme.js'
const T=[['light','Light',Sun],['dark','Dark',Moon],['system','System',Monitor]],S=[['skeuo','Skeuomorphic',Layers],['glass','Glass',Droplet]]
const Seg=({label,opts,val,set})=><div className="seg" role="radiogroup" aria-label={label}>{opts.map(([v,l,I])=><button key={v} role="radio" aria-checked={val===v} className={val===v?'on':''} onClick={()=>set(v)}><I size={16}/> {l}</button>)}</div>
export default function ThemePicker(){
 const [p,setP]=useState(getPref()),[s,setS]=useState(getStyle())
 return <GlassCard whileHover={{}}><h3>Appearance</h3><p className="muted">Applies instantly. System follows your device.</p>
  <Seg label="Theme" opts={T} val={p} set={v=>{setP(v);setPref(v)}}/><p className="muted" style={{marginBottom:0}}>Design style</p><Seg label="Design style" opts={S} val={s} set={v=>{setS(v);setStyle(v)}}/></GlassCard>}
