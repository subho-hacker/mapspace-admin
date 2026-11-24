import {useMemo} from 'react'
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts'
import {Package,Clock,Truck} from 'lucide-react'
import {GlassCard,KPI} from '../components/ui.jsx'
import {useResource,useTick} from '../hooks/useResource.js'
import useSettings from '../hooks/useSettings.js'
import LiveMap from '../components/LiveMap.jsx'
import DeliveryHeatmap from '../components/DeliveryHeatmap.jsx'
import {CATS} from '../data/trackData.js'
import {CM} from '../utils/now.js'
import {monthly,growth} from '../data/analyticsData.js'
import EfficiencyCard from '../components/EfficiencyCard.jsx'
import CategoryBars from '../components/CategoryBars.jsx'
import {isLive} from '../hooks/useFleet.js'
import {FLEET} from '../data/trackData.js'
import {TODAY} from '../utils/now.js'
export default function Dashboard(){
 const {refresh}=useSettings(),ms=(+refresh||2)*1000
 const tick=useTick(ms);const {items}=useResource('shipments');const veh=useResource('vehicles').items
 const series=useMemo(()=>Array.from({length:15},(_,i)=>{const t=tick-14+i;return{time:new Date(Date.now()-(14-i)*ms).toLocaleTimeString('en-IN',{minute:'2-digit',second:'2-digit'}),speed:Math.round(90+35*Math.sin(t/3)),fuel:Math.round(75+30*Math.cos(t/4))}}),[tick,ms])
 const total=items.length||1,pct=s=>Math.round(items.filter(x=>x.status===s).length/total*100)
 const mine=items.filter(x=>x.createdAt),mineMonth=mine.filter(x=>String(x.date).startsWith(TODAY.slice(0,7))),onRoad=FLEET.filter(v=>v.status!=='Idle').length+items.filter(isLive).length
 const cat=CATS.map(c=>({c,n:items.filter(x=>x.category===c).length})),top=Math.max(1,...cat.map(x=>x.n))
 return <div className="page"><div className="dash">
  <div className="col"><GlassCard className="mapcard" whileHover={{}}><LiveMap height={430}/></GlassCard><CategoryBars/></div>
  <div className="side">
   <GlassCard whileHover={{}}><h3>Delivery status</h3>{[['Delivered','#2D99DC'],['In Transit','#58B9F5'],['Delayed','#FFB547'],['Pending','#A8B8CA']].map(([s,c])=><div className="bar" key={s}><span>{s}</span><div><i style={{width:pct(s)+'%',background:c}}/></div><b>{pct(s)}%</b></div>)}</GlassCard>
   <EfficiencyCard series={series} ms={ms}/>
   <div className="grid kpis2"><KPI icon={Package} label="Total shipments (month to date)" value={monthly[CM].shipments+mineMonth.length} delta={growth(CM,'shipments')}/><KPI icon={Clock} label="Pending orders" value={200+mine.filter(x=>x.status==='Pending').length}/><KPI icon={Truck} label={`Active vehicles (of ${veh.length||120})`} value={veh.length?veh.filter(v=>v.status==='Active').length:92}/><KPI icon={Truck} label="Deliveries on the road now" value={onRoad}/></div></div></div>
  <div className="grid charts"><DeliveryHeatmap/>
   <GlassCard whileHover={{}}><h3>Shipments by product category</h3>{cat.map(x=><div className="bar" key={x.c}><span>{x.c}</span><div><i style={{width:x.n/top*100+'%',background:'#58B9F5'}}/></div><b>{x.n}</b></div>)}
    <p className="muted">Open Shipment Management to see the product in each shipment.</p></GlassCard></div></div>}
