import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {Zap,Send,CheckCircle2} from 'lucide-react'
import {GlassCard,Counter} from '../components/ui.jsx'
import RouteMap from '../components/RouteMap.jsx'
import {LOC,PLACES,CATS,PRODUCTS} from '../data/trackData.js'
import {km} from '../hooks/useFleet.js'
import {useResource} from '../hooks/useResource.js'
import {resources} from '../services/api.js'
import {sendTo,notify,nextSeq,inr} from '../services/comms.js'
import {TODAY,ymdOf,hhmm} from '../utils/now.js'
const URB=new Set(['Kolkata','Howrah','Baranagar','New Town','Dankuni','Maheshtala','Sealdah']),KEY={Distance:'k',Time:'h',Fuel:'l'}
const leg=(a,b)=>{const k=km(LOC[a],LOC[b]),u=URB.has(a)&&URB.has(b);return{k,h:k/(u?24:50),l:k*(u?.34:.24)}}
const tot=p=>p.slice(1).reduce((s,x,i)=>{const l=leg(p[i],x);return{k:s.k+l.k,h:s.h+l.h,l:s.l+l.l}},{k:0,h:0,l:0})
// Nearest-neighbour start, then 2-opt improvement on the chosen goal (distance, time or fuel). Falls back to your order if that is already best.
function plan(start,stops,goal){const key=KEY[goal],c=p=>tot(p)[key];let cur=start,left=[...stops],path=[start]
 while(left.length){left.sort((a,b)=>leg(cur,a)[key]-leg(cur,b)[key]);cur=left.shift();path.push(cur)}
 for(let imp=true;imp;){imp=false;for(let i=1;i<path.length-1;i++)for(let j=i+1;j<path.length;j++){const n=[...path.slice(0,i),...path.slice(i,j+1).reverse(),...path.slice(j+1)];if(c(n)<c(path)-1e-9){path=n;imp=true}}}
 const orig=[start,...stops];return c(path)<=c(orig)?path:orig}
export default function RouteOptimization(){
 const cu=useResource('customers'),dr=useResource('drivers'),sh=useResource('shipments')
 const [start,setStart]=useState('Dankuni'),[stops,setStops]=useState(['Maheshtala','Baranagar','New Town']),[goal,setGoal]=useState('Distance'),[busy,setBusy]=useState(false),[r,setR]=useState(null)
 const [custId,setCustId]=useState(''),[drvId,setDrvId]=useState(''),[cat,setCat]=useState(CATS[0]),[prod,setProd]=useState(PRODUCTS[CATS[0]][0]),[qty,setQty]=useState(''),[prio,setPrio]=useState('Medium'),[err,setErr]=useState(''),[sending,setSending]=useState(false),[done,setDone]=useState(null)
 const custs=cu.items.filter(c=>c.status==='Active'),drvs=dr.items.filter(d=>['Available','Active'].includes(d.status))
 useEffect(()=>{if(!custs.find(c=>c.id===custId))setCustId(custs[0]?.id||'')},[cu.items])
 useEffect(()=>{if(!drvs.find(d=>d.id===drvId))setDrvId((drvs.find(d=>d.status==='Available')||drvs[0])?.id||'')},[dr.items])
 const toggle=n=>{setR(null);setDone(null);setStops(s=>s.includes(n)?s.filter(x=>x!==n):[...s,n])}
 const run=()=>{if(!stops.length)return;setBusy(true);setR(null);setDone(null);setTimeout(()=>{const orig=[start,...stops],opt=plan(start,stops,goal),o=tot(orig),n=tot(opt);setR({orig,opt,o,n,goal});setBusy(false)},900)}
 const cust=custs.find(c=>c.id===custId),drv=drvs.find(d=>d.id===drvId)
 const m=r&&{k:r.o.k-r.n.k,min:(r.o.h-r.n.h)*60,fuel:r.o.l-r.n.l,pct:r.o[KEY[r.goal]]?(r.o[KEY[r.goal]]-r.n[KEY[r.goal]])/r.o[KEY[r.goal]]*100:0}
 const dispatch=async()=>{if(!r)return setErr('Optimize the route first.');if(!cust||!drv)return setErr('Choose a customer and a driver.');setErr('');setSending(true)
  try{const [S,L]=await Promise.all([resources.shipments.list(),resources.deliveries.list()]),id=nextSeq(S,'SH-'),did=nextSeq(L,'DL-'),dest=r.opt[r.opt.length-1],eta=new Date(Date.now()+r.n.h*36e5),now=Date.now()
   await resources.shipments.create({id,customer:cust.name,origin:start,destination:dest,vehicle:drv.vehicle,driver:drv.name,category:cat,product:prod,qty:qty.trim()||'—',date:TODAY,eta:ymdOf(eta),status:'In Transit',priority:prio,stops:r.opt.slice(1,-1),km:Math.round(r.n.k),startedAt:now,createdAt:now})
   await resources.deliveries.create({id:did,shipment:id,driver:drv.name,vehicle:drv.vehicle,eta:hhmm(eta),proof:'Pending',status:'In Transit',createdAt:now})
   await resources.drivers.update(drv.id,{status:'Active',route:`${start} → ${dest}`});await resources.customers.update(cust.id,{orders:cust.orders+1})
   await sendTo({name:cust.name,type:'Customer',ref:cust.id},`Your delivery ${id} (${prod}) has left ${start} for ${dest}. Expected by ${hhmm(eta)} on ${ymdOf(eta)}.`)
   await sendTo({name:drv.name,type:'Driver',ref:drv.id},`New delivery ${id}: ${r.opt.join(' → ')}. ${prod}${qty.trim()?', '+qty.trim():''}.`)
   await notify('Delivery dispatched',`${id} · ${start} → ${dest} with ${drv.name} (${drv.vehicle}).`)
   setDone({id,did,dest,eta:`${ymdOf(eta)} ${hhmm(eta)}`,driver:drv.name});setR(null);setQty('')}catch(e){setErr('Could not create the delivery: '+e.message)}setSending(false)}
 const recent=sh.items.filter(x=>x.startedAt||x.createdAt).sort((a,b)=>(b.startedAt||b.createdAt)-(a.startedAt||a.createdAt)).slice(0,5)
 return <div className="page rt">
  <GlassCard whileHover={{}}><div className="fgrid">
   <label>Start location<select value={start} onChange={e=>{setStart(e.target.value);setStops(s=>s.filter(x=>x!==e.target.value));setR(null)}}>{PLACES.map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Optimize for<select value={goal} onChange={e=>{setGoal(e.target.value);setR(null)}}>{['Distance','Time','Fuel'].map(g=><option key={g}>{g}</option>)}</select></label></div>
   <p className="muted">Stops (in the order you pick them)</p><div className="chips">{PLACES.filter(n=>n!==start).map(n=><button key={n} className={'chip2'+(stops.includes(n)?' on':'')} onClick={()=>toggle(n)}>{stops.includes(n)?stops.indexOf(n)+1+'. ':''}{n}</button>)}</div>
   <div className="actions"><button className="btn" disabled={busy||!stops.length} onClick={run}><Zap size={15}/> {busy?'Recalculating…':'Optimize route'}</button></div>
   {!stops.length&&<p className="err">Pick at least one stop.</p>}<small className="muted">Simulated optimization on straight-line distances between real West Bengal places. Replace with your routing service for road distances.</small></GlassCard>
  <div className="grid charts"><GlassCard whileHover={{}}><RouteMap start={start} stops={stops} orig={r?.orig} opt={r?.opt} height={440}/>
   <small className="muted">Amber dashed: your order · Blue: optimized for {goal.toLowerCase()}</small></GlassCard>
  <div className="col"><GlassCard whileHover={{}}><h3>Result</h3>{!r?<p className="muted">{busy?'Recalculating…':'Choose stops and select Optimize route.'}</p>:<div className="stack">
   {[['Original distance',<><Counter value={r.o.k} decimals={1}/> km</>],['Optimized distance',<><Counter value={r.n.k} decimals={1}/> km</>],['Time saved',<><Counter value={m.min} decimals={0}/> min</>],['Fuel saved',<><Counter value={m.fuel} decimals={1}/> L</>],['Cost saved',<>₹<Counter value={m.fuel*98} decimals={0}/></>],['Efficiency gain',<><Counter value={m.pct} decimals={1}/>%</>]].map(([a,b])=><div className="kv" key={a}><span>{a}</span><b>{b}</b></div>)}
   <small className="muted">Order: {r.opt.join(' → ')} · about {Math.round(r.n.h*60)} min on the road</small></div>}</GlassCard>
  <GlassCard whileHover={{}}><h3>Create delivery on this route</h3>
   {!custs.length||!drvs.length?<p className="muted">{!custs.length?'Add an active customer in Customer Management. ':''}{!drvs.length?'No driver is Available or Active in Drivers Management.':''}</p>:<div className="stack">
    <div className="fgrid"><label>Customer<select value={custId} onChange={e=>setCustId(e.target.value)}>{custs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     <label>Driver (vehicle {drv?.vehicle||'—'})<select value={drvId} onChange={e=>setDrvId(e.target.value)}>{drvs.map(d=><option key={d.id} value={d.id}>{d.name} · {d.status}</option>)}</select></label>
     <label>Category<select value={cat} onChange={e=>{setCat(e.target.value);setProd(PRODUCTS[e.target.value][0])}}>{CATS.map(c=><option key={c}>{c}</option>)}</select></label>
     <label>Product<select value={prod} onChange={e=>setProd(e.target.value)}>{PRODUCTS[cat].map(p=><option key={p}>{p}</option>)}</select></label>
     <label>Quantity<input value={qty} placeholder="e.g. 12 t or 300 boxes" onChange={e=>setQty(e.target.value)}/></label>
     <label>Priority<select value={prio} onChange={e=>setPrio(e.target.value)}>{['High','Medium','Low'].map(p=><option key={p}>{p}</option>)}</select></label></div>
    {err&&<p className="err" role="alert">{err}</p>}<button className="btn" disabled={sending||!r} onClick={dispatch}><Send size={15}/> {sending?'Creating…':r?'Dispatch delivery':'Optimize first'}</button></div>}
   {done&&<div className="okcard glass" role="status" style={{marginTop:12}}><b><CheckCircle2 size={16}/> {done.id} dispatched</b><small>{done.driver} to {done.dest}, expected {done.eta}. The customer and driver were messaged.</small>
    <div className="actions" style={{justifyContent:'flex-start'}}><Link className="btn" to="/tracking">Open live tracking</Link><Link className="btn ghost" to="/">Dashboard</Link></div></div>}</GlassCard>
  <GlassCard whileHover={{}}><h3>Recent dispatches</h3>{recent.map(x=><div className="kv" key={x.id}><span>{x.id} · {x.origin} → {x.destination}<br/><small>{x.driver} · {x.product||'—'}</small></span><b>{x.status}</b></div>)}{!recent.length&&<p className="muted">Nothing dispatched yet.</p>}</GlassCard></div></div></div>}
