import {useEffect,useRef} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {CITIES} from '../data/trackData.js'
// Google-style web map of West Bengal (Leaflet). Tile sources need no API key; swap in your own provider in TILES.
const TILES={Map:['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png','© OpenStreetMap contributors'],Satellite:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}','Tiles © Esri'],Terrain:['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png','© OpenTopoMap']}
const icon=(v,on)=>L.divIcon({className:'',html:`<span class="vm s-${v.status}${on?' on':''}">${(v.vehicle||v.id).slice(-3)}</span>`,iconSize:[34,34],iconAnchor:[17,17]})
export default function GeoMap({fleet,selId,onSelect,heat='off',follow,height=460,path}){
 const el=useRef(),map=useRef(),mk=useRef({}),hg=useRef(),rt=useRef(),pick=useRef(onSelect),pk=path?path.map(p=>p.join()).join('|'):'';pick.current=onSelect
 useEffect(()=>{let m;try{m=L.map(el.current,{center:[24.2,87.9],zoom:7,minZoom:6,maxBounds:[[20.5,84.5],[28.2,90.5]]})}catch(e){el.current.textContent='Map could not start: '+e.message;return};map.current=m
  const base=Object.fromEntries(Object.entries(TILES).map(([k,[u,a]])=>[k,L.tileLayer(u,{attribution:a,maxZoom:18})]));base.Map.addTo(m)
  L.control.layers(base,{},{position:'topright'}).addTo(m);hg.current=L.layerGroup().addTo(m);const t=setTimeout(()=>map.current&&m.invalidateSize(),200)
  return()=>{clearTimeout(t);m.remove();map.current=null;mk.current={}}},[])
 useEffect(()=>{const m=map.current;if(!m)return;fleet.forEach(v=>{const on=v.id===selId;let k=mk.current[v.id];if(!k){k=mk.current[v.id]=L.marker([v.lat,v.lng],{icon:icon(v,on)}).addTo(m).on('click',()=>pick.current(v.id))}
   else{k.setLatLng([v.lat,v.lng]);k.setIcon(icon(v,on))}k.bindTooltip(`${v.id} · ${v.product}`)})
  const s=fleet.find(v=>v.id===selId);if(follow&&s)m.panTo([s.lat,s.lng],{animate:true})},[fleet,selId,follow])
 useEffect(()=>{const g=hg.current;if(!g)return;g.clearLayers();if(heat==='off')return
  const val=c=>heat==='today'?c.d:c.m,max=Math.max(...CITIES.map(val))
  CITIES.forEach(c=>{const n=val(c)/max;[1,.55].forEach((f,i)=>L.circleMarker(c.ll,{radius:(14+n*30)*f,stroke:false,fillColor:i?'#FFB547':'#FF4D67',fillOpacity:(.12+n*.4)*(i?1.2:.8)}).bindTooltip(`${c.name}: ${val(c)} deliveries ${heat==='today'?'today':'this month'}`).addTo(g))})},[heat])
 useEffect(()=>{const m=map.current;if(!m)return;if(rt.current){rt.current.remove();rt.current=null}if(path&&path.length>1)rt.current=L.polyline(path,{color:'#58B9F5',weight:3,dashArray:'6 8',opacity:.85}).addTo(m)},[pk])
 return <div ref={el} className="geo" style={{'--h':height+'px'}} role="application" aria-label="Map of West Bengal with live vehicles"/>}
