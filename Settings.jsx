import {useEffect,useState} from 'react'
import {GlassCard,Modal} from '../components/ui.jsx'
import ThemePicker from '../components/ThemePicker.jsx'
import AdminAccess from '../components/AdminAccess.jsx'
import DataManager from '../components/DataManager.jsx'
import {apiMode,resetAll,settings} from '../services/api.js'
const D={company:'MapSpace Logistics',tz:'Asia/Kolkata',wm:true,refresh:'2',email:true,sms:false,push:true,compact:false}
const Sw=({on,set,label})=><div className="kv"><span>{label}</span><button role="switch" aria-checked={on} aria-label={label} className={'sw'+(on?' on':'')} onClick={()=>set(!on)}><i/></button></div>
const Watermark=({name})=><svg className="wmk" aria-hidden="true"><defs><pattern id="wmp" width="300" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)"><g fill="currentColor"><path transform="translate(8 40) scale(.75)" d="M24 4c-8 0-14 6-14 13.5C10 28 24 44 24 44s14-16 14-26.5C38 10 32 4 24 4z"/><text x="46" y="62" fontSize="26" fontWeight="600">{name}</text></g></pattern></defs><rect width="100%" height="100%" fill="url(#wmp)"/></svg>
export default function Settings({admin}){
 const [s,setS]=useState(()=>({...D,...settings.cached()})),[ready,setReady]=useState(apiMode!=='Connected'),[err,setErr]=useState(''),[ok,setOk]=useState(''),[conf,setConf]=useState(false)
 useEffect(()=>{let dead=false;if(apiMode==='Connected')settings.load().then(v=>{if(!dead){setS({...D,...v});setReady(true)}}).catch(e=>{if(!dead)setErr('Could not load saved settings: '+e.message)});return()=>{dead=true}},[])
 const set=k=>v=>{setS({...s,[k]:v});setOk('')}
 const save=async()=>{if(!s.company.trim())return setErr('Company name is required.');setErr('');try{await settings.save(s);setOk('Settings saved. Live refresh applies on next dashboard load.')}catch(e){setErr(e.message)}}
 const reset=async()=>{try{await resetAll()}catch(e){setConf(false);setErr(e.message)}}
 return <div className="page settings">{s.wm&&<Watermark name={s.company||'MapSpace'}/>}<div className="grid charts">
  <GlassCard whileHover={{}}><h3>General</h3><div className="stack"><label>Company name<input value={s.company} onChange={e=>set('company')(e.target.value)}/></label>
   <label>Time zone<select value={s.tz} onChange={e=>set('tz')(e.target.value)}><option>Asia/Kolkata</option><option>UTC</option><option>Asia/Dubai</option></select></label>
   <label>Live data refresh<select value={s.refresh} onChange={e=>set('refresh')(e.target.value)}>{['1','2','5','10'].map(x=><option key={x} value={x}>Every {x}s</option>)}</select></label>{err&&<p className="err" role="alert">{err}</p>}</div></GlassCard>
  <ThemePicker/>
  <GlassCard whileHover={{}}><h3>Notifications and display</h3><Sw label="Email alerts" on={s.email} set={set('email')}/><Sw label="SMS alerts" on={s.sms} set={set('sms')}/><Sw label="Push alerts" on={s.push} set={set('push')}/><Sw label="Logo and company watermark" on={s.wm} set={set('wm')}/><Sw label="Compact tables" on={s.compact} set={set('compact')}/></GlassCard>
  {admin?.role==='Super Admin'&&<DataManager/>}
  <GlassCard whileHover={{}}><h3>Data and backend</h3><div className="kv"><span>Data source</span><b>{apiMode}</b></div><p className="muted">{apiMode==='Connected'?'Records, admins, settings and history are stored in MongoDB through your server.':'Set VITE_API_URL to connect the MongoDB server. All sections then read and write through services/api.js.'}</p>{admin?.role==='Super Admin'?<button className="btn danger" onClick={()=>setConf(true)}>Reset demo data</button>:<small className="muted">Only a Super Admin can reset or delete data.</small>}</GlassCard></div>
  <AdminAccess admin={admin||{role:''}}/>
  <div className="actions"><button className="btn ghost" onClick={()=>{setS(D);setOk('')}}>Restore defaults</button><button className="btn" onClick={save} disabled={!ready}>Save changes</button></div>{ok&&<p className="up">{ok}</p>}
  <Modal open={conf} onClose={()=>setConf(false)} title="Reset demo data?"><p className="muted">Drivers, shipments, messages and every other local change will return to the starting data.</p><div className="actions"><button className="btn ghost" onClick={()=>setConf(false)}>Cancel</button><button className="btn danger" onClick={reset}>Reset data</button></div></Modal></div>}
