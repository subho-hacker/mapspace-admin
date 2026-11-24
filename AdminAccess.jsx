import {useCallback,useEffect,useState} from 'react'
import {UserPlus,KeyRound,ShieldOff,ShieldCheck,Trash2,Copy} from 'lucide-react'
import {GlassCard,Modal} from './ui.jsx'
import {apiMode} from '../services/api.js'
import {listAdmins,addAdmin,resetKey,setOff,removeAdmin,recentLogins,listPermits,requestPermit,cancelPermit,decidePermit} from '../services/auth.js'
const fmt=t=>t?new Date(t).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'Never'
export default function AdminAccess({admin}){
 const [list,setList]=useState([]),[logs,setLogs]=useState([]),[ps,setPs]=useState([]),[form,setForm]=useState(null),[shown,setShown]=useState(null),[rm,setRm]=useState(null),[pd,setPd]=useState(null),[dec,setDec]=useState(null),[kv,setKv]=useState(''),[err,setErr]=useState(''),[note,setNote]=useState(''),[copied,setCopied]=useState(false)
 const isSuper=admin.role==='Super Admin'
 const load=useCallback(async()=>{try{const [a,l,p]=await Promise.all([listAdmins(),recentLogins(),listPermits()]);setList(a);setLogs(l);setPs(p)}catch{}},[])
 useEffect(()=>{if(!isSuper)return;load();const ev=['ms:admins','ms:permits'];ev.forEach(e=>addEventListener(e,load));const t=setInterval(load,apiMode==='Connected'?8000:15000);return()=>{ev.forEach(e=>removeEventListener(e,load));clearInterval(t)}},[isSuper,load])
 if(admin.role!=='Super Admin')return <GlassCard whileHover={{}}><h3>Admin access</h3><p className="muted">Only a Super Admin can add, suspend or remove admins, or change login keys.</p></GlassCard>
 const run=async f=>{setErr('');setNote('');try{await f();await load()}catch(e){setErr(e.message)}}
 const last=id=>logs.find(l=>l.id===id)?.time
 const create=()=>run(async()=>{if(form.name.trim().length<2)throw new Error('Enter the admin name.');const r=await addAdmin(form.name.trim(),form.role,admin);setShown({...r,name:form.name});setForm(null)})
 const suspend=a=>a.off?run(async()=>setOff(a.id,false,admin)):a.role==='Super Admin'?(setErr(''),setPd({action:'suspend',t:a})):run(async()=>setOff(a.id,true,admin))
 const removeIt=a=>a.role==='Super Admin'?(setErr(''),setPd({action:'remove',t:a})):(setErr(''),setRm(a))
 const ask=()=>run(async()=>{const p=await requestPermit(admin,pd.action,pd.t.id);setPd(null);setNote(p.mode==='approval'?'Permit requested. Another Super Admin must approve it.':'Permit requested. Authorise it below with your login key.')})
 const confirmDec=()=>run(async()=>{await decidePermit(admin,dec.id,true,kv);setDec(null);setKv('');setNote('Permit approved and applied.')})
 const copy=async()=>{try{await navigator.clipboard.writeText(`Admin ID: ${shown.id}\nLogin key: ${shown.key}`);setCopied(true)}catch{setErr('Copy failed. Select the key and copy it manually.')}}
 return <GlassCard whileHover={{}}><div className="toolbar"><h3>Admin access and login keys</h3><button className="btn" onClick={()=>{setErr('');setForm({name:'',role:'Admin'})}}><UserPlus size={15}/> Add admin</button></div>
  <small className="muted">Super Admins control everything. Admins and Managers cannot manage other admins. Suspending or removing another Super Admin needs a permit.</small>
  <div className="scroll"><table className="static"><thead><tr><th>Admin ID</th><th>Name</th><th>Role</th><th>Last sign-in</th><th>Status</th><th>Actions</th></tr></thead><tbody>
   {list.map(a=><tr key={a.id}><td>{a.id}</td><td>{a.name}{a.id===admin.id&&' (you)'}</td><td>{a.role}</td><td>{fmt(last(a.id))}</td><td><span className={'badge b-'+(a.off?'bad':'ok')}>{a.off?'Suspended':'Active'}</span></td>
    <td className="acts">{(a.role!=='Super Admin'||a.id===admin.id)&&<button className="icon" title="Issue new key" aria-label={`New key for ${a.id}`} onClick={()=>run(async()=>setShown({...await resetKey(a.id,admin),name:a.name}))}><KeyRound size={16}/></button>}
     {a.id!==admin.id&&<><button className="icon" title={a.off?'Reactivate':'Suspend'} aria-label={a.off?'Reactivate':'Suspend'} onClick={()=>suspend(a)}>{a.off?<ShieldCheck size={16}/>:<ShieldOff size={16}/>}</button>
     <button className="icon dng" title="Remove" aria-label={`Remove ${a.id}`} onClick={()=>removeIt(a)}><Trash2 size={16}/></button></>}</td></tr>)}</tbody></table></div>
  {err&&!form&&!pd&&!dec&&!rm&&<p className="err" role="alert">{err}</p>}{note&&<p className="up" role="status">{note}</p>}
  <h3 style={{marginTop:16}}>Permit requests</h3>{ps.slice(0,6).map(p=>{const ok=p.mode==='approval'?(admin.id!==p.by&&admin.id!==p.target):admin.id===p.by,mins=Math.max(1,Math.ceil((p.expires-Date.now())/6e4))
   return <div className="permit" key={p.id}><span>{p.byName} wants to <b>{p.action}</b> {p.targetName}<br/><small className="muted">{p.status==='Pending'?`${p.mode==='approval'?'Needs another Super Admin':'No other Super Admin: requester authorises with their key'} · expires in ${mins} min`:`${p.status}${p.decidedByName?' by '+p.decidedByName:''}`}</small></span>
    {p.status==='Pending'&&<span className="acts">{ok&&<button className="btn" onClick={()=>{setErr('');setKv('');setDec(p)}}>{p.mode==='self'?'Authorise with my key':'Approve with my key'}</button>}{ok&&p.mode==='approval'&&<button className="btn ghost" onClick={()=>run(async()=>decidePermit(admin,p.id,false))}>Reject</button>}{admin.id===p.by&&<button className="btn ghost" onClick={()=>run(async()=>cancelPermit(admin,p.id))}>Cancel</button>}</span>}</div>})}
  {!ps.length&&<p className="muted">No permit requests.</p>}
  <h3 style={{marginTop:16}}>Recent sign-ins</h3>{logs.slice(0,5).map((l,i)=><div className="kv" key={i}><span>{l.name} · {l.id}</span><b>{fmt(l.time)}</b></div>)}{!logs.length&&<p className="muted">No sign-ins recorded yet.</p>}
  <p className="muted">{apiMode==='Connected'?'Keys, permits and sign-ins are stored in MongoDB and checked by your server on every request.':'Keys and permits are checked in this browser. Set VITE_API_URL to move them to your server.'}</p>
  <Modal open={!!form} onClose={()=>setForm(null)} title="Add admin">{form&&<><label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{['Admin','Manager','Super Admin'].map(r=><option key={r}>{r}</option>)}</select></label>{err&&<p className="err" role="alert">{err}</p>}
   <div className="actions"><button className="btn ghost" onClick={()=>setForm(null)}>Cancel</button><button className="btn" onClick={create}>Create and generate key</button></div></>}</Modal>
  <Modal open={!!shown} onClose={()=>{setShown(null);setCopied(false)}} title="Login key">{shown&&<><p className="muted">Share this with {shown.name} privately. It is shown only once and cannot be recovered; issue a new key if it is lost.</p>
   <div className="kv"><span>Admin ID</span><b>{shown.id}</b></div><div className="kv"><span>Login key</span><b style={{letterSpacing:1}}>{shown.key}</b></div>
   <div className="actions"><button className="btn ghost" onClick={copy}><Copy size={15}/> {copied?'Copied':'Copy'}</button><button className="btn" onClick={()=>{setShown(null);setCopied(false)}}>Done</button></div></>}</Modal>
  <Modal open={!!rm} onClose={()=>setRm(null)} title="Remove admin?"><p className="muted">{rm&&`${rm.name} (${rm.id}) will lose access immediately.`}</p>{err&&<p className="err" role="alert">{err}</p>}<div className="actions"><button className="btn ghost" onClick={()=>setRm(null)}>Keep</button><button className="btn danger" onClick={()=>run(async()=>{await removeAdmin(rm.id,admin);setRm(null)})}>Remove</button></div></Modal>
  <Modal open={!!pd} onClose={()=>setPd(null)} title="Permit required">{pd&&<><p className="muted">To {pd.action} {pd.t.name} (another Super Admin) you need a permit. {list.filter(x=>x.role==='Super Admin'&&!x.off&&x.id!==admin.id&&x.id!==pd.t.id).length?'A different Super Admin must approve it with their own login key. The request stays open for 30 minutes.':'No other Super Admin can approve, so you will authorise it yourself by re-entering your login key.'}</p>{err&&<p className="err" role="alert">{err}</p>}
   <div className="actions"><button className="btn ghost" onClick={()=>setPd(null)}>Cancel</button><button className="btn danger" onClick={ask}>Request permit</button></div></>}</Modal>
  <Modal open={!!dec} onClose={()=>setDec(null)} title="Confirm with your login key">{dec&&<><p className="muted">{dec.byName} wants to {dec.action} {dec.targetName}. Enter your own login key to approve.</p><label>Your login key<input type="password" value={kv} onChange={e=>setKv(e.target.value)} onKeyDown={e=>e.key==='Enter'&&confirmDec()} autoComplete="current-password"/></label>{err&&<p className="err" role="alert">{err}</p>}
   <div className="actions"><button className="btn ghost" onClick={()=>setDec(null)}>Cancel</button><button className="btn danger" onClick={confirmDec}>Approve and apply</button></div></>}</Modal></GlassCard>}
