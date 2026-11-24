import {TD,TODAY} from '../utils/now.js'
const MP=TODAY.slice(0,7)
import {CATS,PRODUCTS} from './trackData.js'
import {vehicles} from './fleetData.js'
const areas=['Kolkata','Howrah','Dankuni','Baranagar','New Town','Maheshtala']
const at=(a,i)=>a[i%a.length],pad=(n,w=3)=>String(n).padStart(w,'0')
const names=('Arjun Das,Rahul Sen,Imran Sheikh,Sourav Pal,Debraj Roy,Tapan Ghosh,Amit Saha,Biplab Dey,Kunal Basu,Rohit Mitra,Sanjay Ghosh,Pritam Jana,Subrata Paul,Anirban Dutta,Joydeep Nandi,Manas Bera,Sk Rafique,Debasis Roy,Gopal Mondal,Nitai Das,Suman Karmakar,Ratan Pramanik,Alok Sarkar,Shyam Halder,Tarun Biswas,Mithun Dey,Pranab Ghosh,Kartik Maity,Raju Shaw,Bikash Laha,Sabir Ali,Naba Kumar').split(',')
const dPool=[...Array(18).fill('Active'),...Array(8).fill('Available'),...Array(4).fill('On Leave'),...Array(2).fill('Resigned')]
const drivers=names.map((name,i)=>({id:`D-${pad(i+1)}`,name,phone:`+91 98300 ${10000+i*137}`,vehicle:`LGS-${101+i}`,route:`${at(areas,i)} → ${at(areas,i+2)}`,deliveries:120+(i*17)%300,score:70+(i*7)%30,status:dPool[(i*5)%32]}))
const cos=['Foods','Steel','Pharma','Textiles','Electronics','Traders']
const customers=Array.from({length:20},(_,i)=>({id:`C-${pad(i+1)}`,name:`${at(areas,i)} ${at(cos,i*2+1)} ${['Pvt Ltd','Enterprises','Industries','& Sons'][Math.floor(i/6)]}`,phone:`+91 98310 ${20000+i*211}`,city:at(areas,i),type:at(['Enterprise','SME','Retail'],i),orders:10+(i*13)%90,status:i%7===6?'Inactive':'Active'}))
const sPool=['Delivered','In Transit','Pending','Delayed','Delivered','In Transit','Cancelled','Delivered']
const shipments=Array.from({length:40},(_,i)=>({id:`SH-${2400+i}`,customer:customers[i%20].name,origin:at(areas,i),destination:at(areas,i+2),vehicle:`LGS-${101+i}`,driver:names[i%32],category:at(CATS,i),product:at(PRODUCTS[at(CATS,i)],i*5),date:`${MP}-${pad(1+i%TD,2)}`,eta:`${MP}-${pad(Math.min(30,2+i%TD),2)}`,status:at(sPool,i*3),priority:at(['High','Medium','Low'],i)}))
const dStat=['Delivered','In Transit','Delayed','Delivered','Failed']
const deliveries=Array.from({length:30},(_,i)=>({id:`DL-${5000+i}`,shipment:`SH-${2400+i}`,driver:names[i%32],vehicle:`LGS-${101+i}`,eta:`${pad(8+i%12,2)}:${pad((i*7)%60,2)}`,proof:at(['Signed','OTP','Photo','Pending'],i),status:at(dStat,i*2)}))
const tt=['Revenue','Fuel','Maintenance','Salary','Toll','Insurance','Rent']
const parties={Revenue:cos,Fuel:['Indian Oil','HP Fuel Station','BPCL Depot'],Maintenance:['Howrah Auto Works','Dankuni Garage'],Salary:['Driver payroll','Staff payroll'],Toll:['NHAI FASTag','Vidyasagar Setu toll'],Insurance:['New India Assurance'],Rent:['Baranagar Warehouse']}
const transactions=Array.from({length:70},(_,i)=>{const type=at(tt,i*3+(i>>3)),day=1+i%TD,paid=day<=TD-8?i%5!==0:i%4===0,due=Math.min(30,day+(type==='Revenue'?15:7))
 return{id:`TX-${9000+i}`,date:`${MP}-${pad(day,2)}`,type,party:type==='Revenue'?customers[i%20].name:type==='Salary'?names[i%32]:at(parties[type],i),description:`${type} · ${at(areas,i)}`,amount:type==='Revenue'?42000+(i*3100)%60000:type==='Rent'?65000:type==='Salary'?28000+(i*1900)%30000:4000+(i*1700)%18000,due:`${MP}-${pad(due,2)}`,paidOn:paid?`${MP}-${pad(day,2)}`:'',status:paid?'Paid':due<TD?'Overdue':'Pending'}})
// Always keep a few overdue customer invoices so reminders can be used on any day of the month.
{let k=0;transactions.forEach(t=>{if(t.type==='Revenue'&&k<3){k++;const d=Math.max(1,TD-6-k);t.status='Overdue';t.paidOn='';t.due=`${MP}-${pad(d,2)}`;t.date=`${MP}-${pad(Math.max(1,d-7),2)}`}})}
// ...and a few bills that are due today or overdue, so settling payments can be tried on any day.
{let k=0;transactions.forEach(t=>{if(t.type!=='Revenue'&&k<3){k++;const d=Math.max(1,TD-k+1);t.status=d<TD?'Overdue':'Pending';t.paidOn='';t.due=`${MP}-${pad(d,2)}`;t.date=`${MP}-${pad(Math.max(1,d-3),2)}`}})}
const notifications=[['Delay on Howrah–Dankuni corridor','Traffic congestion adding 18 min to 6 trips.','Warning'],['LGS-109 service due','Mileage passed the service interval.','Critical'],['New shipment batch received','34 shipments created from Eastern Foods.','Info'],['Driver D-031 on leave','Reassign 2 open deliveries.','Warning'],['Monthly report ready','November report is ready to export.','Info'],['Payment overdue','TX-9003 is overdue by 6 days.','Critical']].map(([title,body,level],i)=>({id:`N-${pad(i+1)}`,title,body,level,time:`${i+1}h ago`,status:i<3?'Unread':'Read'}))
let mc=0;const m=(from,text,time)=>({id:`m${++mc}`,from,text,time})
const conversations=[
 {id:'T-001',name:names[0],type:'Driver',ref:'D-001',unread:2,messages:[m('them','Reached Howrah depot.','09:10'),m('them','Waiting for unloading slot.','09:14')]},
 {id:'T-002',name:names[1],type:'Driver',ref:'D-002',unread:0,messages:[m('me','Take the bypass today.','08:30'),m('them','Okay, on my way.','08:32')]},
 {id:'T-003',name:customers[2].name,type:'Customer',ref:customers[2].id,unread:1,messages:[m('them','Can SH-2403 be delivered before 5 PM?','10:02')]},
 {id:'T-004',name:customers[5].name,type:'Customer',ref:customers[5].id,unread:0,messages:[m('them','Thanks for the quick delivery.','Yesterday')]},
 {id:'T-005',name:'Indian Oil',type:'Company',ref:null,unread:0,messages:[m('them','Your November fuel card statement is ready.','Yesterday')]},
 {id:'T-006',name:'System alerts',type:'System',ref:null,unread:1,messages:[m('them','LGS-109 health score dropped below 70.','07:45')]}]
export const seeds={drivers,customers,shipments,deliveries,transactions,notifications,conversations,vehicles}
