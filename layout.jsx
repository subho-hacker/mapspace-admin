import {useEffect,useState} from 'react'
import {NavLink,useLocation} from 'react-router-dom'
import {motion,AnimatePresence} from 'framer-motion'
import {MapPin,LayoutGrid,Truck,Route,Gauge,Package,PackageCheck,Users,Sparkles,MessageSquare,UserRound,Wallet,Bell,Settings,Search,Mail,Navigation,PanelLeft,Power,Info,Eye,EyeOff} from 'lucide-react'
import {Modal} from './ui.jsx'
import Logo from './Logo.jsx'
import {SearchBox,MailLink} from './TopTools.jsx'
export const NAV=[['/','Dashboard',LayoutGrid],['/fleet','Fleet Management',Truck],['/routes','Route Optimization',Route],['/tracking','Live Tracking',Navigation],['/analytics','Analytics & Reports',Gauge],['/shipments','Shipment Management',Package],['/deliveries','Delivery Management',PackageCheck],['/drivers','Drivers Management',Users],['/ai','AI Intelligence',Sparkles],['/messages','Messaging Center',MessageSquare],['/customers','Customer Management',UserRound],['/finance','Financial Management',Wallet],['/notifications','Notifications',Bell],['/settings','Settings',Settings]]
export function Sidebar({collapsed,toggle,admin}){
 return <motion.aside className={'sidebar'+(collapsed?' collapsed':'')} animate={{width:collapsed?84:268}} transition={{type:'spring',stiffness:260,damping:30}}>
  <div className="brand"><Logo collapsed={collapsed}/><button className="icon" onClick={toggle} aria-label="Collapse sidebar"><PanelLeft size={18}/></button></div>
  <nav>{NAV.map(([to,label,I])=><NavLink key={to} to={to} end={to==='/'} title={collapsed?label:undefined} className="nav">
   {({isActive})=><>{isActive&&<motion.i layoutId="pill" className="pill" transition={{type:'spring',stiffness:350,damping:32}}/>}<I size={20}/>{!collapsed&&<span>{label}</span>}</>}</NavLink>)}</nav>
  <div className="who glass">{collapsed?<b>{admin.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</b>:<><b>{admin.name}</b><small>Admin Dashboard</small></>}</div>
 </motion.aside>}
export function Topbar({admin,onProfile}){
 const [t,setT]=useState(new Date());useEffect(()=>{const i=setInterval(()=>setT(new Date()),30000);return()=>clearInterval(i)},[])
 const {pathname}=useLocation();const title=(NAV.find(n=>n[0]===pathname)||NAV[0])[1]
 return <header className="topbar"><h1>{title}</h1><div className="ops">Operations : Active <i className="dot"/></div>
  <div className="tools"><SearchBox/><MailLink/>
  <button className="avatar" onClick={onProfile} aria-label="Open profile">{admin.picture?<img src={admin.picture} alt="" referrerPolicy="no-referrer"/>:admin.name[0]}</button><span>{t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span></div></header>}
export function ProfilePopup({open,admin,onClose,onLogout}){
 return <AnimatePresence>{open&&<><div className="backdrop clear" onClick={onClose}/>
  <motion.div className="glass profile" initial={{opacity:0,scale:.9,y:-12,filter:'blur(10px)'}} animate={{opacity:1,scale:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,scale:.95}} transition={{type:'spring',stiffness:320,damping:26}}>
   <div className="row"><b>{admin.name}</b><Info size={16}/></div>{admin.email&&<small>{admin.email}</small>}<small>Admin ID : {admin.id}</small><small>Profile : {admin.role}</small><small>Login time : {admin.loginTime}</small>
   <button className="power" onClick={onLogout}><Power size={16}/> Log out</button></motion.div></>}</AnimatePresence>}
export function LoginModal({open,onLogin}){
 const [id,setId]=useState('');const [pw,setPw]=useState('');const [show,setShow]=useState(false);const [err,setErr]=useState('');const [busy,setBusy]=useState(false)
 const go=()=>{if(!id.trim()||pw.length<4)return setErr('Enter your email or admin ID and a password of at least 4 characters.');setErr('');setBusy(true);setTimeout(()=>{setBusy(false);onLogin()},900)}
 return <Modal open={open} title="Sign in to MapSpace">
  <p className="muted">Demo sign-in only. Nothing is verified or sent anywhere.</p>
  <label>Email or admin ID<input value={id} onChange={e=>setId(e.target.value)} placeholder="admin@mapspace.in"/></label>
  <label>Password<span className="pw"><input type={show?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}/><button className="icon" onClick={()=>setShow(!show)} aria-label="Show password">{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>
  {err&&<p className="err" role="alert">{err}</p>}
  <button className="btn" onClick={go} disabled={busy}>{busy?'Signing in…':'Sign in'}</button></Modal>}
