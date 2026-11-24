// One place that talks to customers, drivers and companies. Finance, AI, Routes and Messaging all use it,
// so every message lands in the same chat and shows up in Messaging in real time.
import {resources} from './api.js'
import {hhmm} from '../utils/now.js'
let k=0
export const uid=p=>`${p}${Date.now().toString(36)}${(k++).toString(36)}`
export const nextSeq=(items,prefix)=>prefix+String(Math.max(0,...items.map(r=>+((String(r.id).match(/(\d+)$/)||[])[1]||0)))+1).padStart(3,'0')
export const inr=v=>'₹'+Number(v).toLocaleString('en-IN')
// Who is this party: a customer, a driver, or a company (vendor)?
export async function contactFor(name){
 const [c,d]=await Promise.all([resources.customers.list(),resources.drivers.list()]),cu=c.find(x=>x.name===name),dr=d.find(x=>x.name===name)
 return cu?{name,type:'Customer',ref:cu.id}:dr?{name,type:'Driver',ref:dr.id}:{name,type:'Company',ref:null}}
export async function sendTo({name,type,ref=null},text,from='me'){
 const list=await resources.conversations.list(),c=list.find(x=>x.name===name&&x.type===type),msg={id:uid('m'),from,text,time:hhmm(new Date())}
 if(!c)return resources.conversations.create({id:nextSeq(list,'T-'),name,type,ref,unread:from==='them'?1:0,messages:[msg]})
 return resources.conversations.update(c.id,{messages:[...c.messages,msg],unread:from==='them'?(c.unread||0)+1:(c.unread||0)})}
export async function notify(title,body,level='Info'){const l=await resources.notifications.list();return resources.notifications.create({id:nextSeq(l,'N-'),title,body,level,time:'just now',status:'Unread'})}
