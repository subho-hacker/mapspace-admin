import {useState} from 'react'
import {Wallet,Receipt,CalendarDays,ArrowUpRight,ArrowDownLeft,BellRing,HandCoins} from 'lucide-react'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,PieChart,Pie,Cell,Legend} from 'recharts'
import ResourcePage from '../components/ResourcePage.jsx'
import {GlassCard,Modal} from '../components/ui.jsx'
import {monthly} from '../data/analyticsData.js'
import {TODAY,TD,ymd} from '../utils/now.js'
import {resources} from '../services/api.js'
import {contactFor,sendTo,notify,inr} from '../services/comms.js'
const sum=a=>a.reduce((s,x)=>s+x.amount,0)
const TYPES=['Revenue','Fuel','Maintenance','Salary','Toll','Insurance','Rent'],COL=['#58B9F5','#FFB547','#00E676','#FF4D67','#9B8CFF','#2D99DC']
const tip={contentStyle:{background:'#0A1728',border:'1px solid rgba(255,255,255,.16)',borderRadius:12}}
// Expenses use the day they were PAID (settlement date), so paying a bill today shows in today's and this month's expenses.
const pd=x=>x.paidOn||x.date,exp=d=>d.filter(x=>x.type!=='Revenue'&&x.status==='Paid'),mon=d=>d.filter(x=>(pd(x)||'').slice(0,7)===TODAY.slice(0,7))
function Overview({items,can,remind}){
 const [day,setDay]=useState(TODAY),ex=mon(exp(items)),byDay=Array.from({length:TD},(_,i)=>({day:i+1,amount:sum(ex.filter(x=>pd(x)===ymd(i+1)))}))
 const cats=TYPES.slice(1).map(t=>({name:t,value:sum(ex.filter(x=>x.type===t))})).filter(x=>x.value),dayRows=exp(items).filter(x=>pd(x)===day)
 const pay=items.filter(x=>x.type!=='Revenue'&&x.status!=='Paid').sort((a,b)=>(a.due||'').localeCompare(b.due||'')),rec=items.filter(x=>x.type==='Revenue'&&x.status!=='Paid').sort((a,b)=>(a.due||'').localeCompare(b.due||'')),overdue=rec.filter(x=>(x.due||'')<=TODAY)
 const hist=[...exp(items)].sort((a,b)=>pd(b).localeCompare(pd(a))||String(b.id).localeCompare(String(a.id))).slice(0,8)
 const List=({t,rows,color,btn})=><GlassCard whileHover={{}}><div className="toolbar"><h3>{t}</h3><b style={{color}}>{inr(sum(rows))}</b></div>{btn}
  {rows.slice(0,6).map(r=><div className="kv" key={r.id}><span>{r.party} · {r.type}<br/><small>Due {r.due}{r.remindedAt?` · reminded ${new Date(r.remindedAt).toLocaleDateString('en-IN')}`:''}</small></span><span style={{textAlign:'right'}}>{inr(r.amount)}<br/><small className={r.status==='Overdue'?'down':''}>{r.status}</small></span></div>)}
  {!rows.length&&<p className="muted">Nothing outstanding.</p>}{rows.length>6&&<small className="muted">+{rows.length-6} more in the table below</small>}</GlassCard>
 return <>
  <div className="grid charts">
   <GlassCard whileHover={{}}><h3>Daily expenses paid · this month (₹)</h3><ResponsiveContainer height={240}><BarChart data={byDay}><CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="day" stroke="#A8B8CA"/><YAxis stroke="#A8B8CA"/><Tooltip {...tip} formatter={v=>inr(v)}/><Bar dataKey="amount" fill="#FFB547" radius={[6,6,0,0]} animationDuration={800}/></BarChart></ResponsiveContainer></GlassCard>
   <GlassCard whileHover={{}}><h3>Monthly operating cost (₹ lakh, analytics)</h3><ResponsiveContainer height={240}><BarChart data={monthly}><CartesianGrid stroke="rgba(255,255,255,.08)"/><XAxis dataKey="month" stroke="#A8B8CA"/><YAxis stroke="#A8B8CA"/><Tooltip {...tip}/><Bar dataKey="cost" fill="#2D99DC" radius={[6,6,0,0]} animationDuration={800}/></BarChart></ResponsiveContainer></GlassCard>
   <GlassCard whileHover={{}}><h3>Expense categories · this month</h3><ResponsiveContainer height={240}><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88}>{cats.map((c,i)=><Cell key={c.name} fill={COL[i%6]}/>)}</Pie><Tooltip {...tip} formatter={v=>inr(v)}/><Legend/></PieChart></ResponsiveContainer></GlassCard></div>
  <div className="grid charts"><List t="To pay (we owe)" rows={pay} color="#FF4D67"/>
   <List t="To receive (customers owe us)" rows={rec} color="#00E676" btn={can&&<button className="btn ghost" disabled={!overdue.length} onClick={()=>remind(overdue)}><BellRing size={15}/> Remind {overdue.length} overdue</button>}/>
   <GlassCard whileHover={{}}><div className="toolbar"><h3>Expenses on a day</h3><input type="date" value={day} max={TODAY} onChange={e=>e.target.value&&setDay(e.target.value)} aria-label="Pick a day"/></div>
    <p><b style={{fontSize:24}}>{inr(sum(dayRows))}</b> <small className="muted">{dayRows.length} payments</small></p>{dayRows.map(r=><div className="kv" key={r.id}><span>{r.type} · {r.party}<br/><small>{r.method||'—'}{r.ref?` · ${r.ref}`:''}</small></span><b>{inr(r.amount)}</b></div>)}{!dayRows.length&&<p className="muted">No payments recorded for this day.</p>}</GlassCard>
   <GlassCard whileHover={{}}><h3>Settlement history</h3>{hist.map(r=><div className="kv" key={r.id}><span>{pd(r)} · {r.party}<br/><small>{r.type} · {r.method||'—'}</small></span><b>{inr(r.amount)}</b></div>)}{!hist.length&&<p className="muted">No settlements yet.</p>}</GlassCard></div>
  {!can&&<p className="muted">Sending reminders and settling payments is limited to Super Admins and Admins.</p>}</>}
export default function Finance({admin}){
 const can=['Super Admin','Admin'].includes(admin?.role),[st,setSt]=useState(null),[method,setMethod]=useState('Bank transfer'),[ref,setRef]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false),[toast,setToast]=useState('')
 const flash=m=>{setToast(m);setTimeout(()=>setToast(''),4000)}
 const remind=async rows=>{if(!rows.length)return flash('No overdue invoices to remind.');const g={};rows.forEach(r=>(g[r.party]=g[r.party]||[]).push(r))
  try{for(const [n,rs] of Object.entries(g)){await sendTo(await contactFor(n),`Payment reminder: ${rs.length} invoice(s) totalling ${inr(sum(rs))} (oldest due ${rs.map(r=>r.due).sort()[0]}) are unpaid. Please arrange payment at the earliest.`);for(const r of rs)await resources.transactions.update(r.id,{remindedAt:new Date().toISOString(),reminders:(r.reminders||0)+1})}
   await notify('Payment reminders sent',`${Object.keys(g).length} customer(s) reminded.`,'Warning');flash(`Reminder sent to ${Object.keys(g).length} customer(s). See Messaging Center.`)}catch(e){flash('Could not send: '+e.message)}}
 const open=r=>{setSt(r);setMethod('Bank transfer');setRef('');setErr('')}
 const confirm=async()=>{if(method!=='Cash'&&!ref.trim())return setErr('Enter the reference or UTR number.');setBusy(true);setErr('')
  try{const r=st,refv=ref.trim()||'—';await resources.transactions.update(r.id,{status:'Paid',paidOn:TODAY,method,ref:refv})
   await sendTo(await contactFor(r.party),r.type==='Revenue'?`We have received your payment of ${inr(r.amount)} (${method}, ref ${refv}). Thank you.`:`Payment of ${inr(r.amount)} for ${r.description} has been settled via ${method} (ref ${refv}) on ${TODAY}.`)
   await notify(r.type==='Revenue'?'Payment received':'Payment settled',`${r.party} · ${inr(r.amount)} · ${method}`);setSt(null);flash(r.type==='Revenue'?'Payment recorded.':`Settled. ${inr(r.amount)} added to today's expenses.`)}catch(e){setErr(e.message)}setBusy(false)}
 return <>
  <ResourcePage name="transactions" noun="transaction" prefix="TX-" statusKey="status" extra={items=><Overview items={items} can={can} remind={remind}/>}
   columns={[{key:'id',label:'ID',form:false},{key:'date',label:'Date',type:'date'},{key:'type',label:'Category',type:'select',options:TYPES},{key:'party',label:'Paid to / received from'},{key:'description',label:'Description'},{key:'amount',label:'Amount',type:'number',fmt:inr},{key:'due',label:'Due date',type:'date'},{key:'paidOn',label:'Paid on',form:false,fmt:v=>v||'—'},{key:'method',label:'Method',form:false,fmt:v=>v||'—'},{key:'status',label:'Status',type:'select',options:['Paid','Pending','Overdue'],tone:true}]}
   actions={can?[{label:'Send reminder',icon:BellRing,show:r=>r.type==='Revenue'&&r.status!=='Paid',run:r=>{remind([r]);return false}},{label:'Settle payment',icon:HandCoins,show:r=>r.status!=='Paid',run:r=>{open(r);return false}}]:[]}
   kpis={d=>[{icon:CalendarDays,label:"Today's expenses paid (₹)",value:sum(exp(d).filter(x=>pd(x)===TODAY))},{icon:Receipt,label:'This month expenses paid (₹)',value:sum(exp(mon(d)))},{icon:ArrowUpRight,label:'To pay (₹)',value:sum(d.filter(x=>x.type!=='Revenue'&&x.status!=='Paid'))},{icon:ArrowDownLeft,label:'To receive (₹)',value:sum(d.filter(x=>x.type==='Revenue'&&x.status!=='Paid'))},{icon:Wallet,label:'Net this month (₹)',value:sum(mon(d).filter(x=>x.type==='Revenue'&&x.status==='Paid'))-sum(exp(mon(d)))}]}/>
  <Modal open={!!st} onClose={()=>setSt(null)} title={st?.type==='Revenue'?'Record payment received':'Settle payment'}>{st&&<>
   <div className="kv"><span>{st.party}</span><b>{inr(st.amount)}</b></div><small className="muted">{st.type} · {st.description} · due {st.due}</small>
   <label>Method<select value={method} onChange={e=>setMethod(e.target.value)}>{['Bank transfer','UPI','Cheque','Cash','Card'].map(o=><option key={o}>{o}</option>)}</select></label>
   <label>Reference / UTR{method==='Cash'?' (optional)':''}<input value={ref} onChange={e=>setRef(e.target.value)}/></label>
   <small className="muted">{st.type==='Revenue'?`Recorded as received on ${TODAY}.`:`Recorded as paid on ${TODAY} and counted in today's and this month's expenses. ${st.party} is notified in Messaging.`}</small>
   {err&&<p className="err" role="alert">{err}</p>}<div className="actions"><button className="btn ghost" onClick={()=>setSt(null)}>Cancel</button><button className="btn" disabled={busy} onClick={confirm}>{busy?'Saving…':'Confirm'}</button></div></>}</Modal>
  {toast&&<div className="glass toast" role="status">{toast}</div>}</>}
