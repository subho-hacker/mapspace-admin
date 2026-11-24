import {useState} from 'react'
import {GlassCard} from './ui.jsx'
import {daily,monthly,months} from '../data/analyticsData.js'
import {CM,TD,Y} from '../utils/now.js'
const col=(v,max)=>`rgba(88,185,245,${(.1+.85*v/max).toFixed(2)})`
// Daily calendar heatmap (current month to today) and a month-by-month strip. Delivered = shipments less failed share.
export default function DeliveryHeatmap(){
 const r=monthly[CM].delivered/monthly[CM].shipments,d=daily[CM].map(x=>({...x,del:Math.round(x.shipments*r)})),max=Math.max(...d.map(x=>x.del)),mm=Math.max(...monthly.map(x=>x.delivered))
 const off=(new Date(Y,CM,1).getDay()+6)%7,[sel,setSel]=useState(d[TD-1])
 return <GlassCard whileHover={{}}><div className="toolbar"><h3>Delivery heatmap</h3><span className="muted">Daily, {months[CM]} 1 to {TD}</span></div>
  <div className="cal">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(h=><small key={h}>{h}</small>)}{Array.from({length:off},(_,i)=><i key={'o'+i}/>)}
   {d.map(x=><button key={x.day} className={'cell'+(sel.day===x.day?' on':'')} style={{background:col(x.del,max)}} aria-label={`${x.date}: ${x.del} deliveries`} onClick={()=>setSel(x)}>{x.day}</button>)}</div>
  <p className="muted">{sel.date}: <b style={{color:'var(--tx)'}}>{sel.del.toLocaleString('en-IN')}</b> deliveries completed</p>
  <div className="toolbar"><h3>Monthly</h3><span className="muted">{months[CM]} is month-to-date</span></div>
  <div className="mstrip">{monthly.map(m=><div key={m.month} className="mcell" style={{background:col(m.delivered,mm)}} title={`${m.month}: ${m.delivered.toLocaleString('en-IN')} delivered`}><small>{m.month}</small><b>{(m.delivered/1000).toFixed(1)}k</b></div>)}</div></GlassCard>}
