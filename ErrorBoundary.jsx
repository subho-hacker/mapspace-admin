import {Component} from 'react'
// Shows the real error instead of a blank page, with a one-click way to clear stale saved data.
export default class ErrorBoundary extends Component{
 state={err:null}
 static getDerivedStateFromError(err){return{err}}
 componentDidCatch(err,info){console.error('MapSpace crashed:',err,info?.componentStack)}
 render(){const e=this.state.err;if(!e)return this.props.children
  return <div style={{padding:24,maxWidth:760,margin:'8vh auto'}} className="glass" role="alert"><h2>Something went wrong</h2>
   <p className="muted">The dashboard hit an error. Reload first; if it returns, clear saved demo data (it may be from an older version).</p>
   <pre style={{whiteSpace:'pre-wrap',fontSize:12,background:'rgba(0,0,0,.3)',padding:12,borderRadius:12}}>{String(e?.stack||e).split('\n').slice(0,8).join('\n')}</pre>
   <div className="actions"><button className="btn ghost" onClick={()=>location.reload()}>Reload</button><button className="btn danger" onClick={()=>{localStorage.clear();location.reload()}}>Clear saved data and reload</button></div></div>}}
