const KEY='ms:theme',mq=()=>window.matchMedia('(prefers-color-scheme: light)')
export const getPref=()=>localStorage.getItem(KEY)||'dark'
export function applyTheme(pref=getPref()){const r=pref==='system'?(mq().matches?'light':'dark'):pref;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}
export const setPref=p=>{localStorage.setItem(KEY,p);applyTheme(p)}
export function initTheme(){applyTheme();document.documentElement.dataset.style=getStyle();mq().addEventListener('change',()=>getPref()==='system'&&applyTheme())}
export const getStyle=()=>localStorage.getItem('ms:style')||'skeuo'
export const setStyle=s=>{localStorage.setItem('ms:style',s);document.documentElement.dataset.style=s}
