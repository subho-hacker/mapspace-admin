// Single source of "today". Everything month-related derives from this, so the UI follows the real date.
const p=n=>String(n).padStart(2,'0')
export const NOW=new Date(),Y=NOW.getFullYear(),CM=NOW.getMonth(),TD=NOW.getDate()
export const TODAY=`${Y}-${p(CM+1)}-${p(TD)}`
export const ymd=d=>`${Y}-${p(CM+1)}-${p(d)}`
export const ymdOf=d=>`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
export const hhmm=d=>d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
