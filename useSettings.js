import {useEffect,useState} from 'react'
import {settings} from '../services/api.js'
// Company settings, live: reloads whenever they are saved (or after sign-in, when they come from the server).
export default function useSettings(){
 const [s,setS]=useState(()=>settings.cached())
 useEffect(()=>{let dead=false;const f=()=>settings.load().then(v=>{if(!dead)setS(v||{})}).catch(()=>{});f();window.addEventListener('ms:settings',f);return()=>{dead=true;window.removeEventListener('ms:settings',f)}},[])
 return s}
