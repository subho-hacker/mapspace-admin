import {CM} from '../utils/now.js'
import {useState} from 'react'
import {ResponsiveContainer,AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts'
import {Package,CheckCircle2,XCircle,Clock,IndianRupee,Wallet} from 'lucide-react'
import {KPI,GlassCard,Modal} from '../components/ui.jsx'
import {monthly,months,growth} from '../data/analyticsData.js'
import DailyEfficiency from '../components/DailyEfficiency.jsx'
import ExportAnalytics from '../components/ExportAnalytics.jsx'
const tip={contentStyle:{background:'#0A1728',border:'1px solid rgba(255,255,255,.16)',borderRadius:12,color:'#F1F6FC'}}
export default function Analytics(){
 const [mi,setMi]=useState(CM);const [open,setOpen]=useState(null)
 const m=monthly[mi];const pick=l=>{const i=months.indexOf(l);if(i>=0)setOpen(i)}
 const donut=[{name:'Delivered',v:m.delivered,c:'#2D99DC'},{name:'Failed',v:m.failed,c:'#FF4D67'}]
 const d=open!=null?monthly[open]:null
 return <div className="page">
  <div className="toolbar"><select value={mi} onChange={e=>setMi(+e.target.value)} aria-label="Month">{months.map((x,i)=><option key={x} value={i}>{x} 2026{i===CM?' (to date)':''}</option>)}</select><span className="muted">Selected month drives the cards and donut. Click any bar or point for a full report.</span><ExportAnalytics mi={mi}/></div>
  <div className="grid kpis" key={mi}>
   <KPI icon={Package} label="Total shipments" value={m.shipments} delta={growth(mi,'shipments')} onClick={()=>setOpen(mi)}/>
   <KPI icon={CheckCircle2} label="Delivered" value={m.delivered} delta={growth(mi,'delivered')}/>
   <KPI icon={XCircle} label="Failed" value={m.failed} delta={growth(mi,'failed')}/>
   <KPI icon={Clock} label="On-time rate" value={m.onTime} suffix="%"/>
   <KPI icon={IndianRupee} label="Revenue (₹ lakh)" value={m.revenue} decimals={1} delta={growth(mi,'revenue')}/>
   <KPI icon={Wallet} label="Operating cost (₹ lakh)" value={m.cost} decimals={1} delta={growth(mi,'cost')}/></div>
  <div className="grid charts">
   <GlassCard whileHover={{}}><h3>Monthly shipment performance</h3><ResponsiveContainer height={260}><AreaChart data={monthly} onClick={e=>e?.activeLabel&&pick(e.activeLabel)}>
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58B9F5" stopOpacity=".6"/><stop offset="1" stopColor="#58B9F5" stopOpacity="0"/></linearGradient></defs>
    <CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="month" stroke="#A8B8CA"/><YAxis stroke="#A8B8CA"/><Tooltip {...tip}/><Area dataKey="shipments" stroke="#58B9F5" fill="url(#g)" strokeWidth={2} animationDuration={900}/></AreaChart></ResponsiveContainer></GlassCard>
   <GlassCard whileHover={{}}><h3>Revenue vs operating cost (₹ lakh)</h3><ResponsiveContainer height={260}><BarChart data={monthly} onClick={e=>e?.activeLabel&&pick(e.activeLabel)}>
    <CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="month" stroke="#A8B8CA"/><YAxis stroke="#A8B8CA"/><Tooltip {...tip}/><Legend/><Bar dataKey="revenue" fill="#2D99DC" radius={[6,6,0,0]}/><Bar dataKey="cost" fill="#FFB547" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></GlassCard>
   <GlassCard whileHover={{}}><h3>Delivery success · {months[mi]}</h3><ResponsiveContainer height={260}><PieChart><Pie data={donut} dataKey="v" nameKey="name" innerRadius={62} outerRadius={92} onClick={()=>setOpen(mi)} animationDuration={700}>{donut.map(x=><Cell key={x.name} fill={x.c}/>)}</Pie><Tooltip {...tip}/><Legend/></PieChart></ResponsiveContainer></GlassCard></div>
  <DailyEfficiency mi={mi} card height={240}/>
  <Modal open={!!d} onClose={()=>setOpen(null)} title={d&&`${d.month} 2026 report`}>{d&&<>
   <div className="stats">{[['Total shipments',d.shipments],['Delivered',d.delivered],['Failed',d.failed],['Revenue',`₹${d.revenue}L`],['Operating cost',`₹${d.cost}L`],['Profit',`₹${d.profit}L`],['On-time rate',d.onTime+'%'],['Fleet utilization',d.utilization+'%'],['MoM shipment growth',growth(open,'shipments')+'%']].map(([a,b])=><div className="kv col" key={a}><span>{a}</span><b>{b}</b></div>)}</div>
   <table><thead><tr><th>Month</th><th>Shipments</th><th>On-time</th><th>Revenue</th></tr></thead><tbody>{monthly.slice(Math.max(0,open-2),open+1).map(r=><tr key={r.month}><td>{r.month}</td><td>{r.shipments}</td><td>{r.onTime}%</td><td>₹{r.revenue}L</td></tr>)}</tbody></table></>}</Modal>
 </div>}
