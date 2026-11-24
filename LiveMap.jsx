import {useState} from 'react'
import {Crosshair,Thermometer} from 'lucide-react'
import GeoMap from './GeoMap.jsx'
import useFleet from '../hooks/useFleet.js'
const eta=m=>new Date(Date.now()+m*60000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
// Live tracking: map + selected-vehicle card (product and category included) + optional vehicle list.
export default function LiveMap({height=460,list}){
 const fleet=useFleet(2000),[id,setId]=useState('LGS-104'),[heat,setHeat]=useState('off'),[follow,setFollow]=useState(false),[st,setSt]=useState('All')
 const v=fleet.find(x=>x.id===id)||fleet[0],rows=fleet.filter(x=>st==='All'||x.status===st)
 return <>
  <div className="toolbar"><span className="muted"><i className="dot sm"/> Live · simulated GPS feed</span>
   <div className="seg inline" role="group" aria-label="Delivery heat on map">{[['off','No heat'],['today','Today'],['month','Month']].map(([k,l])=><button key={k} className={heat===k?'on':''} onClick={()=>setHeat(k)}>{k!=='off'&&<Thermometer size={14}/>}{l}</button>)}</div>
   <button className={'btn ghost'+(follow?' on':'')} aria-pressed={follow} onClick={()=>setFollow(!follow)}><Crosshair size={15}/> Follow {v.vehicle||v.id}</button></div>
  <GeoMap fleet={fleet} selId={v.id} onSelect={setId} heat={heat} follow={follow} height={height} path={v.path}/>
  <div className="glass trace"><b>Live trace · {v.vehicle||v.id}</b><small>{v.from} → {v.to} · {v.driver}</small>
   <small>{v.product} ({v.category}) · {v.qty}</small>
   <small>{v.speed} km/h · fuel {v.fuel}% · {v.left} km left · ETA {v.etaMin?eta(v.etaMin):'—'} · <span className={v.status==='Delayed'?'down':v.status==='Idle'?'muted':'up'}>{v.status}</span></small><small className="muted">Updated {v.updated}</small></div>
  {list&&<><div className="toolbar" style={{marginTop:14}}><h3>Vehicles on road</h3><select value={st} onChange={e=>setSt(e.target.value)} aria-label="Status filter">{['All','On Time','Delayed','Idle'].map(s=><option key={s}>{s}</option>)}</select></div>
   <div className="scroll"><table className="static"><thead><tr>{['Vehicle','Driver','Route','Product','Category','Load','Speed','ETA','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
    {rows.map(r=><tr key={r.id} onClick={()=>setId(r.id)} style={{cursor:'pointer',background:r.id===v.id?'rgba(45,153,220,.18)':undefined}}><td>{r.vehicle||r.id}</td><td>{r.driver}</td><td>{r.from} → {r.to}</td><td>{r.product}</td><td>{r.category}</td><td>{r.qty}</td><td>{r.speed} km/h</td><td>{r.etaMin?eta(r.etaMin):'—'}</td><td>{r.status}</td></tr>)}</tbody></table></div></>}</>}
