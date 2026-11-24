import {Users,UserCheck,UserX,Plane,Star,Package,Clock,Truck,CheckCircle2,AlertTriangle,Ban,Building2,Wallet,TrendingUp,Receipt,Bell,UserMinus,CheckCheck} from 'lucide-react'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts'
import ResourcePage from '../components/ResourcePage.jsx'
import {GlassCard} from '../components/ui.jsx'
import {CATS,PLACES} from '../data/trackData.js'
const n=(items,k,v)=>items.filter(x=>x[k]===v).length
const S=(label,options)=>({key:'status',label,type:'select',options,tone:true})
const inr=v=>'₹'+Number(v).toLocaleString('en-IN')
export const Drivers=()=><ResourcePage name="drivers" noun="driver" prefix="D-" statusKey="status"
 columns={[{key:'id',label:'ID',form:false},{key:'name',label:'Name'},{key:'phone',label:'Contact'},{key:'vehicle',label:'Vehicle'},{key:'route',label:'Route'},{key:'deliveries',label:'Deliveries',type:'number'},{key:'score',label:'Score',type:'number'},S('Status',['Active','Available','On Leave','Resigned'])]}
 kpis={d=>[{icon:Users,label:'Total drivers',value:d.length},{icon:UserCheck,label:'Active',value:n(d,'status','Active')},{icon:Clock,label:'Available',value:n(d,'status','Available')},{icon:Plane,label:'On leave',value:n(d,'status','On Leave')},{icon:UserX,label:'Resigned',value:n(d,'status','Resigned')},{icon:Star,label:'Avg score',value:d.length?Math.round(d.reduce((s,x)=>s+x.score,0)/d.length):0}]}
 actions={[{label:'Mark as left',icon:UserMinus,show:r=>r.status!=='Resigned',run:(r,{update})=>update(r.id,{status:'Resigned',vehicle:'—',route:'—'})}]}/>
export const Shipments=()=><ResourcePage name="shipments" noun="shipment" prefix="SH-" statusKey="status"
 columns={[{key:'id',label:'Shipment',form:false},{key:'customer',label:'Customer'},{key:'origin',label:'Origin',type:'select',options:PLACES},{key:'destination',label:'Destination',type:'select',options:PLACES},{key:'category',label:'Category',type:'select',options:CATS},{key:'product',label:'Product'},{key:'vehicle',label:'Vehicle'},{key:'driver',label:'Driver'},{key:'date',label:'Date',type:'date'},{key:'eta',label:'Expected',type:'date'},S('Status',['Pending','In Transit','Delivered','Delayed','Cancelled']),{key:'priority',label:'Priority',type:'select',options:['High','Medium','Low'],tone:true}]}
 kpis={d=>[{icon:Package,label:'Shipments listed',value:d.length},{icon:Clock,label:'Pending',value:n(d,'status','Pending')},{icon:Truck,label:'In transit',value:n(d,'status','In Transit')},{icon:CheckCircle2,label:'Delivered',value:n(d,'status','Delivered')},{icon:AlertTriangle,label:'Delayed',value:n(d,'status','Delayed')},{icon:Ban,label:'Cancelled',value:n(d,'status','Cancelled')}]}/>
export const Deliveries=()=><ResourcePage name="deliveries" noun="delivery" prefix="DL-" statusKey="status"
 columns={[{key:'id',label:'Delivery',form:false},{key:'shipment',label:'Shipment'},{key:'driver',label:'Driver'},{key:'vehicle',label:'Vehicle'},{key:'eta',label:'ETA'},{key:'proof',label:'Proof',type:'select',options:['Signed','OTP','Photo','Pending']},S('Status',['In Transit','Delivered','Delayed','Failed'])]}
 kpis={d=>[{icon:Truck,label:'In transit',value:n(d,'status','In Transit')},{icon:CheckCircle2,label:'Delivered',value:n(d,'status','Delivered')},{icon:AlertTriangle,label:'Delayed',value:n(d,'status','Delayed')},{icon:Ban,label:'Failed',value:n(d,'status','Failed')}]}/>
export const Customers=()=><ResourcePage name="customers" noun="customer" prefix="C-" statusKey="status"
 columns={[{key:'id',label:'ID',form:false},{key:'name',label:'Company'},{key:'phone',label:'Contact'},{key:'city',label:'City'},{key:'type',label:'Type',type:'select',options:['Enterprise','SME','Retail']},{key:'orders',label:'Orders',type:'number'},S('Status',['Active','Inactive'])]}
 kpis={d=>[{icon:Building2,label:'Customers',value:d.length},{icon:UserCheck,label:'Active',value:n(d,'status','Active')},{icon:Package,label:'Total orders',value:d.reduce((s,x)=>s+x.orders,0)}]}/>
export const Notifications=()=><ResourcePage name="notifications" noun="notification" prefix="N-" statusKey="status"
 columns={[{key:'id',label:'ID',form:false},{key:'title',label:'Title'},{key:'body',label:'Details'},{key:'level',label:'Level',type:'select',options:['Info','Warning','Critical'],tone:true},{key:'time',label:'When'},S('Status',['Unread','Read'])]}
 kpis={d=>[{icon:Bell,label:'Unread',value:n(d,'status','Unread')},{icon:AlertTriangle,label:'Critical',value:n(d,'level','Critical')}]}
 actions={[{label:'Mark read',icon:CheckCheck,show:r=>r.status==='Unread',run:(r,{update})=>update(r.id,{status:'Read'})}]}/>
