import {useEffect,useRef,useState} from 'react'
import {useNavigate,NavLink} from 'react-router-dom'
import {motion,AnimatePresence} from 'framer-motion'
import {Search,Mail} from 'lucide-react'
import {searchAll} from '../services/api.js'
import {useResource} from '../hooks/useResource.js'
export function SearchBox(){
 const [open,setOpen]=useState(false),[q,setQ]=useState(''),[res,setRes]=useState([]),nav=useNavigate(),ref=useRef()
 useEffect(()=>{const k=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();setOpen(true)}if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[])
 useEffect(()=>{if(open)setTimeout(()=>ref.current?.focus(),50)},[open])
 useEffect(()=>{if(!q.trim()){setRes([]);return}const t=setTimeout(()=>searchAll(q).then(setRes).catch(()=>setRes([])),150);return()=>clearTimeout(t)},[q])
 const go=r=>{nav(`${r.to}?q=${encodeURIComponent(r.term)}`);setOpen(false);setQ('')}
 return <div className="search"><button className="icon" aria-label="Search (Ctrl+K)" onClick={()=>setOpen(true)}><Search size={20}/></button>
  <AnimatePresence>{open&&<><div className="backdrop clear" onClick={()=>setOpen(false)}/>
   <motion.div className="glass sbox" initial={{opacity:0,y:-8,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} transition={{type:'spring',stiffness:340,damping:28}}>
    <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search drivers, shipments, vehicles, customers…" onKeyDown={e=>e.key==='Enter'&&res[0]&&go(res[0])}/>
    {q&&<ul>{res.map((r,i)=><li key={i}><button onClick={()=>go(r)}><b>{r.label}</b><small>{r.type} · {r.sub}</small></button></li>)}{!res.length&&<li className="muted pad">No results for “{q}”. Check the spelling or try an ID.</li>}</ul>}</motion.div></>}</AnimatePresence></div>}
export function MailLink(){
 const {items}=useResource('conversations');const n=items.reduce((s,c)=>s+(c.unread||0),0)
 return <NavLink to="/messages" className="icon mail" aria-label={`Messages, ${n} unread`}><Mail size={20}/>{n>0&&<i className="badgeN">{n}</i>}</NavLink>}
