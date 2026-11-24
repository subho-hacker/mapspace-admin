// Google Sign-In (Google Identity Services). The browser only DISPLAYS the profile; your backend must verify
// the ID token (signature, iss, aud, exp) on every request. The token is sent as "Authorization: Bearer".
import {BASE,http} from './api.js'
export const GOOGLE_CLIENT_ID=import.meta.env.VITE_GOOGLE_CLIENT_ID
const ALLOW=(import.meta.env.VITE_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
export const isAllowed=e=>!ALLOW.length||ALLOW.includes(String(e).toLowerCase())
export const DEMO_ADMIN={name:'Sagnik Mondal',id:'MS-ADM-001',role:'Super Admin',loginTime:'12:00 PM'}
const time=()=>new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
export function decodeJwt(t){const b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(atob(b).split('').map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}
export function toAdmin(cred){const p=decodeJwt(cred);if(!p.email_verified)throw new Error('Email not verified');return{name:p.name||p.email,email:p.email,picture:p.picture,id:'GL-'+String(p.sub).slice(-6),role:'Admin',exp:p.exp*1000,loginTime:time()}}
export function clearSession(){['ms_user','ms_token','ms_session'].forEach(k=>localStorage.removeItem(k));window.google?.accounts?.id?.disableAutoSelect?.()}
export function loadSession(){try{const u=JSON.parse(localStorage.getItem('ms_user')||'null');if(u){if(u.exp>Date.now()&&(!BASE||localStorage.getItem('ms_token')))return u;clearSession();return null}}catch{}return !BASE&&localStorage.getItem('ms_session')==='1'?DEMO_ADMIN:null}
export const loadGoogle=()=>new Promise((res,rej)=>{if(window.google?.accounts)return res(window.google);const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=()=>res(window.google);s.onerror=rej;document.head.appendChild(s)})

// ---- Multi-admin login keys. Each admin has an ID plus a private key; only a SHA-256 hash of "ID:KEY" is stored.
// IMPORTANT: this check runs in the browser. For production, verify keys on your server and issue a session token.
const AK='ms:admins',LK='ms:logins',rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('')
const SEED=[{id:'MS-ADM-001',name:'Sagnik Mondal',role:'Super Admin',hash:'5ca73d024ee9a26332e4fc4f8569fc2ed08d5778739b441cd2afba6c01781fa2',created:'2026-01-01',off:false}]
const L_listAdmins=()=>rd(AK,null)||SEED
const save=a=>{localStorage.setItem(AK,JSON.stringify(a));window.dispatchEvent(new Event('ms:admins'))}
const gen=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=crypto.getRandomValues(new Uint8Array(12));return'MS-'+[0,4,8].map(i=>[...r.slice(i,i+4)].map(b=>c[b%c.length]).join('')).join('-')}
// Rules: only an active Super Admin may manage admins. Suspending or removing ANOTHER Super Admin needs a permit:
// a different Super Admin approves with their own login key (or, if none exists, the requester re-enters their key).
const PK='ms:permits',perm=()=>Object.assign(new Error('A permit is required to suspend or remove another Super Admin.'),{code:'PERMIT'})
const find=id=>L_listAdmins().find(x=>x.id===id),actives=()=>L_listAdmins().filter(x=>x.role==='Super Admin'&&!x.off)
const actorRec=actor=>{const r=find(actor?.id);if(!r||r.off||r.role!=='Super Admin')throw new Error('Only an active Super Admin can do this.');return r}
const rawDo={suspend:id=>save(L_listAdmins().map(x=>x.id===id?{...x,off:true}:x)),remove:id=>save(L_listAdmins().filter(x=>x.id!==id))}
async function L_addAdmin(name,role,actor){actorRec(actor);if(!['Super Admin','Admin','Manager'].includes(role))throw new Error('Unknown role.')
 const a=L_listAdmins(),id='MS-ADM-'+String(Math.max(0,...a.map(x=>+x.id.slice(-3)))+1).padStart(3,'0'),key=gen();save([...a,{id,name,role,hash:await sha(id+':'+key),created:new Date().toISOString(),off:false}]);return{id,key}}
async function L_resetKey(id,actor){const me=actorRec(actor),t=find(id);if(!t)throw new Error('Admin not found.')
 if(t.role==='Super Admin'&&t.id!==me.id)throw new Error('A Super Admin can only reset their own key. Ask them to do it after signing in.')
 const key=gen(),hash=await sha(id+':'+key);save(L_listAdmins().map(x=>x.id===id?{...x,hash}:x));return{id,key}}
function L_setOff(id,off,actor){const me=actorRec(actor),t=find(id);if(!t)throw new Error('Admin not found.');if(t.id===me.id)throw new Error('You cannot change your own access.');if(t.role==='Super Admin'&&off)throw perm();save(L_listAdmins().map(x=>x.id===id?{...x,off}:x))}
function L_removeAdmin(id,actor){const me=actorRec(actor),t=find(id);if(!t)throw new Error('Admin not found.');if(t.id===me.id)throw new Error('You cannot remove yourself.');if(t.role==='Super Admin')throw perm();rawDo.remove(id)}
const readP=()=>rd(PK,[]).map(p=>p.status==='Pending'&&p.expires<=Date.now()?{...p,status:'Expired'}:p)
const saveP=p=>{localStorage.setItem(PK,JSON.stringify(p));window.dispatchEvent(new Event('ms:admins'))}
const L_listPermits=()=>readP().sort((a,b)=>b.createdAt-a.createdAt)
function L_requestPermit(actor,action,targetId){const me=actorRec(actor),t=find(targetId)
 if(!['suspend','remove'].includes(action)||!t||t.role!=='Super Admin'||t.id===me.id)throw new Error('A permit is only needed to act on another Super Admin.')
 const ps=readP();if(ps.some(p=>p.status==='Pending'&&p.action===action&&p.target===t.id))throw new Error('A permit request for this is already waiting.')
 const eligible=actives().filter(x=>x.id!==me.id&&x.id!==t.id).length
 const p={id:'PR-'+Date.now().toString(36),action,target:t.id,targetName:t.name,by:me.id,byName:me.name,createdAt:Date.now(),expires:Date.now()+30*6e4,status:'Pending',mode:eligible?'approval':'self'};saveP([p,...ps]);return p}
function L_cancelPermit(actor,id){const me=actorRec(actor),ps=readP(),p=ps.find(x=>x.id===id);if(!p||p.status!=='Pending'||p.by!==me.id)throw new Error('Only the requester can cancel an open request.');saveP(ps.map(x=>x.id===id?{...x,status:'Cancelled'}:x))}
async function L_decidePermit(actor,id,approve,key){
 const me=actorRec(actor),ps=readP(),p=ps.find(x=>x.id===id);if(!p||p.status!=='Pending')throw new Error('This permit request is no longer open.')
 if(me.id===p.target)throw new Error('The admin being affected cannot decide this permit.')
 if(p.mode==='approval'&&me.id===p.by)throw new Error('Another Super Admin must approve your request.')
 if(p.mode==='self'&&me.id!==p.by)throw new Error('Only the requester can authorise this request.')
 if(approve){if(me.hash!==await sha(me.id+':'+String(key||'').trim().toUpperCase()))throw new Error('Your login key is incorrect.')
  const t=find(p.target);if(t){if(!t.off&&actives().filter(x=>x.id!==t.id).length<1)throw new Error('Keep at least one active Super Admin.');rawDo[p.action](t.id)}}
 saveP(readP().map(x=>x.id===id?{...x,status:approve?'Approved':'Rejected',decidedBy:me.id,decidedByName:me.name,decidedAt:Date.now()}:x))}
const L_recentLogins=()=>rd(LK,[])
async function L_loginWithKey(id,key){const a=L_listAdmins().find(x=>x.id===String(id).trim().toUpperCase())
 if(!a||a.hash!==await sha(a.id+':'+String(key).trim().toUpperCase()))throw new Error('Admin ID or login key is incorrect.')
 if(a.off)throw new Error('This admin account is suspended. Ask a Super Admin to reactivate it.')
 localStorage.setItem(LK,JSON.stringify([{id:a.id,name:a.name,time:new Date().toISOString()},...L_recentLogins()].slice(0,20)));window.dispatchEvent(new Event('ms:admins'))
 return{name:a.name,id:a.id,role:a.role,exp:Date.now()+8*36e5}}

// ==== Public API. Every function is async and works in both modes, so the UI never cares where the data lives.
// With VITE_API_URL set, admins, login keys, permits and sign-in history live in MongoDB and every rule is enforced by the server
// (the signed-in admin comes from the session token, so the "actor" argument is only used in local demo mode).
const run=(remote,local)=>BASE?remote():Promise.resolve().then(local)
const q=encodeURIComponent
export const listAdmins=()=>run(()=>http('admins'),()=>L_listAdmins())
export const recentLogins=()=>run(()=>http('logins'),()=>L_recentLogins())
export const listPermits=()=>run(()=>http('permits'),()=>L_listPermits())
export const addAdmin=(name,role,actor)=>run(()=>http('admins','POST',{name,role}),()=>L_addAdmin(name,role,actor))
export const resetKey=(id,actor)=>run(()=>http(`admins/${q(id)}/reset-key`,'POST'),()=>L_resetKey(id,actor))
export const setOff=(id,off,actor)=>run(()=>http(`admins/${q(id)}/off`,'PUT',{off}),()=>L_setOff(id,off,actor))
export const removeAdmin=(id,actor)=>run(()=>http(`admins/${q(id)}`,'DELETE'),()=>L_removeAdmin(id,actor))
export const requestPermit=(actor,action,targetId)=>run(()=>http('permits','POST',{action,target:targetId}),()=>L_requestPermit(actor,action,targetId))
export const cancelPermit=(actor,id)=>run(()=>http(`permits/${q(id)}/cancel`,'POST'),()=>L_cancelPermit(actor,id))
export const decidePermit=(actor,id,approve,key)=>run(()=>http(`permits/${q(id)}/decide`,'POST',{approve,key}),()=>L_decidePermit(actor,id,approve,key))
// The signed-in admin as the server sees them right now (role changes show up here; suspension answers 401).
export const currentAdmin=id=>run(()=>http('auth/me'),()=>L_listAdmins().find(x=>x.id===id)||null)

export async function loginWithKey(id,key){
 if(!BASE)return L_loginWithKey(id,key)
 const {token,user}=await http('auth/login','POST',{id,key},{auth:false});localStorage.setItem('ms_token',token);return user}
export async function googleSignIn(credential){
 if(BASE){const {token,user}=await http('auth/google','POST',{credential},{auth:false});localStorage.setItem('ms_token',token);return user}
 const u=toAdmin(credential);if(!isAllowed(u.email))throw new Error(`${u.email} is not on the admin list.`);localStorage.setItem('ms_token',credential);return u}
