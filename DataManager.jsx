import {useRef,useState} from 'react'
import {Download,Upload,Trash2} from 'lucide-react'
import {GlassCard,Modal} from './ui.jsx'
import {exportDB,importDB,wipeDB,apiMode} from '../services/api.js'
import {download} from '../utils/download.js'
export default function DataManager(){
 const f=useRef(),[pend,setPend]=useState(null),[err,setErr]=useState(''),[ok,setOk]=useState(''),[wipe,setWipe]=useState(false),[typed,setTyped]=useState(''),remote=apiMode==='Connected'
 const backup=async()=>{try{const o=await exportDB();download(`mapspace-backup-${o.exportedAt.slice(0,10)}.json`,JSON.stringify(o,null,2),'application/json');setOk('Backup downloaded.');setErr('')}catch(x){setOk('');setErr(x.message)}}
 const pick=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{const o=JSON.parse(await file.text());if(o?.app!=='mapspace')throw new Error('This is not a MapSpace backup file.');setPend(o);setErr('');setOk('')}catch(x){setErr(x instanceof SyntaxError?'That file is not valid JSON.':x.message)}}
 const restore=async()=>{try{await importDB(pend)}catch(x){setErr(x.message);setPend(null)}}
  const erase=async()=>{try{await wipeDB()}catch(x){setErr(x.message);setWipe(false)}}
 return <GlassCard whileHover={{}}><h3>Backup, restore and delete</h3>
  <p className="muted">{remote?'Your data lives in MongoDB. A backup file holds records, messages, settings and AI history. Admin accounts and login keys are never included.':'Covers drivers, shipments, deliveries, customers, finance, notifications, messages and saved settings in this browser.'}</p>
  <div className="stack"><button className="btn" onClick={backup}><Download size={15}/> Download backup</button>
   <button className="btn ghost" onClick={()=>f.current.click()}><Upload size={15}/> Restore from backup file</button><input ref={f} type="file" accept="application/json,.json" hidden onChange={pick}/>
   <button className="btn danger" onClick={()=>{setTyped('');setWipe(true)}}><Trash2 size={15}/> Delete entire database</button></div>
  {ok&&<p className="up">{ok}</p>}{err&&<p className="err" role="alert">{err}</p>}
  <Modal open={!!pend} onClose={()=>setPend(null)} title="Restore this backup?"><p className="muted">Backup from {pend&&new Date(pend.exportedAt).toLocaleString('en-IN')}. It replaces all current data.</p>
   <p>{pend&&Object.entries(pend.data||{}).map(([k,v])=>`${k}: ${Array.isArray(v)?v.length:'?'}`).join(' · ')}</p>
   <div className="actions"><button className="btn ghost" onClick={()=>setPend(null)}>Cancel</button><button className="btn" onClick={restore}>Restore data</button></div></Modal>
  <Modal open={wipe} onClose={()=>setWipe(false)} title="Delete entire database?"><p className="muted">This permanently empties every collection and clears saved settings and applied AI suggestions. Download a backup first if you may need it.</p>
   <button className="btn ghost" onClick={backup}><Download size={15}/> Download backup first</button>
   <label>Type DELETE to confirm<input value={typed} onChange={e=>setTyped(e.target.value)} autoFocus/></label>
   <div className="actions"><button className="btn ghost" onClick={()=>setWipe(false)}>Cancel</button><button className="btn danger" disabled={typed!=='DELETE'} onClick={erase}>Delete everything</button></div></Modal></GlassCard>}
