import {CM} from '../utils/now.js'
import {useEffect,useState} from 'react'
import {ResponsiveContainer,ComposedChart,Line,Bar,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from 'recharts'
import {GlassCard} from './ui.jsx'
import {monthly,months,daily} from '../data/analyticsData.js'
// Day-by-day fleet efficiency. Daily values reconcile to the monthly figure used on the Analytics page.
export default function DailyEfficiency({mi,card=false,height=190}){
 const [own,setOwn]=useState(CM),[day,setDay]=useState(null),m=mi??own,data=daily[m],avg=monthly[m].efficiency
 useEffect(()=>setDay(null),[m])
 const best=data.reduce((a,b)=>b.efficiency>a.efficiency?b:a),low=data.reduce((a,b)=>b.efficiency<a.efficiency?b:a),sel=day!=null?data[day-1]:null
 const body=<>
  <div className="toolbar"><h3>Fleet efficiency · day by day</h3>{mi==null&&<select value={own} onChange={e=>setOwn(+e.target.value)} aria-label="Month">{months.map((x,i)=><option key={x} value={i}>{x} 2026</option>)}</select>}</div>
  <small className="muted">Click a day for details. Month average {avg}%.</small>
  <ResponsiveContainer height={height}><ComposedChart data={data} onClick={e=>e?.activeLabel!=null&&setDay(+e.activeLabel)}>
   <CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="day" stroke="#A8B8CA" fontSize={11}/>
   <YAxis yAxisId="l" stroke="#A8B8CA" fontSize={11} domain={[lo=>Math.floor(lo-3),hi=>Math.ceil(hi+3)]} unit="%"/><YAxis yAxisId="r" orientation="right" hide/>
   <Tooltip/><Legend/><Bar yAxisId="r" dataKey="shipments" name="Shipments" fill="rgba(88,185,245,.28)" radius={[4,4,0,0]}/>
   <Line yAxisId="l" dataKey="efficiency" name="Efficiency %" stroke="#58B9F5" strokeWidth={2.5} dot={false} activeDot={{r:5}} animationDuration={700}/></ComposedChart></ResponsiveContainer>
  <div className="stats"><div className="kv col"><span>Best day</span><b>{best.date} · {best.efficiency}%</b></div><div className="kv col"><span>Lowest day</span><b>{low.date} · {low.efficiency}%</b></div></div>
  {sel&&<div className="stats" style={{marginTop:10}}>{[[sel.date+' efficiency',sel.efficiency+'%'],['vs month average',(sel.efficiency-avg>=0?'+':'')+(sel.efficiency-avg).toFixed(1)+' pts'],['Avg speed',sel.avgSpeed+' km/h'],['Fuel used',sel.fuel.toLocaleString('en-IN')+' L'],['Shipments',sel.shipments]].map(([a,b])=><div className="kv col" key={a}><span>{a}</span><b>{b}</b></div>)}</div>}</>
 return card?<GlassCard whileHover={{}}>{body}</GlassCard>:body}
