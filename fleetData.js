const areas=['Kolkata','Howrah','Dankuni','Baranagar','New Town','Maheshtala']
const types=['Mini Truck','Cargo Van','Box Truck','Tempo']
const drivers=['Arjun Das','Rahul Sen','Imran Sheikh','Sourav Pal','Debraj Roy','Tapan Ghosh','Amit Saha','Biplab Dey','Kunal Basu','Rohit Mitra','Sanjay Ghosh','Pritam Jana']
const pool=[...Array(92).fill('Active'),...Array(16).fill('Idle'),...Array(12).fill('Maintenance')]
export const vehicles=Array.from({length:120},(_,i)=>({
 id:`LGS-${101+i}`,type:types[i%4],reg:`WB 0${(i%9)+1}${String.fromCharCode(65+i%26)} ${1000+(i*37)%9000}`,
 driver:drivers[i%drivers.length],location:areas[i%6],route:`${areas[i%6]} → ${areas[(i+2)%6]}`,
 fuel:20+(i*37)%80,status:pool[(i*7)%120],service:`${1+i%28} Oct 2026`,mileage:18000+(i*911)%42000,health:62+(i*13)%38}))
