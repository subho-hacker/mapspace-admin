// Largest-remainder apportionment: whole-number parts that always add up to the total.
export function apportion(total,weights){const s=weights.reduce((a,b)=>a+b,0)||1,x=weights.map(w=>w/s*total),out=x.map(Math.floor);let left=Math.round(total)-out.reduce((a,b)=>a+b,0)
 x.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(left>0){out[i]++;left--}});return out}
