import {useEffect,useState} from 'react'
import {Routes,Route,useLocation} from 'react-router-dom'
import {AnimatePresence,motion} from 'framer-motion'
import {Sidebar,Topbar,ProfilePopup,NAV} from './components/layout.jsx'
import LoginModal from './components/LoginModal.jsx'
import {loadSession,clearSession,DEMO_ADMIN,currentAdmin} from './services/auth.js'
import {refreshAll,BASE} from './services/api.js'
import useSmoothScroll from './hooks/useSmoothScroll.js'
import useMicroInteractions from './hooks/useMicroInteractions.js'
import ScrollProgress from './components/ScrollProgress.jsx'
import FleetManagement from './pages/FleetManagement.jsx'
import Analytics from './pages/Analytics.jsx'
import AIIntelligence from './pages/AIIntelligence.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Messaging from './pages/Messaging.jsx'
import RouteOptimization from './pages/RouteOptimization.jsx'
import Settings from './pages/Settings.jsx'
import {Drivers,Shipments,Deliveries,Customers,Notifications} from './pages/Sections.jsx'
import Finance from './pages/Finance.jsx'
import Tracking from './pages/Tracking.jsx'
const done={'/':Dashboard,'/fleet':FleetManagement,'/routes':RouteOptimization,'/tracking':Tracking,'/analytics':Analytics,'/shipments':Shipments,'/deliveries':Deliveries,'/drivers':Drivers,'/ai':AIIntelligence,'/messages':Messaging,'/customers':Customers,'/finance':Finance,'/notifications':Notifications,'/settings':Settings}
export default function App(){
 const loc=useLocation();useSmoothScroll();useMicroInteractions();useEffect(()=>{window.scrollTo(0,0)},[loc.pathname])
 const [auth,setAuth]=useState(()=>!!loadSession())
 const [collapsed,setCollapsed]=useState(false);const [profile,setProfile]=useState(false)
 const [admin,setAdmin]=useState(()=>loadSession()||DEMO_ADMIN)
 const login=u=>{const a={...(u||DEMO_ADMIN),loginTime:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})};localStorage.setItem('ms_user',JSON.stringify(a));setAdmin(a);setAuth(true);refreshAll()}
 useEffect(()=>{if(!auth||!admin.exp)return;const t=setTimeout(()=>{clearSession();setAuth(false)},Math.max(0,admin.exp-Date.now()));return()=>clearTimeout(t)},[auth,admin])
 // Access changes by a Super Admin (suspend, remove, role change) take effect here within seconds.
 useEffect(()=>{if(!auth||String(admin.id).startsWith('GL-'))return;let dead=false;const chk=async()=>{let a;try{a=await currentAdmin(admin.id)}catch{return}   // offline or 401: the ms:unauth handler below deals with 401
  if(dead)return;if(!a||a.off){sessionStorage.setItem('ms_notice','Your access was suspended or removed by a Super Admin.');clearSession();setAuth(false);return}if(a.role!==admin.role)setAdmin(p=>({...p,role:a.role}))};chk();const ev=['ms:admins','ms:permits'];ev.forEach(e=>addEventListener(e,chk));const t=setInterval(chk,BASE?8000:4000);return()=>{dead=true;ev.forEach(e=>removeEventListener(e,chk));clearInterval(t)}},[auth,admin.id,admin.role])
 // The server answered 401 (session expired, or the admin was suspended or removed): back to the sign-in screen.
 useEffect(()=>{const f=e=>{if(!auth)return;sessionStorage.setItem('ms_notice',e.detail||'Please sign in again.');clearSession();setAuth(false)};addEventListener('ms:unauth',f);return()=>removeEventListener('ms:unauth',f)},[auth])
 const logout=()=>{clearSession();setProfile(false);setAuth(false)}
 return <div className="app"><ScrollProgress/><Sidebar collapsed={collapsed} toggle={()=>setCollapsed(!collapsed)} admin={admin}/>
  <main><Topbar admin={admin} onProfile={()=>setProfile(!profile)}/><ProfilePopup open={profile} admin={admin} onClose={()=>setProfile(false)} onLogout={logout}/>
   <AnimatePresence mode="wait"><motion.div key={loc.pathname} initial={{opacity:0,y:10,filter:'blur(6px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0}} transition={{duration:.25}}>
    <Routes location={loc}>{NAV.map(([to,label])=>{const P=done[to];return <Route key={to} path={to} element={P?<P admin={admin}/>:<Placeholder title={label} note={to==='/'?'Mount your existing dashboard here.':undefined}/>}/>})}</Routes></motion.div></AnimatePresence></main>
  <LoginModal open={!auth} onLogin={login}/></div>}
const cors = require("cors");


