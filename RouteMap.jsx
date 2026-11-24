import {useEffect,useRef} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {LOC} from '../data/trackData.js'
// Real map for route planning. Amber dashed = your stop order, blue = optimized order.
export default function RouteMap({start,stops,orig,opt,height=420}){
 const el=useRef(),map=useRef(),lg=useRef()
 useEffect(()=>{let m;try{m=L.map(el.current,{center:[23.5,87.9],zoom:7,minZoom:6,maxBounds:[[20.5,84.5],[28.2,90.5]]})}catch(e){el.current.textContent='Map could not start: '+e.message;return};map.current=m
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(m);lg.current=L.layerGroup().addTo(m);const t=setTimeout(()=>map.current&&m.invalidateSize(),200)
  return()=>{clearTimeout(t);m.remove();map.current=null}},[])
 useEffect(()=>{const g=lg.current,m=map.current;if(!g||!m)return;g.clearLayers();const pts=n=>n.map(x=>LOC[x]),seq=opt||[start,...stops]
  if(orig)L.polyline(pts(orig),{color:'#FFB547',weight:3,dashArray:'6 8',opacity:.85}).addTo(g)
  if(opt)L.polyline(pts(opt),{color:'#2D99DC',weight:5,opacity:.95}).addTo(g)
  seq.forEach((n,i)=>L.marker(LOC[n],{icon:L.divIcon({className:'',html:`<span class="vm${i===0?' on':''}">${i===0?'S':i}</span>`,iconSize:[34,34],iconAnchor:[17,17]})}).bindTooltip(n).addTo(g))
  if(seq.length>1){try{m.fitBounds(L.latLngBounds(pts(seq)),{padding:[40,40],maxZoom:9})}catch{}}},[start,stops,orig,opt])
 return <div ref={el} className="geo" style={{'--h':height+'px'}} role="application" aria-label="Route map"/>}
