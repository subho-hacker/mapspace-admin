import {useMemo,useState} from 'react'
import {motion} from 'framer-motion'
import {Truck,Activity,PauseCircle,Wrench,Gauge,Download} from 'lucide-react'
import {KPI,GlassCard,Drawer} from '../components/ui.jsx'
import {useResource} from '../hooks/useResource.js'
const PER=10
export default function FleetManagement(){
 const {items:vehicles}=useResource('vehicles')
 const [q,setQ]=useState('');const [st,setSt]=useState('All');const [sort,setSort]=useState({k:'id',d:1});const [page,setPage]=useState(0);const [sel,setSel]=useState(null)
 const count=s=>vehicles.filter(v=>v.status===s).length
 const rows=useMemo(()=>vehicles.filter(v=>(st==='All'||v.status===st)&&(v.id+v.driver+v.reg+v.location).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>(a[sort.k]>b[sort.k]?1:-1)*sort.d),[vehicles,q,st,sort])
 const pages=Math.max(1,Math.ceil(rows.length/PER));const view=rows.slice(page*PER,page*PER+PER)
 const exportCsv=()=>{if(!vehicles.length)return;const h=Object.keys(vehicles[0]);const csv=[h.join(','),...rows.map(v=>h.map(k=>`"${v[k]}"`).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='mapspace-fleet.csv';a.click()}
 const th=(k,l)=><th onClick={()=>setSort({k,d:sort.k===k?-sort.d:1})}>{l}{sort.k===k?(sort.d>0?' ↑':' ↓'):''}</th>
 return <div className="page">
  <div className="grid kpis">
   <KPI icon={Truck} label="Total vehicles" value={vehicles.length} onClick={()=>setSt('All')}/>
   <KPI icon={Activity} label="Active" value={count('Active')} onClick={()=>{setSt('Active');setPage(0)}}/>
   <KPI icon={PauseCircle} label="Idle" value={count('Idle')} onClick={()=>{setSt('Idle');setPage(0)}}/>
   <KPI icon={Wrench} label="In maintenance" value={count('Maintenance')} onClick={()=>{setSt('Maintenance');setPage(0)}}/>
   <KPI icon={Gauge} label="Fleet utilization" value={Math.round(count('Active')/(vehicles.length||1)*100)} suffix="%"/></div>
  <GlassCard className="tablecard" whileHover={{}}>
   <div className="toolbar"><input placeholder="Search vehicle, driver, area" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/>
    <select value={st} onChange={e=>{setSt(e.target.value);setPage(0)}}>{['All','Active','Idle','Maintenance'].map(s=><option key={s}>{s}</option>)}</select>
    <button className="btn" onClick={exportCsv}><Download size={15}/> Export CSV</button></div>
   <div className="scroll"><table><thead><tr>{th('id','Vehicle')}{th('type','Type')}{th('reg','Registration')}{th('driver','Driver')}{th('location','Location')}{th('fuel','Fuel')}{th('status','Status')}</tr></thead>
    <tbody>{view.map((v,i)=><motion.tr key={v.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.025}} onClick={()=>setSel(v)}>
     <td>{v.id}</td><td>{v.type}</td><td>{v.reg}</td><td>{v.driver}</td><td>{v.location}</td><td>{v.fuel}%</td><td><span className={'badge '+v.status}>{v.status}</span></td></motion.tr>)}</tbody></table>
    {!view.length&&<p className="muted pad">No vehicles match. Clear the search or choose All.</p>}</div>
   <div className="pager"><button className="btn ghost" disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {pages} · {rows.length} vehicles</span><button className="btn ghost" disabled={page>=pages-1} onClick={()=>setPage(page+1)}>Next</button></div>
  </GlassCard>
  <Drawer open={!!sel} onClose={()=>setSel(null)} title={sel?.id}>{sel&&<div className="stack">
   {[['Type',sel.type],['Registration',sel.reg],['Driver',sel.driver],['Location',sel.location],['Route',sel.route],['Fuel level',sel.fuel+'%'],['Mileage',sel.mileage.toLocaleString('en-IN')+' km'],['Health score',sel.health+' / 100'],['Last service',sel.service],['Status',sel.status]].map(([a,b])=><div className="kv" key={a}><span>{a}</span><b>{b}</b></div>)}</div>}</Drawer>
 </div>}
