import {CM} from '../utils/now.js'
import {useEffect,useMemo,useState} from 'react'
import {motion,AnimatePresence} from 'framer-motion'
import {Sparkles,CheckCircle2} from 'lucide-react'
import {GlassCard,Drawer,Modal} from '../components/ui.jsx'
import {monthly,months,growth} from '../data/analyticsData.js'
import {useResource} from '../hooks/useResource.js'
import {applied} from '../services/api.js'
import {buildSuggestions,canApply} from '../services/ai.js'
export default function AIIntelligence({admin}){
 const [mi,setMi]=useState(CM),[busy,setBusy]=useState(false),[view,setView]=useState(null),[confirm,setConfirm]=useState(null),[running,setRunning]=useState(null),[note,setNote]=useState(null),[done,setDone]=useState([])
 const sh=useResource('shipments'),dr=useResource('drivers'),cu=useResource('customers'),tx=useResource('transactions'),vh=useResource('vehicles')
 useEffect(()=>{let dead=false;const f=()=>applied.list().then(v=>{if(!dead)setDone(v)}).catch(()=>{});f();addEventListener('ms:applied',f);return()=>{dead=true;removeEventListener('ms:applied',f)}},[])
 useEffect(()=>{setBusy(true);const t=setTimeout(()=>setBusy(false),700);return()=>clearTimeout(t)},[mi])
 useEffect(()=>{if(!note)return;const t=setTimeout(()=>setNote(null),7000);return()=>clearTimeout(t)},[note])
 const list=useMemo(()=>buildSuggestions({shipments:sh.items,drivers:dr.items,customers:cu.items,transactions:tx.items,vehicles:vh.items},done),[sh.items,dr.items,cu.items,tx.items,vh.items,done])
 const m=monthly[mi],f=growth(mi,'fuel'),ot=+(m.onTime-(monthly[mi-1]?.onTime??m.onTime)).toFixed(1)
 const text=`Your logistics operation completed ${m.shipments.toLocaleString('en-IN')} shipments in ${months[mi]}${m.mtd?' so far':''}. On-time delivery is ${m.onTime}% (${ot>=0?'+':''}${ot} pts vs last month). Fuel consumption ${f>=0?'rose':'fell'} ${Math.abs(f)}%, with ${m.failed} failed deliveries and a profit of ₹${m.profit} lakh.`
 const apply=async s=>{setRunning(s.id);try{const res=await s.run(),rec={id:s.id,title:s.title,time:new Date().toISOString(),result:res,by:admin?.name||''};let saved=true;try{await applied.add(rec)}catch{saved=false}setDone(d=>[rec,...d].slice(0,30));setNote({ok:true,text:saved?res:res+' (The history entry could not be saved.)'})}catch(e){setNote({ok:false,text:'Could not apply: '+e.message})}setRunning(null);setConfirm(null);setView(null)}
 const allowed=s=>canApply(admin?.role,s.needs)
 return <div className="page">
  <GlassCard className="ai-hero" whileHover={{}}><div className="orb"/><div><div className="toolbar"><h3><Sparkles size={16}/> Monthly summary</h3>
   <select value={mi} onChange={e=>setMi(+e.target.value)} aria-label="Month">{months.map((x,i)=><option key={x} value={i}>{x} 2026</option>)}</select></div>
   {busy?<div className="skel"><i/><i/><i style={{width:'60%'}}/></div>:<motion.p initial={{opacity:0}} animate={{opacity:1}}>{text}</motion.p>}
   <small className="muted">Rule-based summary and suggestions built from your live records. No AI model is connected.</small></div></GlassCard>
  <AnimatePresence>{note&&<motion.div role="status" className={'glass '+(note.ok?'okcard':'')} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><b>{note.ok?<><CheckCircle2 size={16}/> Applied. </>:null}{note.text}</b></motion.div>}</AnimatePresence>
  <div className="grid sugg">{list.map(s=><GlassCard key={s.id}><span className={'badge p'+s.priority}>{s.priority}</span><h3>{s.title}</h3><p className="muted">{s.desc}</p>
   <div className="kv"><span>Potential savings</span><b>{s.savings}</b></div><div className="kv"><span>Expected impact</span><b>{s.impact}</b></div><div className="kv"><span>Confidence</span><b>{s.confidence}%</b></div>
   <div className="actions"><button className="btn ghost" onClick={()=>setView(s)}>View details</button><button className="btn" disabled={running===s.id||!allowed(s)} title={allowed(s)?undefined:'Needs a Super Admin or Admin'} onClick={()=>setConfirm(s)}>{running===s.id?'Applying…':'Apply suggestion'}</button></div></GlassCard>)}
   {!list.length&&<GlassCard whileHover={{}}><h3>Nothing needs action</h3><p className="muted">Payments, shipments, drivers and vehicles are all on track. New suggestions appear here as your data changes.</p></GlassCard>}</div>
  <GlassCard whileHover={{}}><h3>Applied by your team</h3>{done.slice(0,6).map((d,i)=><div className="kv" key={d.id+i}><span>{d.title}<br/><small>{d.result||''}</small></span><b style={{textAlign:'right'}}>{d.time?new Date(d.time).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):''}<br/><small>{d.by}</small></b></div>)}{!done.length&&<p className="muted">Nothing applied yet.</p>}</GlassCard>
  <Drawer open={!!view} onClose={()=>setView(null)} title={view?.title}>{view&&<div className="stack"><p>{view.desc}</p>{[['Related',view.ref],['Expected impact',view.impact],['Potential savings',view.savings],['Confidence',view.confidence+'%']].map(([a,b])=><div className="kv" key={a}><span>{a}</span><b>{b}</b></div>)}
   <h3>What Apply will do</h3><ul>{view.changes.map(c=><li key={c}>{c}</li>)}</ul>{!allowed(view)&&<p className="err">Only a Super Admin or Admin can apply this.</p>}<button className="btn" disabled={!allowed(view)} onClick={()=>setConfirm(view)}>Apply suggestion</button></div>}</Drawer>
  <Modal open={!!confirm} onClose={()=>setConfirm(null)} title="Apply this suggestion?">{confirm&&<><p className="muted">{confirm.title}. This will make these real changes:</p><ul>{confirm.changes.map(c=><li key={c}>{c}</li>)}</ul>
   <div className="actions"><button className="btn ghost" onClick={()=>setConfirm(null)}>Cancel</button><button className="btn" disabled={!!running} onClick={()=>apply(confirm)}>{running?'Applying…':'Apply now'}</button></div></>}</Modal>
 </div>}
