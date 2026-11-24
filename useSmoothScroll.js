import {useEffect} from 'react'
import Lenis from 'lenis'
export default function useSmoothScroll(){useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return
 const l=new Lenis({lerp:.1,prevent:n=>!!n.closest?.('.modal,.drawer,.msgs,.clist,nav,.sbox,.scroll,.xlist')});let r;const f=t=>{l.raf(t);r=requestAnimationFrame(f)};r=requestAnimationFrame(f)
 return()=>{cancelAnimationFrame(r);l.destroy()}},[])}
