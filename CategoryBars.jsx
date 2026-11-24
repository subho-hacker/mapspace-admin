import {useState} from 'react'
import {Link} from 'react-router-dom'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,Cell,CartesianGrid,LabelList} from 'recharts'
import {GlassCard,Drawer} from './ui.jsx'
import {useResource} from '../hooks/useResource.js'
import {monthly,months} from '../data/analyticsData.js'
import {CATS,PRODUCTS,CITIES,catSplit} from '../data/trackData.js'
import {apportion} from '../utils/split.js'
import {CM,TD,Y} from '../utils/now.js'
const SHORT={'Steel & Hardware':'Steel','Agro & Food':'Agro'},tip={contentStyle:{background:'#0A1728',border:'1px solid rgba(255,255,255,.16)',borderRadius:12}}
// Delivery analytics by product category for any month. Totals follow Analytics; shipments you add and mark Delivered are added on top, so the bars move in real time.
export default function CategoryBars(){
 const {items}=useResource('shipments'),[mi,setMi]=useState(CM),[sel,setSel]=useState(null),[open,setOpen]=useState(false)
 const mk=`${Y}-${String(mi+1).padStart(2,'0')}`,mine=items.filter(x=>x.createdAt&&x.status==='Delivered'&&String(x.date).startsWith(mk)),base=catSplit(mi)
 const data=CATS.map((c,i)=>({c,s:SHORT[c]||c,n:base[i]+mine.filter(x=>x.category===c).length})),total=data.reduce((a,x)=>a+x.n,0),top=data.reduce((a,x)=>x.n>a.n?x:a,data[0]),cur=sel||top.c
 const pick=c=>{setSel(c);setOpen(true)}
 const d=data.find(x=>x.c===cur),idx=CATS.indexOf(cur),days=new Date(Y,mi+1,0).getDate(),proj=monthly[mi].mtd?Math.round(d.n*days/TD):d.n,prev=mi>0?catSplit(mi-1)[idx]:null,chg=prev?+(((proj-prev)/prev)*100).toFixed(1):null
 const prods=apportion(d.n,PRODUCTS[cur].map((_,i)=>[.5,.3,.2][i]||.1)),cities=apportion(d.n,CITIES.map(c=>c.m)),rows=items.filter(x=>x.category===cur&&String(x.date).startsWith(mk))
 return <GlassCard whileHover={{}}><div className="toolbar"><h3>Category deliveries</h3><select value={mi} onChange={e=>{setMi(+e.target.value);setSel(null)}} aria-label="Month">{months.map((x,i)=><option key={x} value={i}>{x} {Y}</option>)}</select></div>
  <small className="muted">{total.toLocaleString('en-IN')} delivered in {months[mi]}{monthly[mi].mtd?' (month to date)':''}. Click a bar for the full breakdown.</small>
  <ResponsiveContainer height={270}><BarChart data={data} margin={{top:22,right:8,left:-14,bottom:0}} onClick={e=>{const c=e?.activePayload?.[0]?.payload?.c;if(c)pick(c)}}>
   <defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(88,185,245,.10)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(88,185,245,.55)" strokeWidth="3"/></pattern>
    <linearGradient id="pillg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58B9F5"/><stop offset="1" stopColor="#1d6fa3"/></linearGradient></defs>
   <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false}/><XAxis dataKey="s" stroke="#A8B8CA" fontSize={11} interval={0}/><YAxis stroke="#A8B8CA" fontSize={11}/><Tooltip {...tip} cursor={{fill:'rgba(88,185,245,.08)'}} formatter={(v)=>[v.toLocaleString('en-IN'),'Delivered']} labelFormatter={(_,p)=>p?.[0]?.payload?.c}/>
   <Bar dataKey="n" barSize={40} radius={[20,20,20,20]} animationDuration={700} cursor="pointer">{data.map(x=><Cell key={x.c} fill={x.c===cur?'url(#pillg)':'url(#hatch)'} stroke={x.c===cur?'none':'rgba(88,185,245,.5)'}/>)}<LabelList dataKey="n" position="top" fill="#A8B8CA" fontSize={11}/></Bar></BarChart></ResponsiveContainer>
  <div className="chips">{data.map(x=><button key={x.c} className={'chip2'+(x.c===cur?' on':'')} onClick={()=>pick(x.c)}>{x.c} · {x.n}</button>)}</div>
  <Drawer open={open} onClose={()=>setOpen(false)} title={`${cur} · ${months[mi]} ${Y}`}><div className="stack">
   <div className="stats">{[['Delivered',d.n.toLocaleString('en-IN')],['Share of month',Math.round(d.n/total*100)+'%'],monthly[mi].mtd?['Projected month',proj.toLocaleString('en-IN')]:null,chg!=null?['vs last month',(chg>=0?'+':'')+chg+'%']:null].filter(Boolean).map(([a,b])=><div className="kv col" key={a}><span>{a}</span><b>{b}</b></div>)}</div>
   <h3>Products</h3>{PRODUCTS[cur].map((p,i)=><div className="kv" key={p}><span>{p}</span><b>{prods[i].toLocaleString('en-IN')}</b></div>)}
   <h3>By city</h3>{CITIES.map((c,i)=><div className="kv" key={c.name}><span>{c.name}</span><b>{cities[i].toLocaleString('en-IN')}</b></div>)}
   <h3>Shipment records ({rows.length})</h3>{rows.slice(0,8).map(x=><div className="kv" key={x.id}><span>{x.id} · {x.customer}<br/><small>{x.origin} → {x.destination}</small></span><b>{x.status}</b></div>)}
   {!rows.length&&<p className="muted">No individual shipment records are stored for {months[mi]}. Totals come from Analytics.</p>}
   <Link className="btn" to={`/shipments?q=${encodeURIComponent(cur)}`}>Open in Shipment Management</Link></div></Drawer></GlassCard>}
