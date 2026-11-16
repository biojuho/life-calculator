export function $(sel, el=document){return el.querySelector(sel)}
export function num(el){
  if(!el) return 0;
  const v=String(el.value??'').replace(/,/g,'').trim();
  return Number(v)||0;
}
export function won(n){
  const v=Math.round(Number(n)||0);
  return v.toLocaleString('ko-KR')+'원';
}
export function bindWonInputs(root=document){
  root.querySelectorAll('input[data-won]').forEach(inp=>{
    inp.addEventListener('blur',()=>{
      const n=Number(String(inp.value).replace(/,/g,''));
      if(!Number.isFinite(n) || inp.value==='') return;
      inp.value=Math.round(n).toLocaleString('ko-KR');
    });
  });
}
export function tableRows(headers, rows){
  const thead='<tr>'+headers.map((h,i)=>`<th class="${i?'r':''}">${h}</th>`).join('')+'</tr>';
  const body=rows.map(r=>'<tr>'+r.map((c,i)=>`<td class="${i?'r':''}">${c}</td>`).join('')+'</tr>').join('');
  return `<table><thead>${thead}</thead><tbody>${body}</tbody></table>`;
}
