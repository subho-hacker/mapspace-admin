import {useEffect,useMemo,useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {motion,AnimatePresence} from 'framer-motion'
import {Plus,Pencil,Trash2,Download,Copy,Undo2} from 'lucide-react'
import {GlassCard,KPI,Modal} from './ui.jsx'
import {useResource} from '../hooks/useResource.js'
const OK=['Active','Available','Delivered','Paid','Completed','Read'],WARN=['Pending','On Leave','Medium','Unread','Inactive'],BAD=['Delayed','Cancelled','Resigned','Failed','High','Overdue','Critical']
export const tone=v=>OK.includes(v)?'ok':WARN.includes(v)?'warn':BAD.includes(v)?'bad':'info'
const PER=10
// Config-driven CRUD page: columns [{key,label,type,options,form,tone,fmt,render}]. Backend swap happens in services/api.js only.
export default function ResourcePage({name,noun,prefix,columns,statusKey,kpis,extra,actions=[]}){
 const {items,create,update,remove}=useResource(name);const [sp]=useSearchParams()
 const [q,setQ]=useState(sp.get('q')||''),[st,setSt]=useState('All'),[page,setPage]=useState(0),[sort,setSort]=useState({k:columns[0].key,d:1}),[form,setForm]=useState(null),[del,setDel]=useState(null),[err,setErr]=useState({}),[msg,setMsg]=useState(''),[sel,setSel]=useState([]),[undo,setUndo]=useState(null)
 useEffect(()=>{setQ(sp.get('q')||'');setPage(0)},[sp])
 const flash=m=>{setMsg(m);setTimeout(()=>setMsg(''),2500)}
 const del1=async rs=>{for(const r of rs)await remove(r.id);setSel([]);setUndo(rs);clearTimeout(window.__msu);window.__msu=setTimeout(()=>setUndo(null),8000)}
 const restore=async()=>{for(const r of undo)await create(r);flash(`${undo.length} restored`);setUndo(null)}
 const dup=async r=>{await create({...r,id:nextId});flash(`${noun} duplicated`)}
 const bulk=async v=>{if(!v)return;for(const id of sel)await update(id,{[statusKey]:v});flash(`${sel.length} updated`);setSel([])}
 const stCol=columns.find(c=>c.key===statusKey)
 const rows=useMemo(()=>items.filter(r=>(st==='All'||r[statusKey]===st)&&Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase())).sort((a,b)=>(a[sort.k]>b[sort.k]?1:-1)*sort.d),[items,q,st,sort,statusKey])
 const pages=Math.max(1,Math.ceil(rows.length/PER)),view=rows.slice(page*PER,page*PER+PER),fields=columns.filter(c=>c.form!==false)
 const nextId=`${prefix}${String(Math.max(0,...items.map(r=>+String(r.id).replace(/\D/g,'')||0))+1).padStart(3,'0')}`
 const openAdd=()=>{setErr({});setForm({mode:'add',data:Object.fromEntries(fields.map(c=>[c.key,c.type==='select'?c.options[0]:'']))})}
 const save=async()=>{const e={};fields.forEach(c=>{const v=form.data[c.key];if(c.type==='number'?(v===''||isNaN(v)||+v<0):!String(v??'').trim())e[c.key]='Required'});setErr(e);if(Object.keys(e).length)return
  const d={...form.data};fields.forEach(c=>{if(c.type==='number')d[c.key]=+d[c.key]})
  if(form.mode==='add')await create({...d,id:nextId,createdAt:Date.now()});else await update(d.id,d);flash(`${noun} ${form.mode==='add'?'added':'saved'}`);setForm(null)}
 const exportCsv=()=>{const h=Object.keys(items[0]||{id:1});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([[h.join(','),...rows.map(r=>h.map(k=>`"${r[k]}"`).join(','))].join('\n')],{type:'text/csv'}));a.download=`mapspace-${name}.csv`;a.click()}
 const th=c=><th key={c.key} onClick={()=>setSort({k:c.key,d:sort.k===c.key?-sort.d:1})}>{c.label}{sort.k===c.key?(sort.d>0?' ↑':' ↓'):''}</th>
 return <div className="page">
  {kpis&&<div className="grid kpis">{kpis(items).map(k=><KPI key={k.label} {...k}/>)}</div>}
  {extra&&extra(items)}
  <GlassCard className="tablecard" whileHover={{}}>
   <div className="toolbar"><input placeholder={`Search ${noun}s`} value={q} onChange={e=>{setQ(e.target.value);setPage(0)}} aria-label={`Search ${noun}s`}/>
    {stCol&&<select value={st} onChange={e=>{setSt(e.target.value);setPage(0)}} aria-label="Status filter">{['All',...stCol.options].map(s=><option key={s}>{s}</option>)}</select>}
    {sel.length>0&&<><b>{sel.length} selected</b>{stCol&&<select aria-label="Set status for selected" value="" onChange={e=>bulk(e.target.value)}><option value="">Set status…</option>{stCol.options.map(o=><option key={o}>{o}</option>)}</select>}<button className="btn danger" onClick={()=>del1(items.filter(r=>sel.includes(r.id)))}><Trash2 size={15}/> Delete selected</button></>}
    <button className="btn ghost" onClick={exportCsv}><Download size={15}/> Export CSV</button><button className="btn" onClick={openAdd}><Plus size={15}/> Add {noun}</button></div>
   <div className="scroll"><table className="static"><thead><tr><th><input type="checkbox" aria-label="Select all on page" checked={view.length>0&&view.every(r=>sel.includes(r.id))} onChange={e=>setSel(e.target.checked?[...new Set([...sel,...view.map(r=>r.id)])]:sel.filter(id=>!view.some(r=>r.id===id)))}/></th>{columns.map(th)}<th>Actions</th></tr></thead><tbody>
    {view.map((r,i)=><motion.tr key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.02}}><td><input type="checkbox" aria-label={`Select ${r.id}`} checked={sel.includes(r.id)} onChange={()=>setSel(sel.includes(r.id)?sel.filter(x=>x!==r.id):[...sel,r.id])}/></td>
     {columns.map(c=><td key={c.key}>{c.render?c.render(r):c.tone?<span className={'badge b-'+tone(r[c.key])}>{r[c.key]}</span>:c.fmt?c.fmt(r[c.key]):r[c.key]}</td>)}
     <td className="acts">{actions.filter(a=>!a.show||a.show(r)).map(a=><button key={a.label} className="icon" title={a.label} aria-label={a.label} onClick={()=>{if(a.run(r,{update})!==false)flash(a.label+' done')}}><a.icon size={16}/></button>)}
      <button className="icon" title="Duplicate" aria-label={`Duplicate ${r.id}`} onClick={()=>dup(r)}><Copy size={16}/></button>
      <button className="icon" title="Edit" aria-label={`Edit ${r.id}`} onClick={()=>{setErr({});setForm({mode:'edit',data:{...r}})}}><Pencil size={16}/></button>
      <button className="icon dng" title="Delete" aria-label={`Delete ${r.id}`} onClick={()=>setDel(r)}><Trash2 size={16}/></button></td></motion.tr>)}</tbody></table>
    {!view.length&&<p className="muted pad">No {noun}s match. Clear the search or add a new {noun}.</p>}</div>
   <div className="pager"><button className="btn ghost" disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {pages} · {rows.length} {noun}s</span><button className="btn ghost" disabled={page>=pages-1} onClick={()=>setPage(page+1)}>Next</button></div></GlassCard>
  <Modal open={!!form} onClose={()=>setForm(null)} title={form?.mode==='add'?`Add ${noun}`:`Edit ${noun}`}>{form&&<>
   <div className="fgrid">{fields.map(c=><label key={c.key}>{c.label}
    {c.type==='select'?<select value={form.data[c.key]} onChange={e=>setForm({...form,data:{...form.data,[c.key]:e.target.value}})}>{c.options.map(o=><option key={o}>{o}</option>)}</select>
     :<input type={c.type||'text'} min={c.type==='number'?0:undefined} value={form.data[c.key]} onChange={e=>setForm({...form,data:{...form.data,[c.key]:e.target.value}})}/>}
    {err[c.key]&&<span className="err">{c.label} is required</span>}</label>)}</div>
   <div className="actions"><button className="btn ghost" onClick={()=>setForm(null)}>Cancel</button><button className="btn" onClick={save}>Save changes</button></div></>}</Modal>
  <Modal open={!!del} onClose={()=>setDel(null)} title={`Delete ${noun}?`}><p className="muted">{del&&`${del.id} will be removed. You can undo right after.`}</p>
   <div className="actions"><button className="btn ghost" onClick={()=>setDel(null)}>Keep</button><button className="btn danger" onClick={async()=>{await del1([del]);setDel(null)}}>Delete {noun}</button></div></Modal>
  <AnimatePresence>{undo&&<motion.div className="glass toast" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{undo.length} {noun}(s) deleted <button className="btn ghost" onClick={restore}><Undo2 size={14}/> Undo</button></motion.div>}{!undo&&msg&&<motion.div className="glass toast" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{msg}</motion.div>}</AnimatePresence></div>}
