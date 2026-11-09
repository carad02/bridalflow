// Cloudflare Pages advanced-mode handler. Credentials stay in Cloudflare secrets.
const packages = new Set(['The Pause', 'The Connection', 'The Full Flow', 'Not sure yet']);
const times = new Set(['Early morning (before 8am)', 'Morning (8am–10am)', 'Late morning (after 10am)', 'Flexible / not sure']);
const styles = new Set(['Let’s decide together', 'Slow and relaxing', 'Strength and mobility', 'A mixture of both']);
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply = (status, body, extra={}) => new Response(JSON.stringify(body), {status, headers:{...headers,...extra}});
const field = (v, max) => typeof v === 'string' && v.length <= max ? v.trim() : '';

async function bodyJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty');
  let length = 0;
  const chunks = [];
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 16384) { await reader.cancel(); throw new Error('large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset=0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function onRequest({request, env}) {
  if (request.method !== 'POST') return reply(405, {error:'Please use the enquiry form to send a message.'}, {Allow:'POST'});
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply(403, {error:'Please reload the website and try again.'});
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, {error:'Unsupported form format.'});
  let data;
  try { data=await bodyJSON(request); } catch (e) { return reply(e.message==='large'?413:400, {error:'Please check your enquiry and try again.'}); }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.website) return reply(400, {error:'Please check your enquiry and try again.'});
  const name=field(data.name,90), email=field(data.email,160), phone=field(data.phone,45);
  const date=field(data.weddingDate,10), venue=field(data.venue,160), location=field(data.location,130);
  const party=Number(data.partySize), time=field(data.time,90), pkg=field(data.package,80);
  const style=field(data.style,80) || 'Let’s decide together', notes=field(data.notes,1500);
  const parsed=new Date(date+'T12:00:00Z');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===date && date>=today;
  if (!name || /[\r\n]/.test(name+email) || !emailPattern.test(email) || !validDate || !venue || !location || !Number.isInteger(party) || party<1 || party>12 || !times.has(time) || !packages.has(pkg) || !styles.has(style) || data.consent!=='on' || (data.notes && !notes) || (data.phone && !phone)) {
    return reply(400, {error:'Please check the required fields, date and group size (1–12), then try again.'});
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL || !env.EMAIL_FROM) return reply(503, {error:'Online enquiries are not connected yet. Your details have not been sent. Please save a copy and try again later.'});
  const rows=[['Name',name],['Email',email],['Phone',phone||'Not supplied'],['Wedding date',date],['Venue',venue],['Town/postcode',location],['Group size',party],['Time',time],['Session',pkg],['Preferred feel',style],['Message',notes||'No additional message']];
  const text='New Bridal Flow enquiry\n\n'+rows.map(([key,value])=>`${key}: ${value}`).join('\n\n')+'\n\nThis is an enquiry, not a confirmed booking. Reply to contact the sender.';
  try {
    const response=await fetch('https://api.resend.com/emails', {
      method:'POST', headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:env.EMAIL_FROM,to:[env.CONTACT_EMAIL],reply_to:email,subject:`Bridal Flow enquiry · ${date} · ${name}`,text}),
      signal:AbortSignal.timeout(10000)
    });
    const result=await response.json().catch(()=>null);
    if (!response.ok || !result?.id) throw new Error('Email provider did not accept enquiry');
    return reply(200, {ok:true});
  } catch {
    return reply(502, {error:'Your enquiry could not be sent. Your details are still in the form. Please save a copy and try again later.'});
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/enquire') return onRequest({request, env});
    if (path === '/api/status' && request.method === 'GET') {
      return reply(200, {configured: Boolean(env.RESEND_API_KEY && env.CONTACT_EMAIL && env.EMAIL_FROM)});
    }
    if (path.startsWith('/api/')) return reply(404, {error: 'Endpoint not found.'});
    return env.ASSETS.fetch(request);
  }
};
