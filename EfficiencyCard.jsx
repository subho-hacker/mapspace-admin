import {useState} from 'react'
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts'
import {GlassCard} from './ui.jsx'
import DailyEfficiency from './DailyEfficiency.jsx'
export default function EfficiencyCard({series,ms}){
 const [tab,setTab]=useState('Daily')
 return <GlassCard whileHover={{}}><div className="tabs" style={{marginBottom:10}}>{['Daily','Live'].map(t=><button key={t} className={t===tab?'on':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
  {tab==='Daily'?<DailyEfficiency/>:<><h3>Fleet efficiency · live</h3><small className="muted">Average speed and fuel use, updated every {ms/1000}s</small>
   <ResponsiveContainer height={190}><LineChart data={series}><CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="time" stroke="#A8B8CA" fontSize={10}/><YAxis stroke="#A8B8CA" fontSize={10}/><Tooltip/><Line dataKey="speed" name="Speed" stroke="#FF4D67" dot={false} isAnimationActive={false}/><Line dataKey="fuel" name="Fuel" stroke="#58B9F5" dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></>}</GlassCard>}
