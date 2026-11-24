import {useCallback,useEffect,useState} from 'react'
import {resources} from '../services/api.js'
export function useResource(name){
 const r=resources[name];const [items,setItems]=useState(()=>r.sync());const [error,setError]=useState(null)
 const refresh=useCallback(()=>r.list().then(setItems).catch(setError),[r])
 useEffect(()=>{refresh();window.addEventListener('ms:'+name,refresh);const t=r.remote&&setInterval(refresh,10000);return()=>{window.removeEventListener('ms:'+name,refresh);t&&clearInterval(t)}},[name,refresh,r])
 return {items,error,refresh,create:r.create,update:r.update,remove:r.remove}
}
export function useTick(ms=2000){const [n,setN]=useState(0);useEffect(()=>{const t=setInterval(()=>setN(x=>x+1),ms);return()=>clearInterval(t)},[ms]);return n}
