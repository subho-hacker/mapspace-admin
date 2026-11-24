export const AREAS={Dankuni:[110,60],Baranagar:[220,70],'New Town':[330,110],Kolkata:[230,160],Howrah:[160,170],Maheshtala:[150,260]}
export const dist=(a,b)=>Math.hypot(AREAS[a][0]-AREAS[b][0],AREAS[a][1]-AREAS[b][1])*0.12
