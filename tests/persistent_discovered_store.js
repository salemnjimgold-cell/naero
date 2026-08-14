/* global __dirname */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createNearbyService } = require('../backend/src/services/nearbyService');
const { createDiscoveredPlacesProvider, persistenceRecord, validCandidate } = require('../backend/src/gateway/providers/discoveredPlaces');
const { readEnv } = require('../backend/src/config/env');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const params = { latitude: 48.2, longitude: 16.3, radius: 1000, limit: 1, category: 'hospital', countryCode: 'AT', language: 'en' };
const env = { gateway: { providerTimeoutMs: 50, nearbyCache: { ttlMs: 0, staleMs: 0 }, discoveredStoreEnabled: false, discoveredPersistenceEnabled: false }, providers: { geoapifyApiKey: '', googlePlacesApiKey: '', overpassApiUrl: '' }, supabase: { url: '', anonKey: '', serviceRoleKey: '' } };
const place = (provider = 'geoapify', id = 'g1') => ({ provider, providerId: id, name: 'Public Hospital', latitude: 48.2, longitude: 16.3, countryCode: 'AT', sourceAttribution: 'Provider attribution', verified: false });
const provider = (name, role, searchNearby, extra = {}) => ({ name, sourceRole: role, configured: true, searchNearby, ...extra });

test('empty persistent store calls live discovery', async () => {
  let live = 0; const providers = [provider('discovered','DISCOVERED',async()=>[]),provider('geoapify','LIVE',async()=>{live+=1;return[place()];})];
  assert.equal((await createNearbyService(env,{providers}).searchNearby(params)).items.length,1); assert.equal(live,1);
});
test('fresh persistent sufficiency skips live discovery', async () => {
  let live=0; const providers=[provider('discovered','DISCOVERED',async()=>[place()]),provider('geoapify','LIVE',async()=>{live+=1;return[];})];
  const result=await createNearbyService(env,{providers}).searchNearby(params); assert.equal(live,0); assert.equal(result.items[0].verified,false);
});
test('process cache clear still permits persistent provider coverage', async () => {
  let persistent=0,live=0; const providers=[provider('discovered','DISCOVERED',async()=>{persistent+=1;return[place()];}),provider('geoapify','LIVE',async()=>{live+=1;return[];})];
  const service=createNearbyService(env,{providers}); service.cache.clear(); await service.searchNearby(params); assert.equal(persistent,1); assert.equal(live,0);
});
test('insufficient persistent coverage calls live for deficit', async () => {
  let live=0; const providers=[provider('discovered','DISCOVERED',async()=>[place('geoapify','g1')]),provider('geoapify','LIVE',async()=>{live+=1;return[{...place('geoapify','g2'),name:'Second Hospital',latitude:48.204}];})];
  const result=await createNearbyService(env,{providers}).searchNearby({...params,limit:2}); assert.equal(result.items.length,2); assert.equal(live,1);
});
test('persistence failure cannot fail a successful response', async () => {
  const discovered=provider('discovered','DISCOVERED',async()=>[],{persistenceEnabled:true,persist:async()=>{throw new Error('private detail');}});
  const result=await createNearbyService(env,{providers:[discovered,provider('geoapify','LIVE',async()=>[place()])]}).searchNearby(params); assert.equal(result.items.length,1);
});
test('stale persistent data truthfully rescues total live failure', async () => {
  const discovered=provider('discovered','DISCOVERED',async()=>[],{searchStale:async()=>[place()]});
  const live=provider('geoapify','LIVE',async()=>{throw Object.assign(new Error(),{code:'PROVIDER_UNAVAILABLE'});});
  const result=await createNearbyService(env,{providers:[discovered,live]}).searchNearby(params); assert.equal(result.stale,true); assert.equal(result.partial,true); assert.equal(result.coverageStatus,'stale');
});
test('Geoapify candidate validates and never promotes verification', () => {
  const record=persistenceRecord(place(),params,0); assert.equal(record.provider,'geoapify'); assert.equal(Object.hasOwn(record,'verified'),false); assert.equal(record.expiresAt,new Date(7*86400000).toISOString());
});
test('invalid identity, country and unsupported source fail closed', () => {
  assert.equal(validCandidate({...place(),providerId:null},params),false); assert.equal(validCandidate({...place(),countryCode:'HU'},params),false); assert.equal(validCandidate(place('google'),params),false);
});
test('provider reads fresh rows and preserves attribution', async () => {
  const fetchImpl=async(_url,request)=>({ok:true,json:async()=>[{provider:'geoapify',provider_id:'g1',name:'Hospital',latitude:48.2,longitude:16.3,country_code:'AT',source_attribution:'Attribution'}]});
  const p=createDiscoveredPlacesProvider({...env,gateway:{...env.gateway,discoveredStoreEnabled:true},supabase:{url:'https://project.invalid',anonKey:'anon',serviceRoleKey:'role'}},{fetchImpl});
  const [item]=await p.searchNearby(params); assert.equal(item.sourceRole,'DISCOVERED'); assert.equal(item.sourceAttribution,'Attribution'); assert.equal(item.verified,false);
});
test('persistence is disabled by default even with service credentials', () => {
  const p=createDiscoveredPlacesProvider({...env,supabase:{url:'https://project.invalid',anonKey:'anon',serviceRoleKey:'role'}}); assert.equal(p.persistenceEnabled,false);
  assert.equal(readEnv({DISCOVERED_PLACE_STORE_ENABLED:'true',DISCOVERED_PLACE_PERSISTENCE_ENABLED:'true'}).gateway.discoveredPersistenceEnabled,true);
});
test('enabled persistence upserts identity and coarse coverage without search origin', async () => {
  const requests=[]; const fetchImpl=async(url,request)=>{requests.push({url,request});return{ok:true};};
  const p=createDiscoveredPlacesProvider({...env,gateway:{...env.gateway,discoveredStoreEnabled:true,discoveredPersistenceEnabled:true},supabase:{url:'https://project.invalid',anonKey:'anon',serviceRoleKey:'role'}},{fetchImpl});
  const result=await p.persist([place()],params); assert.equal(result.persisted,1); assert.equal(requests.length,2);
  const coverage=JSON.parse(requests[1].request.body)[0]; assert.match(coverage.cell_id,/^\d+:\d+:\d+$/);
  assert.equal(Object.hasOwn(coverage,'latitude'),false); assert.equal(Object.hasOwn(coverage,'longitude'),false);
});
test('persistence request contains no user/request/session identity', () => {
  const serialized=JSON.stringify(persistenceRecord(place(),params,0)); assert.doesNotMatch(serialized,/user|device|session|requestId|searchOrigin/i);
});
test('migration establishes spatial indexes, uniqueness, RLS and grants', () => {
  const sql=fs.readFileSync(path.join(__dirname,'../backend/db/migrations/006_persistent_discovered_places.sql'),'utf8');
  for(const token of ['using gist(location)','unique(provider,provider_record_id)','enable row level security','force row level security','to service_role','revoke all','nearby_discovered_places','INVALID_DISCOVERY_RECORD']) assert.ok(sql.includes(token),token);
  assert.doesNotMatch(sql,/user_id|device_id|session_id|request_id|search_origin/i);
});
test('migration and rollback are scoped and migration 005 remains immutable', () => {
  const rollback=fs.readFileSync(path.join(__dirname,'../backend/db/rollbacks/006_persistent_discovered_places.rollback.sql'),'utf8');
  assert.match(rollback,/discovered_places/); assert.doesNotMatch(rollback,/verified_services|service_categories/);
  const crypto=require('crypto'); const migration005=fs.readFileSync(path.join(__dirname,'../backend/db/migrations/005_postgis_verified_services.sql'));
  assert.equal(crypto.createHash('sha256').update(migration005).digest('hex'),'518b8ca0fcc70308b308c0e99894aa75b473951ffc952a43385620d8f43f5ebc');
});
test('SQL upsert is database-constrained and service-role only', () => {
  const sql=fs.readFileSync(path.join(__dirname,'../backend/db/migrations/006_persistent_discovered_places.sql'),'utf8');
  assert.match(sql,/for update/); assert.match(sql,/pg_advisory_xact_lock/); assert.match(sql,/auth\.role\(\)<>'service_role'/); assert.match(sql,/grant execute on function public\.upsert_discovered_place\(jsonb\) to service_role/);
});
test('default resolver order includes discovered between verified and live', () => {
  const service=createNearbyService({...env,gateway:{...env.gateway,discoveredStoreEnabled:true},supabase:{url:'u',anonKey:'a',serviceRoleKey:'r'}});
  assert.deepEqual(service.providers.map((p)=>p.name),['naero','discovered','geoapify','google','osm']);
});

(async()=>{let passed=0;for(const {name,fn} of tests){try{await fn();passed+=1;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}`);throw error;}}console.log(`Persistent discovered store tests: ${passed}/${tests.length} passed`);})().catch(()=>{process.exitCode=1;});
