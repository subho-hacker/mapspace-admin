// Rule-based suggestion engine. Every suggestion is computed from live records and carries a real action:
// applying it updates shipments, drivers, payments and messages, and the suggestion disappears because the data changed.
import {resources} from './api.js'
import {catSplit,CATS} from '../data/trackData.js'
import {CM,TD,Y,TODAY,ymdOf} from '../utils/now.js'
import {sendTo,notify,contactFor,inr} from './comms.js'
const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymdOf(d)},sum=a=>a.reduce((s,x)=>s+x.amount,0),PR={High:0,Medium:1,Low:2}
const tell=async(name,text)=>sendTo(await contactFor(name),text)
const by=(rows,k)=>rows.reduce((m,r)=>((m[r[k]]=m[r[k]]||[]).push(r),m),{})
export const canApply=(role,needs)=>needs==='ops'||['Super Admin','Admin'].includes(role)
export function buildSuggestions({shipments:S=[],drivers:D=[],customers:C=[],transactions:T=[],vehicles:V=[]},done=[]){
 const out=[],seen=new Set(done.map(d=>d.id)),avail=D.filter(d=>d.status==='Available')
 // 1. Overdue receivables not chased in the last 24 hours
 const due=T.filter(t=>t.type==='Revenue'&&t.status!=='Paid'&&(t.due||'')<=TODAY&&!(t.remindedAt&&Date.now()-new Date(t.remindedAt)<864e5))
 if(due.length){const g=by(due,'party'),names=Object.keys(g),tot=sum(due)
  out.push({id:'dues',title:`Chase ${inr(tot)} overdue from ${names.length} customer${names.length>1?'s':''}`,desc:`${names.slice(0,3).join(', ')}${names.length>3?` and ${names.length-3} more`:''} have invoices past their due date.`,priority:tot>150000?'High':'Medium',savings:`${inr(tot)} recoverable`,impact:'Faster collection',confidence:Math.min(96,82+names.length*2),ref:`${due.length} invoices`,needs:'remind',
   changes:[`Send a payment reminder to ${names.length} customer chat(s)`,'Mark those invoices as reminded','Add a notification for the team'],
   run:async()=>{for(const n of names){await tell(n,`Payment reminder: ${g[n].length} invoice(s) totalling ${inr(sum(g[n]))} are past due. Please arrange payment at the earliest.`);for(const r of g[n])await resources.transactions.update(r.id,{remindedAt:new Date().toISOString(),reminders:(r.reminders||0)+1})}await notify('Payment reminders sent',`${names.length} customer(s), ${inr(tot)} outstanding.`,'Warning');return`Reminders sent to ${names.length} customer(s).`}})}
 // 2. Bills we owe that are overdue or due within 3 days
 const soon=T.filter(t=>t.type!=='Revenue'&&t.status!=='Paid'&&(t.due||'')<=day(3))
 if(soon.length){const tot=sum(soon),late=soon.some(t=>t.status==='Overdue')
  out.push({id:'bills',title:`Settle ${soon.length} bill${soon.length>1?'s':''} worth ${inr(tot)}`,desc:`${late?'Some are already overdue. ':''}Paying on time avoids late fees and keeps suppliers and drivers happy.`,priority:late?'High':'Medium',savings:`${inr(Math.round(tot*.02))} late fees avoided (est.)`,impact:'Today’s expenses +'+inr(tot),confidence:93,ref:`${soon.length} bills`,needs:'pay',
   changes:[`Mark ${soon.length} bill(s) as paid today (bank transfer)`,'Count them in today’s and this month’s expenses','Tell each supplier or driver in Messaging'],
   run:async()=>{const g=by(soon,'party');for(const t of soon)await resources.transactions.update(t.id,{status:'Paid',paidOn:TODAY,method:'Bank transfer',ref:'AI-'+t.id})
    for(const [n,rs] of Object.entries(g))await tell(n,`Payment of ${inr(sum(rs))} has been settled by bank transfer on ${TODAY}.`);await notify('Bills settled',`${soon.length} bill(s), ${inr(tot)} paid.`);return`${soon.length} bill(s) paid and added to today’s expenses.`}})}
 // 3. Delayed shipments
 const del=S.filter(s=>s.status==='Delayed')
 if(del.length)out.push({id:'delayed',title:`Re-route ${del.length} delayed shipment${del.length>1?'s':''}`,desc:`${del.slice(0,3).map(s=>s.id).join(', ')}${del.length>3?'…':''} are running late. Re-planning gives customers a firm new ETA.`,priority:del.length>3?'High':'Medium',savings:`${inr(del.length*1800)} penalties avoided (est.)`,impact:'Better on-time rate',confidence:Math.min(94,78+del.length*2),ref:del[0].id,needs:'ops',
  changes:[`Set ${del.length} shipment(s) back to In Transit with High priority`,'Move the expected delivery to tomorrow','Message each affected customer'],
  run:async()=>{for(const s of del)await resources.shipments.update(s.id,{status:'In Transit',priority:'High',eta:day(1),startedAt:s.startedAt||Date.now()})
   for(const [n,rs] of Object.entries(by(del,'customer')))await tell(n,`Update: ${rs.map(r=>r.id).join(', ')} has been re-routed. New expected delivery is ${day(1)}.`);await notify('Delayed shipments re-routed',`${del.length} shipment(s) now moving again.`);return`${del.length} shipment(s) re-routed and customers informed.`}})
 // 4. Pending shipments waiting while drivers are free
 const pend=S.filter(s=>s.status==='Pending'),n=Math.min(pend.length,avail.length)
 if(n){const pairs=pend.slice(0,n).map((s,i)=>[s,avail[i]])
  out.push({id:'dispatch-'+pairs.map(p=>p[0].id).join('-'),title:`Dispatch ${n} pending shipment${n>1?'s':''} to free drivers`,desc:`${pend.length} shipment(s) are waiting while ${avail.length} driver(s) are available.`,priority:pend.length>5?'High':'Medium',savings:`${inr(n*1200)} idle cost avoided (est.)`,impact:`${n} more on the road`,confidence:90,ref:pairs[0][1].name,needs:'ops',
   changes:pairs.slice(0,4).map(([s,d])=>`${s.id} (${s.origin} → ${s.destination}) goes to ${d.name}`).concat(n>4?[`…and ${n-4} more`]:[]).concat(['Drivers become Active','They appear in Live Tracking and the Dashboard']),
   run:async()=>{for(const [s,d] of pairs){await resources.shipments.update(s.id,{driver:d.name,vehicle:d.vehicle,status:'In Transit',startedAt:Date.now()});await resources.drivers.update(d.id,{status:'Active',route:`${s.origin} → ${s.destination}`})
     await tell(d.name,`New assignment ${s.id}: ${s.origin} → ${s.destination}.`);await tell(s.customer,`Your shipment ${s.id} is assigned to ${d.name} and on its way.`)}await notify('Shipments dispatched',`${n} pending shipment(s) assigned.`);return`${n} shipment(s) dispatched. They are now in Live Tracking.`}})}
 // 5. Vehicles with poor health
 const weak=V.filter(v=>v.status!=='Maintenance'&&v.health<68).sort((a,b)=>a.health-b.health).slice(0,3),sid='svc-'+weak.map(v=>v.id).join('-')
 if(weak.length&&!seen.has(sid))out.push({id:sid,once:true,title:`Service ${weak.map(v=>v.id).join(', ')} before they break down`,desc:`Health scores are ${weak.map(v=>v.health).join(', ')} out of 100.`,priority:weak[0].health<64?'High':'Medium',savings:`${inr(weak.length*45000)} breakdown cost avoided (est.)`,impact:'Fewer breakdowns',confidence:84,ref:weak[0].id,needs:'ops',
  changes:weak.map(v=>`Book service for ${v.id} and tell ${v.driver}`).concat(['Add a notification for the workshop team']),
  run:async()=>{for(const v of weak)await tell(v.driver,`Please bring ${v.id} to Howrah Auto Works tomorrow for service.`);await notify('Service booked',`${weak.map(v=>v.id).join(', ')} scheduled for service.`,'Warning');return`Service booked for ${weak.length} vehicle(s).`}})
 // 6. Category demand forecast
 if(CM>=1){const f=new Date(Y,CM+1,0).getDate()/TD,cur=catSplit(CM).map(x=>x*f),prev=catSplit(CM-1),g=cur.map((x,i)=>(x-prev[i])/prev[i]),i=g.indexOf(Math.max(...g)),fid=`fc-${CATS[i]}-${CM}`
  if(g[i]>.04&&!seen.has(fid)){const top=[...C].sort((a,b)=>b.orders-a.orders).slice(0,3)
   out.push({id:fid,once:true,title:`Prepare for ${CATS[i]} demand +${Math.round(g[i]*100)}%`,desc:`At the current pace ${CATS[i]} deliveries will beat last month. Reserve vehicles and stock early.`,priority:'Low',savings:`${inr(Math.round(g[i]*60000))} extra revenue protected (est.)`,impact:'Fewer missed orders',confidence:72,ref:CATS[i],needs:'ops',
    changes:[`Ask ${top.length} top customer(s) for their next-month forecast`,'Add a planning notification'],
    run:async()=>{for(const c of top)await sendTo({name:c.name,type:'Customer',ref:c.id},`We expect higher ${CATS[i]} volumes next month. Please share your forecast so we can reserve vehicles.`);await notify('Demand planning',`${CATS[i]} volumes are rising. Review fleet capacity.`);return`Forecast requests sent to ${top.length} customer(s).`}})}}
 // 7. Win back inactive customers
 const ina=C.filter(c=>c.status==='Inactive'),wid='winback-'+ina.map(c=>c.id).join('-')
 if(ina.length&&!seen.has(wid))out.push({id:wid,once:true,title:`Win back ${ina.length} inactive customer${ina.length>1?'s':''}`,desc:`${ina.slice(0,3).map(c=>c.name).join(', ')} have stopped ordering.`,priority:'Low',savings:`${inr(ina.length*35000)} potential monthly revenue (est.)`,impact:'More repeat orders',confidence:68,ref:`${ina.length} customers`,needs:'ops',
  changes:[`Send a friendly check-in message to ${ina.length} customer(s)`,'Add a follow-up notification'],
  run:async()=>{for(const c of ina)await sendTo({name:c.name,type:'Customer',ref:c.id},'We miss working with you. Let us know if you have upcoming deliveries and we will prioritise them.');await notify('Win-back messages sent',`${ina.length} inactive customer(s) contacted.`);return`Check-in sent to ${ina.length} customer(s).`}})
 return out.sort((a,b)=>PR[a.priority]-PR[b.priority]||b.confidence-a.confidence)}
