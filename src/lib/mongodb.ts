import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

if (!uri) {
  throw new Error(
    "Please define MONGODB_URI (or MONGO_URI) environment variable inside .env.local"
  );
}

// #region agent log
fetch('http://127.0.0.1:7333/ingest/e9655f25-0fc8-41a2-b050-d6813bf6aac6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'223e96'},body:JSON.stringify({sessionId:'223e96',runId:'pre-fix',hypothesisId:'H2',location:'src/lib/mongodb.ts:1',message:'mongodb client init',data:{hasMONGODB_URI:!!process.env.MONGODB_URI,hasMONGO_URI:!!process.env.MONGO_URI,nodeEnv:process.env.NODE_ENV ?? null},timestamp:Date.now()})}).catch(()=>{});
// #endregion

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the client is not recreated on every reload
  // @ts-expect-error - create global var for dev hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    // @ts-expect-error - assign promise to global so it persists across module reloads
    global._mongoClientPromise = client.connect();
  }
  // @ts-expect-error - read persisted client promise
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
