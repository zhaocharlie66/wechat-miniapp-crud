(async function(){
  const API = window.API_BASE || '/api';
  const el = {
    name: document.getElementById('name'),
    desc: document.getElementById('desc'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    list: document.getElementById('list'),
    editingTip: document.getElementById('editingTip'),
    editingId: document.getElementById('editingId'),
  };

  let editingId = null;

  function fmt(t){ try{ return new Date(t).toLocaleString(); } catch(e){ return t; } }
  function alertErr(e){ console.error(e); alert(e?.message || e?.error || '操作失败'); }

  async function request(path, options={}){
    const res = await fetch(API + path, { 
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) {
      const msg = await res.text().catch(()=> '');
      throw new Error(msg || ('HTTP ' + res.status));
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function load(){
    el.list.innerHTML = '加载中...';
    try{
      const items = await request('/items');
      if (!items.length){ el.list.innerHTML = '<div class="tip">暂无数据</div>'; return; }
      el.list.innerHTML = '';
      for (const it of items){
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <div>
            <div class="item-title">${escapeHtml(it.name)}</div>
            <div class="item-meta">${fmt(it.created_at)}</div>
            <div>${escapeHtml(it.description || '')}</div>
          </div>
          <div class="item-actions">
            <button data-id="${it.id}" class="edit">编辑</button>
            <button data-id="${it.id}" class="secondary delete">删除</button>
          </div>`;
        el.list.appendChild(div);
      }
    }catch(e){
      el.list.innerHTML = `<div class="error">加载失败：${escapeHtml(e.message)}</div>`;
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  async function save(){
    const name = el.name.value.trim();
    const description = el.desc.value.trim();
    if (!name) return alert('请输入名称');
    try{
      if (editingId){
        await request(`/items/${editingId}`, { method:'PUT', body: JSON.stringify({ name, description })});
      } else {
        await request('/items', { method:'POST', body: JSON.stringify({ name, description })});
      }
      resetForm();
      await load();
      alert('已保存');
    }catch(e){ alertErr(e); }
  }

  async function remove(id){
    if (!confirm('确认删除？')) return;
    try{
      await request(`/items/${id}`, { method:'DELETE' });
      if (editingId === id) resetForm();
      await load();
      alert('已删除');
    }catch(e){ alertErr(e); }
  }

  function resetForm(){
    editingId = null;
    el.name.value = '';
    el.desc.value = '';
    el.editingTip.hidden = true;
  }

  el.list.addEventListener('click', (ev)=>{
    const t = ev.target;
    if (t.classList.contains('edit')){
      editingId = Number(t.dataset.id);
      el.editingId.textContent = String(editingId);
      el.editingTip.hidden = false;
      // 读取一条
      request(`/items/${editingId}`).then(item=>{
        el.name.value = item.name || '';
        el.desc.value = item.description || '';
      }).catch(alertErr);
    } else if (t.classList.contains('delete')){
      remove(Number(t.dataset.id));
    }
  });

  el.saveBtn.addEventListener('click', save);
  el.resetBtn.addEventListener('click', resetForm);
  el.reloadBtn.addEventListener('click', load);

  // 初次加载
  await load();
})();
