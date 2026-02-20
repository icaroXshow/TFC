
(function(){
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
  const overlay = $("#authOverlay");
  const openBtn = $("#openLogin");
  const closeBtn = $("#closeAuth");

  function open() {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden","false");
    setTimeout(()=>$("#loginView input[name='user']").focus(), 50);
  }
  function close() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden","true");
  }
  openBtn && openBtn.addEventListener("click", (e)=>{ e.preventDefault(); open(); });
  closeBtn && closeBtn.addEventListener("click", close);
  overlay && overlay.addEventListener("click", (e)=>{ if(e.target===overlay) close(); });
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") close(); });

  // Tabs
  $$(".auth-tabs .tabBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const target = btn.dataset.target;
      $$(".auth-tabs .tabBtn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      $$(".auth-view").forEach(v=>v.classList.remove("active"));
      $("#"+target).classList.add("active");
    });
  });

  // Links within views
  $("#goRegister")?.addEventListener("click", ()=>{
    $$(".auth-tabs .tabBtn")[1].click();
  });
  $("#goRecover")?.addEventListener("click", ()=>{
    $$(".auth-tabs .tabBtn")[2].click();
  });
  $$(".auth-view [data-back]").forEach(btn=>btn.addEventListener("click", ()=>{
    const t = btn.getAttribute("data-back");
    $$(".auth-tabs .tabBtn").forEach(b=>b.classList.remove("active"));
    $(`.auth-tabs .tabBtn[data-target="${t}"]`).classList.add("active");
    $$(".auth-view").forEach(v=>v.classList.remove("active"));
    $("#"+t).classList.add("active");
  }));

  // Demo submit handlers (no backend; just feedback)
  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.position="fixed"; t.style.bottom="24px"; t.style.right="24px";
    t.style.background="rgba(10,163,154,.95)"; t.style.color="#fff";
    t.style.padding="10px 14px"; t.style.borderRadius="12px"; t.style.boxShadow="0 10px 24px rgba(0,0,0,.3)";
    document.body.appendChild(t); setTimeout(()=>t.remove(), 2200);
  }
  $("#loginForm")?.addEventListener("submit", (e)=>{
    e.preventDefault(); toast("Inicio de sesión simulado ✅"); close();
  });
  $("#registerForm")?.addEventListener("submit", (e)=>{
    e.preventDefault(); toast("Registro simulado ✅"); 
    $$(".auth-tabs .tabBtn")[0].click(); // volver a login
  });
  $("#recoverForm")?.addEventListener("submit", (e)=>{
    e.preventDefault(); toast("Correo de recuperación enviado ✉️");
    $$(".auth-tabs .tabBtn")[0].click();
  });
})();
