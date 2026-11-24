import {useEffect} from 'react'
import {animate} from 'framer-motion'
// Subtle press feedback on every control, driven by framer-motion.
export default function useMicroInteractions(){useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return
 const d=e=>{const el=e.target.closest?.('.btn,.icon,.chip2,.tabs button,.seg button,.conv,.avatar');if(!el||el.disabled)return;animate(el,{scale:[1,.95,1]},{duration:.28,ease:'easeOut'})}
 document.addEventListener('pointerdown',d);return()=>document.removeEventListener('pointerdown',d)},[])}
