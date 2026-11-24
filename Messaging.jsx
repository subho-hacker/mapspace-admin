import {useEffect,useRef,useState} from 'react'
import {motion,AnimatePresence} from 'framer-motion'
import {Send,Trash2,Search,Plus,BellRing,UserPlus} from 'lucide-react'
import {GlassCard,Modal} from '../components/ui.jsx'
import {useResource} from '../hooks/useResource.js'
import {resources} from '../services/api.js'
import {sendTo,nextSeq,inr} from '../services/comms.js'
import {PLACES} from '../data/trackData.js'
const REPLY={Driver:'Received. I will update you shortly.',Customer:'Thank you, noted. We will get back to you.',Company:'Acknowledged. Thanks for the update.'}
const sum=a=>a.reduce((s,x)=>s+x.amount,0)
// Chats are live views of Customer and Driver records and of payments. Adding or deleting a customer or driver here changes the same records used everywhere else.
export default function Messaging({admin}){
 const {items,update,remove,create}=useResource('conversations'),cu=useResource('customers'),dr=useResource('drivers'),tx=useResource('transactions')
 const [sel,setSel]=useState(null),[tab,setTab]=useState('All'),[q,setQ]=useState(''),[txt,setTxt]=useState(''),[typing,setTyping]=useState(false),[nw,setNw]=useState(false),[nt,setNt]=useState('Customer'),[nq,setNq]=useState(''),[add,setAdd]=useState(null),[err,setErr]=useState(''),[delC,setDelC]=useState(false),[sent,setSent]=useState(''),end=useRef()
 const can=['Super Admin','Admin'].includes(admin?.role)
 const list=items.filter(c=>(tab==='All'||(tab==='Unread'?c.unread>0:c.type===tab))&&(c.name+c.messages.map(m=>m.text).join(' ')).toLowerCase().includes(q.toLowerCase()))
 const cur=items.find(c=>c.id===sel)||list[0]
 const rec=cur&&(cur.type==='Customer'?cu.items.find(x=>x.id===cur.ref||x.name===cur.name):cur.type==='Driver'?dr.items.find(x=>x.id===cur.ref||x.name===cur.name):null)
 const dues=cur?.type==='Customer'?tx.items.filter(x=>x.type==='Revenue'&&x.status!=='Paid'&&x.party===cur.name):[]
 useEffect(()=>{end.current?.scrollIntoView?.({behavior:'smooth'})},[cur?.messages.length,typing])
 useEffect(()=>{if(cur?.unread)update(cur.id,{unread:0})},[cur?.id,cur?.unread])
 const send=async()=>{if(!txt.trim()||!cur)return;const t=txt.trim();setTxt('');await sendTo(cur,t,'me');const r=REPLY[cur.type];if(r){setTyping(true);setTimeout(async()=>{await sendTo(cur,r,'them');setTyping(false)},1500)}}
 const remind=async()=>{await sendTo(cur,`Payment reminder: ${dues.length} invoice(s) totalling ${inr(sum(dues))} are unpaid (oldest due ${dues.map(d=>d.due).sort()[0]}). Please arrange payment at the earliest.`,'me');for(const r of dues)await resources.transactions.update(r.id,{remindedAt:new Date().toISOString(),reminders:(r.reminders||0)+1});setSent('Reminder sent.');setTimeout(()=>setSent(''),3000)}
 const comps=[...new Set(tx.items.filter(x=>!['Revenue','Salary'].includes(x.type)).map(x=>x.party))]
 const pool=(nt==='Customer'?cu.items.map(c=>({name:c.name,type:'Customer',ref:c.id,sub:`${c.city} · ${c.status}`})):nt==='Driver'?dr.items.filter(d=>d.status!=='Resigned').map(d=>({name:d.name,type:'Driver',ref:d.id,sub:`${d.vehicle} · ${d.status}`})):comps.map(n=>({name:n,type:'Company',ref:null,sub:'Supplier'}))).filter(c=>c.name.toLowerCase().includes(nq.toLowerCase()))
 const openChat=async c=>{const ex=items.find(x=>x.name===c.name&&x.type===c.type);if(ex)setSel(ex.id);else{const id=nextSeq(items,'T-');await create({id,name:c.name,type:c.type,ref:c.ref,unread:0,messages:[]});setSel(id)}setNw(false);setAdd(null);setNq('')}
 const saveCustomer=async()=>{const f=add;if(f.name.trim().length<2||f.phone.trim().length<6)return setErr('Enter the company name and a phone number.');if(cu.items.some(c=>c.name.toLowerCase()===f.name.trim().toLowerCase()))return setErr('A customer with this name already exists.')
  const r={id:nextSeq(cu.items,'C-'),name:f.name.trim(),phone:f.phone.trim(),city:f.city,type:f.type,orders:0,status:'Active',createdAt:Date.now()};await cu.create(r);await openChat({name:r.name,type:'Customer',ref:r.id})}
 const delContact=async()=>{if(rec)await (cur.type==='Customer'?cu:dr).remove(rec.id);await remove(cur.id);setSel(null);setDelC(false)}
 return <div className="page chat">
  <GlassCard className="clist" whileHover={{}}><button className="btn" onClick={()=>{setNw(true);setErr('')}}><Plus size={15}/> New chat</button><div className="srch"><Search size={15}/><input placeholder="Search messages" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="tabs">{['All','Unread','Driver','Customer','Company','System'].map(t=><button key={t} className={t===tab?'on':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
   {list.map(c=><button key={c.id} className={'conv'+(cur?.id===c.id?' on':'')} onClick={()=>setSel(c.id)}><b>{c.name}</b><small>{c.messages.at(-1)?.text||'No messages yet'}</small>{c.unread>0&&<i className="badgeN">{c.unread}</i>}</button>)}
   {!list.length&&<p className="muted pad">No conversations match.</p>}</GlassCard>
  <GlassCard className="cpanel" whileHover={{}}>{cur?<>
   <div className="toolbar"><h3>{cur.name} <small>{cur.type}</small></h3><span className="acts">{rec&&<button className="icon dng" title={`Delete this ${cur.type.toLowerCase()} and the chat`} aria-label="Delete contact" onClick={()=>setDelC(true)}><Trash2 size={16}/></button>}{!rec&&<button className="icon dng" title="Delete chat" aria-label="Delete conversation" onClick={()=>{remove(cur.id);setSel(null)}}><Trash2 size={16}/></button>}</span></div>
   {cur.type==='Customer'&&<small className="muted">{rec?`${rec.city} · ${rec.phone} · ${rec.orders} orders`:'This customer is no longer in Customer Management.'}{dues.length>0&&<> · <b className="down">{inr(sum(dues))} unpaid</b></>}</small>}
   {cur.type==='Driver'&&<small className="muted">{rec?`${rec.vehicle} · ${rec.route} · ${rec.status}`:'This driver is no longer in Drivers Management.'}</small>}
   {dues.length>0&&can&&<div><button className="btn ghost" onClick={remind}><BellRing size={15}/> Send payment reminder</button> {sent&&<small className="up" role="status">{sent}</small>}</div>}
   <div className="msgs"><AnimatePresence initial={false}>{cur.messages.map(m=><motion.div key={m.id} className={'bub '+m.from} initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}}>{m.text}<small>{m.time}</small></motion.div>)}</AnimatePresence>
    {typing&&<div className="bub them typing"><i/><i/><i/></div>}<div ref={end}/></div>
   {cur.type==='System'?<small className="muted">System alerts are read-only.</small>:<><div className="compose"><input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={`Message ${cur.name}`}/><button className="btn" onClick={send} aria-label="Send"><Send size={16}/></button></div><small className="muted">Replies are simulated until your backend is connected.</small></>}</>:<p className="muted">Select a conversation or start a new chat.</p>}</GlassCard>
  <Modal open={nw} onClose={()=>{setNw(false);setAdd(null)}} title={add?'Add customer':'Start a chat'}>{add?<><div className="fgrid"><label>Company name<input value={add.name} onChange={e=>setAdd({...add,name:e.target.value})}/></label><label>Phone<input value={add.phone} onChange={e=>setAdd({...add,phone:e.target.value})}/></label>
    <label>City<select value={add.city} onChange={e=>setAdd({...add,city:e.target.value})}>{PLACES.map(p=><option key={p}>{p}</option>)}</select></label><label>Type<select value={add.type} onChange={e=>setAdd({...add,type:e.target.value})}>{['Enterprise','SME','Retail'].map(p=><option key={p}>{p}</option>)}</select></label></div>
    {err&&<p className="err" role="alert">{err}</p>}<div className="actions"><button className="btn ghost" onClick={()=>setAdd(null)}>Back</button><button className="btn" onClick={saveCustomer}>Add customer and open chat</button></div></>
   :<><div className="tabs">{['Customer','Driver','Company'].map(t=><button key={t} className={t===nt?'on':''} onClick={()=>setNt(t)}>{t}s</button>)}</div>
    <div className="srch"><Search size={15}/><input placeholder={`Search ${nt.toLowerCase()}s`} value={nq} onChange={e=>setNq(e.target.value)}/></div>
    <div style={{maxHeight:280,overflow:'auto'}}>{pool.map(c=><button key={c.type+c.name} className="conv" style={{width:'100%'}} onClick={()=>openChat(c)}><b>{c.name}</b><small>{c.sub}</small></button>)}{!pool.length&&<p className="muted">No {nt.toLowerCase()}s found.</p>}</div>
    {nt==='Customer'&&<button className="btn ghost" onClick={()=>{setErr('');setAdd({name:'',phone:'',city:PLACES[0],type:'SME'})}}><UserPlus size={15}/> Add a new customer</button>}</>}</Modal>
  <Modal open={delC} onClose={()=>setDelC(false)} title={`Delete ${cur?.type?.toLowerCase()}?`}><p className="muted">{cur&&`${cur.name} will be removed from ${cur.type==='Customer'?'Customer':'Drivers'} Management and this chat will be deleted. Existing shipments keep the name.`}</p>
   <div className="actions"><button className="btn ghost" onClick={()=>setDelC(false)}>Keep</button><button className="btn danger" onClick={delContact}>Delete</button></div></Modal></div>}
