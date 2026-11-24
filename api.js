// Backend switch: set VITE_API_URL (e.g. /api with the Vite proxy, or https://api.mapspace.in/api) and every collection,
// admin login, setting and backup goes through the MongoDB-backed server. Without it, data lives in localStorage (demo mode).
//   GET /x   POST /x   PUT /x/:id   DELETE /x/:id   GET /search?q=   (see server/README.md)
import {seeds} from '../data/resources.js'
export const BASE=import.meta.env.VITE_API_URL
const ev=n=>window.dispatchEvent(new Event('ms:'+n))
const hasToken=()=>!!localStorage.getItem('ms_token')

// One fetch wrapper for the whole app: bearer token, readable errors, and a global "please sign in again" signal.
export async function http(path,method='GET',body,{auth=true}={}){
 if(auth&&!hasToken())throw Object.assign(new Error('Please sign in.'),{status:401})
 let r
 try{r=await fetch(`${BASE}/${path}`,{method,headers:{'Content-Type':'application/json',...(hasToken()?{Authorization:`Bearer ${localStorage.getItem('ms_token')}`}:{})},body:body===undefined?undefined:JSON.stringify(body)})}
 catch{throw new Error('Cannot reach the server. Check your connection and try again.')}
 if(r.status===204)return null
 const j=await r.json().catch(()=>null)
 if(!r.ok){
  if(r.status===401&&auth)window.dispatchEvent(new CustomEvent('ms:unauth',{detail:j?.error}))
  throw Object.assign(new Error(j?.error||r.statusText||`Request failed (${r.status})`),{status:r.status,code:j?.code})}
 return j}

const has=(v,k)=>v.some(x=>k in x)
const stale=(n,v)=>Array.isArray(v)&&v.length>0&&((n==='transactions'&&!has(v,'paidOn'))||(n==='shipments'&&!has(v,'category'))||(n==='conversations'&&!has(v,'ref'))||(n==='customers'&&(()=>{const a=v.find(x=>x.id==='C-001'),b=v.find(x=>x.id==='C-007');return !!a&&!!b&&a.name===b.name})()))
// Another browser tab (a second admin on this computer) changing data refreshes this tab at once.
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key&&e.key.startsWith('ms:'))window.dispatchEvent(new Event(e.key))})
const read=n=>{try{const v=JSON.parse(localStorage.getItem('ms:'+n));return v&&!stale(n,v)?v:seeds[n]}catch{return seeds[n]}}
const write=(n,v)=>{localStorage.setItem('ms:'+n,JSON.stringify(v));ev(n)}
const make=n=>({remote:!!BASE,sync:()=>BASE?[]:read(n),
 list:async()=>BASE?(hasToken()?http(n):[]):read(n),
 create:async item=>{if(BASE){const x=await http(n,'POST',item);ev(n);return x}write(n,[item,...read(n)]);return item},
 update:async(id,p)=>{if(BASE){await http(`${n}/${encodeURIComponent(id)}`,'PUT',p);ev(n)}else write(n,read(n).map(x=>x.id===id?{...x,...p}:x))},
 remove:async id=>{if(BASE){await http(`${n}/${encodeURIComponent(id)}`,'DELETE');ev(n)}else write(n,read(n).filter(x=>x.id!==id))}})
export const resources=Object.fromEntries(Object.keys(seeds).map(n=>[n,make(n)]))
export const apiMode=BASE?'Connected':'Local demo data'
// After sign-in every screen reloads its data (before sign-in the server correctly refuses to send any).
export const refreshAll=()=>[...Object.keys(seeds),'settings','applied','admins','permits'].forEach(ev)

// ---- Company settings (one shared document) and the log of applied AI suggestions
export const settings={
 cached:()=>{if(BASE)return{};try{return JSON.parse(localStorage.getItem('ms:settings')||'{}')}catch{return{}}},
 load:async()=>BASE?(hasToken()?http('settings'):{}):settings.cached(),
 save:async s=>{if(BASE){const r=await http('settings','PUT',s);ev('settings');return r}localStorage.setItem('ms:settings',JSON.stringify(s));ev('settings');return s}}
const localApplied=()=>{try{return JSON.parse(localStorage.getItem('ms_applied')||'[]').map(x=>typeof x==='string'?{id:x,title:x,time:''}:x)}catch{return[]}}
export const applied={
 list:async()=>BASE?(hasToken()?http('ai/applied'):[]):localApplied(),
 add:async rec=>{if(BASE)await http('ai/applied','POST',rec);else localStorage.setItem('ms_applied',JSON.stringify([rec,...localApplied()].slice(0,30)));ev('applied')}}

// ---- Global search
const SEARCH=[['drivers','Driver','/drivers','name'],['shipments','Shipment','/shipments','id'],['customers','Customer','/customers','name'],['deliveries','Delivery','/deliveries','id'],['transactions','Transaction','/finance','id'],['notifications','Notification','/notifications','title']]
export async function searchAll(q){
 if(BASE)return hasToken()?http(`search?q=${encodeURIComponent(q)}`):[]
 const s=q.toLowerCase(),out=[]
 SEARCH.forEach(([n,type,to,key])=>read(n).filter(r=>Object.values(r).join(' ').toLowerCase().includes(s)).slice(0,3).forEach(r=>out.push({type,label:r[key],sub:`${r.id}${r.status?' · '+r.status:''}`,to,term:r[key]})))
 read('vehicles').filter(v=>(v.id+v.driver+v.reg).toLowerCase().includes(s)).slice(0,3).forEach(v=>out.push({type:'Vehicle',label:v.id,sub:`${v.driver} · ${v.status}`,to:'/fleet',term:v.id}))
 return out.slice(0,10)}

// ---- Backup, restore, delete (Super Admin). On the server these run against MongoDB; admin accounts are never part of a backup.
const NAMES=Object.keys(seeds),REQUIRED=NAMES.filter(n=>n!=='vehicles')   // older backups have no vehicles; they still restore
export const exportDB=async()=>BASE?http('data/export'):({app:'mapspace',version:1,exportedAt:new Date().toISOString(),data:Object.fromEntries(NAMES.map(n=>[n,read(n)])),settings:JSON.parse(localStorage.getItem('ms:settings')||'null'),aiApplied:JSON.parse(localStorage.getItem('ms_applied')||'[]')})
export async function importDB(o){
 if(o?.app!=='mapspace'||!o.data||typeof o.data!=='object')throw new Error('This is not a MapSpace backup file.')
 REQUIRED.forEach(n=>{if(!Array.isArray(o.data[n]))throw new Error(`Backup is missing "${n}".`)})
 if(BASE)await http('data/import','POST',o)
 else{NAMES.forEach(n=>{if(Array.isArray(o.data[n]))localStorage.setItem('ms:'+n,JSON.stringify(o.data[n]))})
  o.settings?localStorage.setItem('ms:settings',JSON.stringify(o.settings)):localStorage.removeItem('ms:settings')
  localStorage.setItem('ms_applied',JSON.stringify(o.aiApplied||[]))}
 location.reload()}
export async function wipeDB(){
 if(BASE)await http('data/wipe','POST')
 else{NAMES.forEach(n=>localStorage.setItem('ms:'+n,'[]'));['ms:settings','ms_applied'].forEach(k=>localStorage.removeItem(k))}
 location.reload()}
export async function resetAll(){
 if(BASE)await http('data/reset','POST')
 else Object.keys(localStorage).filter(k=>k.startsWith('ms:')).forEach(k=>localStorage.removeItem(k))
 location.reload()}
