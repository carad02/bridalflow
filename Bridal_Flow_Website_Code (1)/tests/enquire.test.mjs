import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../public/_worker.js';
const onRequest = ({request, env}) => worker.fetch(request, env);
const env={RESEND_API_KEY:'test-key',CONTACT_EMAIL:'cara@example.test',EMAIL_FROM:'Bridal Flow <sender@example.test>'};
const base={name:'Test Visitor',email:'visitor@example.test',weddingDate:'2099-07-15',venue:'Test venue',location:'Bristol',partySize:'12',time:'Morning (8am–10am)',package:'The Connection',style:'Strength and mobility',consent:'on',website:'',notes:'Test only'};
function request(data=base,extra={}) {return new Request('https://bridal-flow.example/api/enquire',{method:'POST',headers:{Origin:'https://bridal-flow.example','Content-Type':'application/json',...extra},body:JSON.stringify(data)});}
test('accepted enquiries reach only the business inbox and carry visitor Reply-To',async t=>{
  let sent;
  t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent=JSON.parse(options.body);return Response.json({id:'test-email'});});
  const result=await onRequest({request:request(),env});assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true});
  assert.deepEqual(sent.to,['cara@example.test']);assert.equal(sent.reply_to,base.email);assert.match(sent.text,/The Connection/);assert.match(sent.text,/Strength and mobility/);
});
test('provider rejection never returns success',async t=>{t.mock.method(globalThis,'fetch',async()=>Response.json({message:'Rejected'},{status:422}));const r=await onRequest({request:request(),env});assert.equal(r.status,502);assert.ok((await r.json()).error);});
test('provider malformed success never returns success',async t=>{t.mock.method(globalThis,'fetch',async()=>Response.json({}));assert.equal((await onRequest({request:request(),env})).status,502);});
test('missing secrets reports disconnected form',async()=>assert.equal((await onRequest({request:request(),env:{}})).status,503));
test('invalid inputs never trigger email',async t=>{
  const mock=t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not send');});
  for(const changes of [{weddingDate:'2099-02-31'},{weddingDate:'2020-01-01'},{partySize:'13'},{partySize:'0'},{partySize:'1.5'},{email:'bad'},{consent:''},{package:'Old package'},{notes:'x'.repeat(1501)},{name:'Test\r\nBcc: bad@example.test'},{website:'bot.example'}]) assert.equal((await onRequest({request:request({...base,...changes}),env})).status,400,JSON.stringify(changes).slice(0,100));
  assert.equal(mock.mock.callCount(),0);
});
test('cross-origin, malformed and oversized requests are rejected',async()=>{
  assert.equal((await onRequest({request:request(base,{Origin:'https://other.example'}),env})).status,403);
  assert.equal((await onRequest({request:request({...base,notes:'x'.repeat(20000)}),env})).status,413);
  const r=new Request('https://bridal-flow.example/api/enquire',{method:'POST',headers:{Origin:'https://bridal-flow.example','Content-Type':'application/json'},body:'{'});
  assert.equal((await onRequest({request:r,env})).status,400);
  assert.equal((await onRequest({request:new Request('https://bridal-flow.example/api/enquire'),env})).status,405);
});

test('static pages and assets pass through unchanged', async () => {
  const request=new Request('https://bridal-flow.example/styles.css');
  const result=await worker.fetch(request, {ASSETS:{fetch: async received => {
    assert.equal(received, request); return new Response('body{color:green}', {headers:{'Content-Type':'text/css'}});
  }}});
  assert.equal(await result.text(), 'body{color:green}');
});
test('status reports configuration without exposing credentials', async () => {
  const request=new Request('https://bridal-flow.example/api/status');
  assert.deepEqual(await (await worker.fetch(request, {})).json(), {configured:false});
  assert.deepEqual(await (await worker.fetch(request, env)).json(), {configured:true});
});
test('unknown API routes cannot accidentally return HTML', async () => {
  const result=await worker.fetch(new Request('https://bridal-flow.example/api/missing'), env);
  assert.equal(result.status,404); assert.match(result.headers.get('Content-Type'),/json/);
});
