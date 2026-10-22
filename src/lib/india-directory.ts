export type DirectoryPin = { pincode:string; city:string; state:string; district:string; areas:string[] };
let directory: Promise<DirectoryPin[]> | undefined;
export function indiaPins() {
 return directory ??= import('@/data/india-pins.json').then(m => (m.default as [string,string,string,string,string[]][]).map(([pincode,city,state,district,areas])=>({pincode,city,state,district,areas})));
}
export async function directorySearch(q:string) {
 const rows=await indiaPins(), query=q.trim().toLowerCase();
 return rows.filter(r=>/^\d+$/.test(query)?r.pincode.startsWith(query):r.city.toLowerCase().includes(query)||r.areas.some(a=>a.toLowerCase().includes(query))).slice(0,20);
}