(() => {
  const toggle=document.querySelector('.menu-toggle'), nav=document.querySelector('.nav-links');
  const closeMenu=() => { nav?.classList.remove('open'); toggle?.setAttribute('aria-expanded','false'); };
  toggle?.addEventListener('click',()=>toggle.setAttribute('aria-expanded',String(nav.classList.toggle('open'))));
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && nav?.classList.contains('open')){closeMenu();toggle.focus();}});
  const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();
  const date=document.getElementById('weddingDate');
  if(date) date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const selected=new URLSearchParams(location.search).get('package'), selector=document.getElementById('package');
  if(selected && selector && [...selector.options].some(o=>o.value===selected)) selector.value=selected;
  const form=document.getElementById('enquiryForm'); if(!form) return;
  const message=document.getElementById('formMessage'), submit=form.querySelector('[type=submit]');
  const show=(text,error=false)=>{message.textContent=text;message.className='form-message visible'+(error?' error':'');};
  // Check availability before inviting the visitor to send personal details.
  submit.disabled=true;
  fetch('/api/status',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)})
    .then(response=>response.ok?response.json():Promise.reject())
    .then(status=>{
      if(status.configured!==true) throw new Error('Not connected');
      submit.disabled=false;
    })
    .catch(()=>{
      submit.textContent='Online enquiries unavailable';
      show('Online enquiries are not available yet. You can fill in your plans and save a copy below; this will not send them to Cara.',true);
    });
  document.getElementById('saveEnquiry')?.addEventListener('click',()=>{
    const data=new FormData(form);
    const labels={name:'Name',email:'Email',phone:'Telephone',weddingDate:'Wedding date',venue:'Venue',location:'Town/postcode',partySize:'Number of people',time:'Preferred time',package:'Session',style:'Preferred feel',notes:'Message'};
    const text='Bridal Flow — enquiry copy (not sent)\n\n'+Object.entries(labels).map(([key,label])=>`${label}: ${data.get(key)||'—'}`).join('\n\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Bridal_Flow_Enquiry.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    show('Your enquiry copy has been prepared for download. This does not send it to Cara.');
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(submit.disabled || !form.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form));
    submit.disabled=true;submit.textContent='Sending your enquiry…';form.setAttribute('aria-busy','true');message.className='form-message';
    try {
      const response=await fetch('/api/enquire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});
      const result=await response.json().catch(()=>null);
      if(!response.ok || result?.ok!==true) throw new Error(result?.error||'Your enquiry could not be sent. Please save a copy and try again later.');
      show('Thank you — your enquiry has been submitted. Cara will reply personally. Your date is not reserved until your booking is agreed.');
      form.reset();
    } catch(error) {
      show(error.name==='TimeoutError'?'The connection timed out. Delivery is uncertain; please save a copy before trying again.':error.message||'We couldn’t send your enquiry. Please save a copy and try again later.',true);
    } finally {submit.disabled=false;submit.textContent='Send wedding enquiry';form.removeAttribute('aria-busy');}
  });
})();
