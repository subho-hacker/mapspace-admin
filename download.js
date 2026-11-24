export const download=(name,text,type='text/plain')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
export const toCsv=rows=>{const h=Object.keys(rows[0]||{});return '\ufeff'+[h.join(','),...rows.map(r=>h.map(k=>`"${String(r[k]).replace(/"/g,'""')}"`).join(','))].join('\n')}
