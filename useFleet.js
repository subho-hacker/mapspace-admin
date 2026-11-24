import {useEffect,useState} from 'react'
import {FLEET,LOC} from '../data/trackData.js'
import {useResource} from './useResource.js'
const rad=x=>x*Math.PI/180
export const km=(a,b)=>{const h=Math.sin(rad(b[0]-a[0])/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2;return 12742*Math.asin(Math.sqrt(h))}
const SCALE=40 // simulation speed-up so movement is visible on screen
// A shipment is on the road when it was dispatched (Routes, AI) or created by an admin, and is In Transit or Delayed.
export const isLive=s=>!!(s.createdAt||s.startedAt)&&['In Transit','Delayed'].includes(s.status)&&!!LOC[s.origin]&&!!LOC[s.destination]
const along=(pts,f)=>{const L=pts.slice(1).map((p,i)=>km(pts[i],p)),tot=L.reduce((a,b)=>a+b,0)||1;let d=Math.min(Math.max(f,0),1)*tot
 for(let i=0;i<L.length;i++){if(d<=L[i]||i===L.length-1){const u=L[i]?Math.min(1,d/L[i]):0;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*u,pts[i][1]+(pts[i+1][1]-pts[i][1])*u]}d-=L[i]}}
// Simulated GPS feed along straight legs between West Bengal places. Replace with real telemetry via services/api.js.
export default function useFleet(ms=2000){
 const [t,setT]=useState(0),{items}=useResource('shipments')
 useEffect(()=>{const s=Date.now(),i=setInterval(()=>setT((Date.now()-s)/1000),ms);return()=>clearInterval(i)},[ms])
 const upd=new Date().toLocaleTimeString('en-IN')
 const base=FLEET.map(v=>{const a=LOC[v.from],b=LOC[v.to],d=km(a,b)||1,u=(v.p0+t*v.kmh*SCALE/3600/d)%2,p=u>1?2-u:u,dir=u>1?-1:1
  const left=Math.round(d*(dir>0?1-p:p)*10)/10
  return{...v,lat:a[0]+(b[0]-a[0])*p,lng:a[1]+(b[1]-a[1])*p,dist:Math.round(d),left,etaMin:v.kmh?Math.round(left/v.kmh*60):0,speed:v.kmh?Math.round(v.kmh+Math.sin(t/3)*4):0,updated:upd,path:[a,b]}})
 const live=items.filter(isLive).map(s=>{const pts=[s.origin,...(s.stops||[]),s.destination].map(n=>LOC[n]).filter(Boolean),tot=pts.slice(1).reduce((a,p,i)=>a+km(pts[i],p),0)||1,kmh=s.kmh||42
  const f=Math.min(1,Math.max(0,(Date.now()-(s.startedAt||s.createdAt))/1000)*kmh*SCALE/3600/tot),[lat,lng]=along(pts,f),left=Math.round(tot*(1-f)*10)/10
  return{id:s.id,vehicle:s.vehicle,shipment:s.id,live:true,driver:s.driver,from:s.origin,to:s.destination,category:s.category||'—',product:s.product||'—',qty:s.qty||'—',kmh,status:s.status==='Delayed'?'Delayed':'On Time',fuel:80,lat,lng,dist:Math.round(tot),left,etaMin:f>=1?0:Math.round(left/kmh*60),speed:f>=1?0:kmh,updated:upd,path:pts}})
 return [...base,...live]}
