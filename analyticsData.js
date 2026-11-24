import {Y,CM,TD} from '../utils/now.js'
const ALL=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const S=[1210,1285,1340,1295,1410,1480,1525,1590,1660,1710,1760,1845]
const F=[78,81,79,84,76,74,70,69,66,64,61,58]
const R=[41.2,43.8,45.9,44.6,48.7,51.3,53.0,55.4,58.1,60.2,62.4,66.5]
const C=[30.5,31.9,33.2,32.8,34.7,36.1,37.4,38.6,40.2,41.5,43.0,45.8]
const OT=[71,72,73,72,74,75,76,76,77,77,78,78]
const EF=[68,69,71,70,72,74,75,76,78,79,80,82]
const FU=[9.8,10.1,10.4,10.2,10.9,11.3,11.5,11.9,12.2,12.4,12.6,13.1]
const M0=ALL.map((m,i)=>({month:m,shipments:S[i],failed:F[i],delivered:S[i]-F[i],revenue:R[i],cost:C[i],profit:+(R[i]-C[i]).toFixed(1),onTime:OT[i],efficiency:EF[i],fuel:FU[i],utilization:Math.round(60+EF[i]*.2)}))
const wave=(m,d,a)=>Math.sin(d*1.1+m*2.3)*a
const D0=M0.map((mo,m)=>{
 const n=new Date(Y,m+1,0).getDate()
 const raw=Array.from({length:n},(_,d)=>({e:mo.efficiency+wave(m,d,3),s:30+mo.efficiency*.12+wave(m,d+4,2.5),f:mo.fuel*1000/n*(1+wave(m,d+2,.08)),sh:mo.shipments/n*(1+wave(m,d+1,.15))}))
 const avg=k=>raw.reduce((a,r)=>a+r[k],0)/n,de=avg('e')-mo.efficiency,fs=mo.fuel*1000/(avg('f')*n),ss=mo.shipments/(avg('sh')*n);let left=mo.shipments
 return raw.map((r,d)=>{const sh=d===n-1?left:Math.round(r.sh*ss);left-=sh;return{date:`${mo.month} ${d+1}`,day:d+1,efficiency:+(r.e-de).toFixed(1),avgSpeed:+r.s.toFixed(1),fuel:Math.round(r.f*fs),shipments:sh}})})

// Only months up to today are shown; the current month is month-to-date (daily rows stop at today).
const sum=(a,k)=>a.reduce((t,x)=>t+x[k],0)
export const months=ALL.slice(0,CM+1)
export const daily=D0.slice(0,CM+1).map((d,m)=>m===CM?d.slice(0,TD):d)
export const monthly=M0.slice(0,CM+1).map((mo,m)=>{if(m!==CM)return mo;const sh=sum(daily[CM],'shipments'),r=sh/mo.shipments,failed=Math.round(mo.failed*r);return{...mo,shipments:sh,failed,delivered:sh-failed,revenue:+(mo.revenue*r).toFixed(1),cost:+(mo.cost*r).toFixed(1),profit:+((mo.revenue-mo.cost)*r).toFixed(1),fuel:+(mo.fuel*r).toFixed(1),mtd:true}})
const ADD=['shipments','failed','delivered','revenue','cost','profit','fuel']
// Growth for the running month compares the projected full-month pace with last month, so partial months are not misread as a drop.
export const growth=(i,key)=>{if(!i)return 0;const f=monthly[i].mtd&&ADD.includes(key)?new Date(Y,i+1,0).getDate()/TD:1;return +(((monthly[i][key]*f-monthly[i-1][key])/monthly[i-1][key])*100).toFixed(1)}
