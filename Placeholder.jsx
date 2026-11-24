import {GlassCard} from '../components/ui.jsx'
export default function Placeholder({title,note}){return <div className="page"><GlassCard whileHover={{}}><h3>{title}</h3><p className="muted">{note||'This section is next in the build. The layout, data layer and components it needs are already in place.'}</p></GlassCard></div>}
