export const REPO = "NVandenBossche/gw2pc-reimagined";
export const REPO_URL = `https://github.com/${REPO}`;
/** Snapshots and the legendary list live in the repo; read them from there so new data never needs a redeploy. */
export const DATA_BASE = import.meta.env.DEV ? "/data" : `https://raw.githubusercontent.com/${REPO}/main/data`;
export const bltc = (id: number) => `https://www.gw2bltc.com/en/item/${id}`;
