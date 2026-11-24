import {motion,AnimatePresence,animate} from 'framer-motion'
import {useEffect,useRef,useState} from 'react'
import {X} from 'lucide-react'
let seq=0
export const GlassCard=({children,className='',...p})=>{const d=useRef(((seq=(seq+1)%8)*.045)).current;return <motion.div className={'glass '+className} initial={{opacity:0,y:16}} animate={{opacity:1,y:0,transition:{delay:d,type:'spring',stiffness:260,damping:26}}} whileHover={{y:-2}} transition={{type:'spring',stiffness:300,damping:24}} {...p}>{children}</motion.div>}
export function Counter({value,suffix='',decimals=0}){
 const [v,setV]=useState(0)
 useEffect(()=>{const c=animate(0,value,{duration:.9,ease:'easeOut',onUpdate:setV});return()=>c.stop()},[value])
 return <>{v.toLocaleString('en-IN',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}{suffix}</>
}
export const KPI=({icon:I,label,value,suffix,decimals,delta,onClick})=>(
 <GlassCard className="kpi" onClick={onClick} role={onClick?'button':undefined} tabIndex={onClick?0:undefined}>
  <div className="kpi-ic"><I size={18}/></div><div><small>{label}</small>
  <h3><Counter value={value} suffix={suffix} decimals={decimals}/></h3>
  {delta!=null&&<span className={'chip '+(delta>=0?'up':'down')}>{delta>=0?'+':''}{delta}%</span>}</div>
 </GlassCard>)
const Backdrop=({onClose,children})=><motion.div className="backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>{children}</motion.div>
export const Modal=({open,onClose,title,children})=><AnimatePresence>{open&&<Backdrop onClose={onClose}>
 <motion.div className="glass modal" onClick={e=>e.stopPropagation()} initial={{opacity:0,scale:.94,filter:'blur(8px)'}} animate={{opacity:1,scale:1,filter:'blur(0px)'}} exit={{opacity:0,scale:.96}} transition={{type:'spring',stiffness:320,damping:28}}>
 <header><h2>{title}</h2>{onClose&&<button className="icon" aria-label="Close" onClick={onClose}><X size={18}/></button>}</header>{children}</motion.div></Backdrop>}</AnimatePresence>
export const Drawer=({open,onClose,title,children})=><AnimatePresence>{open&&<Backdrop onClose={onClose}>
 <motion.aside className="glass drawer" onClick={e=>e.stopPropagation()} initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',stiffness:300,damping:34}}>
 <header><h2>{title}</h2><button className="icon" aria-label="Close" onClick={onClose}><X size={18}/></button></header>{children}</motion.aside></Backdrop>}</AnimatePresence>
