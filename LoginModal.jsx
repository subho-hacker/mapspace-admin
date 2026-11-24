import {useEffect,useRef,useState} from 'react'
import {Modal} from './ui.jsx'
import {GOOGLE_CLIENT_ID,loadGoogle,googleSignIn,loginWithKey} from '../services/auth.js'
export default function LoginModal({open,onLogin}){
 const [notice,setNotice]=useState('');useEffect(()=>{if(open){setNotice(sessionStorage.getItem('ms_notice')||'');sessionStorage.removeItem('ms_notice')}},[open])
 const btn=useRef(),[err,setErr]=useState(''),[id,setId]=useState(''),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[fails,setFails]=useState({n:0,until:0})
 useEffect(()=>{if(!open||!GOOGLE_CLIENT_ID)return;let dead=false
  loadGoogle().then(g=>{if(dead||!btn.current)return
   g.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:async r=>{try{const u=await googleSignIn(r.credential);setErr('');onLogin(u)}catch(e){setErr(e.message||'Google sign-in failed. Please try again.')}}})
   g.accounts.id.renderButton(btn.current,{theme:'filled_blue',size:'large',shape:'pill',text:'signin_with',width:300})}).catch(()=>setErr('Could not load Google sign-in. Check your connection.'))
  return()=>{dead=true}},[open])
 const go=async()=>{if(Date.now()<fails.until)return setErr('Too many attempts. Wait 30 seconds and try again.')
  if(!id.trim()||!key.trim())return setErr('Enter your admin ID and login key.');setBusy(true);setErr('')
  try{onLogin(await loginWithKey(id,key));setKey('')}catch(e){const n=fails.n+1;setFails({n:n%5,until:n>=5?Date.now()+3e4:0});setErr(e.message)}setBusy(false)}
 return <Modal open={open} title="Sign in to MapSpace">
  {notice&&<p className="err" role="alert">{notice}</p>}<p className="muted">Each admin signs in with their own admin ID and private login key. Ask a Super Admin for yours.</p>
  <label>Admin ID<input value={id} onChange={e=>setId(e.target.value)} placeholder="MS-ADM-001" autoComplete="username"/></label>
  <label>Login key<input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="MS-XXXX-XXXX-XXXX" autoComplete="current-password" onKeyDown={e=>e.key==='Enter'&&go()}/></label>
  {err&&<p className="err" role="alert">{err}</p>}<button className="btn" onClick={go} disabled={busy}>{busy?'Checking…':'Sign in'}</button>
  {GOOGLE_CLIENT_ID&&<><p className="muted center">or</p><div ref={btn} className="gbtn"/></>}</Modal>}
