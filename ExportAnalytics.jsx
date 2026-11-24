import {useState} from 'react'
import {motion,AnimatePresence} from 'framer-motion'
import {Download,ChevronDown} from 'lucide-react'
import {monthly,months,daily} from '../data/analyticsData.js'
import {download,toCsv} from '../utils/download.js'
export default function ExportAnalytics({mi}){
 const [open,setOpen]=useState(false),[done,setDone]=useState('')
 const M=monthly.map(m=>({month:m.month,year:2026,shipments:m.shipments,delivered:m.delivered,failed:m.failed,revenue_lakh:m.revenue,cost_lakh:m.cost,profit_lakh:m.profit,on_time_pct:m.onTime,efficiency_pct:m.efficiency,fuel_thousand_litres:m.fuel,utilization_pct:m.utilization}))
 const opts=[['Monthly summary (CSV)',()=>['mapspace-analytics-monthly-2026.csv',toCsv(M),'text/csv']],
  [`Daily, ${months[mi]} (CSV)`,()=>[`mapspace-analytics-daily-${months[mi]}-2026.csv`,toCsv(daily[mi]),'text/csv']],
  ['Daily, full year (CSV)',()=>['mapspace-analytics-daily-2026.csv',toCsv(daily.flatMap((d,i)=>d.map(r=>({month:months[i],...r})))),'text/csv']],
  ['Everything (JSON)',()=>['mapspace-analytics-2026.json',JSON.stringify({exportedAt:new Date().toISOString(),monthly:M,daily},null,2),'application/json']]]
 const run=([label,fn])=>{download(...fn());setOpen(false);setDone(label.replace(/ \(.*/,'')+' exported');setTimeout(()=>setDone(''),2500)}
 return <div className="xmenu"><button className="btn" onClick={()=>setOpen(!open)} aria-expanded={open}><Download size={15}/> Export data <ChevronDown size={14}/></button>
  <AnimatePresence>{open&&<><div className="backdrop clear" onClick={()=>setOpen(false)}/><motion.ul className="glass xlist" initial={{opacity:0,y:-6,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6}} transition={{type:'spring',stiffness:340,damping:26}}>
   {opts.map(o=><li key={o[0]}><button onClick={()=>run(o)}>{o[0]}</button></li>)}</motion.ul></>}</AnimatePresence>
  <AnimatePresence>{done&&<motion.small className="up" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{done}</motion.small>}</AnimatePresence></div>}
