import {monthly,daily} from './analyticsData.js'
import {CM,TD} from '../utils/now.js'
import {apportion} from '../utils/split.js'
// Product categories shown in shipments, tracking and the dashboard.
export const CATS=['FMCG','Pharma','Electronics','Steel & Hardware','Textiles','Agro & Food']
export const PRODUCTS={FMCG:['Packaged biscuits','Edible oil','Soap and detergent'],Pharma:['Vaccines (cold chain)','Generic tablets','Surgical supplies'],Electronics:['LED televisions','Mobile phones','Inverters'],'Steel & Hardware':['TMT bars','Cement bags','Pipes and fittings'],Textiles:['Cotton sarees','Jute fabric','Garments'],'Agro & Food':['Basmati rice','Potatoes','Tea chests']}
// West Bengal places [lat,lng]
export const LOC={Kolkata:[22.5726,88.3639],Howrah:[22.5958,88.2636],Sealdah:[22.5675,88.3708],Durgapur:[23.5204,87.3119],Asansol:[23.6739,86.9524],Siliguri:[26.7271,88.3953],Kharagpur:[22.346,87.232],Haldia:[22.0667,88.0698],Bardhaman:[23.2324,87.8615],Malda:[25.0108,88.1411],Dankuni:[22.6746,88.2988],Baranagar:[22.641,88.3654],'New Town':[22.58,88.48],Maheshtala:[22.506,88.248]}
const W={Kolkata:.30,Howrah:.14,Durgapur:.12,Asansol:.10,Siliguri:.12,Kharagpur:.07,Haldia:.06,Bardhaman:.05,Malda:.04}
const r=monthly[CM].delivered/monthly[CM].shipments,today=daily[CM][TD-1].shipments
// Delivered parcels per city: today and month-to-date (weights sum to 1, so both reconcile with Analytics).
export const CITIES=Object.entries(W).map(([name,w])=>({name,ll:LOC[name],d:Math.round(today*r*w),m:Math.round(monthly[CM].delivered*w)}))
// Simulated fleet: p0 = start position on the leg (0..1), kmh = cruising speed.
export const FLEET=[
['LGS-104','Arjun Das','Sealdah','Howrah','FMCG',1,'Packaged biscuits','120 cartons',38,.2,'On Time',68],
['LGS-105','Rahul Sen','Kolkata','Durgapur','Steel & Hardware',2,'TMT bars','18 t',46,.35,'On Time',54],
['LGS-106','Imran Sheikh','Howrah','Siliguri','Pharma',0,'Vaccines (cold chain)','320 boxes',52,.1,'On Time',81],
['LGS-107','Sourav Pal','Haldia','Kolkata','Agro & Food',1,'Basmati rice','12 t',41,.6,'On Time',47],
['LGS-108','Debraj Roy','Asansol','Bardhaman','Electronics',0,'Mobile phones','900 units',44,.45,'On Time',72],
['LGS-109','Tapan Ghosh','Kolkata','Malda','Textiles',2,'Cotton sarees','240 bales',29,.25,'Delayed',38],
['LGS-110','Amit Saha','Kharagpur','Howrah','FMCG',1,'Edible oil','1,400 L',40,.7,'On Time',63],
['LGS-111','Biplab Dey','Durgapur','Durgapur','Steel & Hardware',2,'Cement bags','600 bags',0,0,'Idle',90]
].map(([id,driver,from,to,category,_,product,qty,kmh,p0,status,fuel])=>({id,driver,from,to,category,product,qty,kmh,p0,status,fuel}))
export const PLACES=Object.keys(LOC)
const WT=[.27,.19,.18,.14,.12,.10]
// Delivered parcels per category for month m. Always adds up to that month's delivered total in Analytics.
export const catSplit=m=>apportion(monthly[m].delivered,WT.map((w,i)=>w*(1+.16*Math.sin(m*1.7+i*2.1))))
