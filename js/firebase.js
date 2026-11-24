// Conexión con Firebase y todas las operaciones con la base de datos.
import { firebaseConfig } from "./config.js";
import { shuffled } from "./ui.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
let F, db;
export let uid = null;

export const isConfigured = () => !!(firebaseConfig.apiKey && firebaseConfig.projectId);

export async function initFirebase() {
  const [{ initializeApp }, A, S] = await Promise.all([
    import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")
  ]);
  F = S;
  const fbApp = initializeApp(firebaseConfig);
  db = S.getFirestore(fbApp);
  const auth = A.getAuth(fbApp);
  await A.signInAnonymously(auth);
  uid = auth.currentUser.uid;
}

// Un único círculo aleatorio: nadie se toca a sí mismo y nadie recibe dos regalos.
function makePairs(n) {
  const a = shuffled([...Array(n).keys()]);
  return a.map((g, i) => [g, a[(i + 1) % a.length]]);
}

export async function createDraw(people) {
  const ref = F.doc(F.collection(db, "draws"));
  const batch = F.writeBatch(db);
  batch.set(ref, { people, keys: people.map((_, i) => String(i)), ownerUid: uid, createdAt: F.serverTimestamp() });
  for (const [g, r] of makePairs(people.length)) {
    batch.set(F.doc(db, "draws", ref.id, "secrets", String(g)), { receiver: people[r] });
  }
  await batch.commit();
  return ref.id;
}

// Borra el sorteo con todos sus nombres cogidos y resultados, en una sola operación.
export async function deleteDraw(id, count) {
  const batch = F.writeBatch(db);
  for (let i = 0; i < count; i++) {
    batch.delete(F.doc(db, "draws", id, "secrets", String(i)));
    batch.delete(F.doc(db, "draws", id, "claims", String(i)));
  }
  batch.delete(F.doc(db, "draws", id));
  await batch.commit();
}

export async function listMyDraws() {
  const qs = await F.getDocs(F.query(F.collection(db, "draws"), F.where("ownerUid", "==", uid)));
  return qs.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getDraw(id) {
  const s = await F.getDoc(F.doc(db, "draws", id));
  return s.exists() ? s.data() : null;
}

export function watchClaims(id, cb) {
  return F.onSnapshot(F.collection(db, "draws", id, "claims"), qs => {
    const claims = {};
    qs.forEach(doc => (claims[doc.id] = doc.data()));
    cb(claims);
  }, err => console.error(err));
}

export async function claim(drawId, key) {
  await F.runTransaction(db, async tx => {
    const c = F.doc(db, "draws", drawId, "claims", key);
    const snap = await tx.get(c);
    if (snap.exists()) throw { code: "taken" };
    tx.set(c, { uid, at: F.serverTimestamp() });
  });
}

export async function freeClaim(drawId, key) {
  await F.deleteDoc(F.doc(db, "draws", drawId, "claims", key));
}

export async function readSecret(drawId, key) {
  const s = await F.getDoc(F.doc(db, "draws", drawId, "secrets", key));
  return s.exists() ? s.data().receiver : null;
}
