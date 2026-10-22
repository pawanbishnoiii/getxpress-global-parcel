export type DirectoryPin = { pincode:string; city:string; state:string };
let directory: Promise<DirectoryPin[]> | undefined;
export function indiaPins() {
 return directory ??= import('@/data/india-pins.json').then(m => m.default.map(([pincode,city,state])=>({pincode:pincode ?? '',city:city ?? '',state:state ?? ''})));
}
export async function directorySearch(q:string) {
 const rows=await indiaPins(), query=q.trim().toLowerCase();
 return rows.filter(r=>/^\d+$/.test(query)?r.pincode.startsWith(query):r.city.toLowerCase().includes(query)).slice(0,20);
}