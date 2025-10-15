// ===== Utilidades básicas =====
const $tamanho = document.getElementById('tamanho');
const $tipo = document.getElementById('tipo');
const $preview = document.getElementById('preview');
const $btnRodar = document.getElementById('btnRodar');
const $btnPdf = document.getElementById('btnPdf');
const $badgeInfo = document.getElementById('badgeInfo');

function gerarVetor(n, tipo='aleatorio'){
  const v = Array.from({length:n}, ()=> Math.floor(Math.random()*n));
  if (tipo === 'ordenado') return v.sort((a,b)=>a-b);
  if (tipo === 'inverso') return v.sort((a,b)=>b-a);
  if (tipo === 'quase'){
    const s = v.sort((a,b)=>a-b);
    const k = Math.max(1, Math.floor(n*0.05)); // 5% bagunçado
    for (let i=0;i<k;i++){
      const a = Math.floor(Math.random()*n), b = Math.floor(Math.random()*n);
      [s[a], s[b]] = [s[b], s[a]];
    }
    return s;
  }
  return v;
}

function showPreview(){
  const n = parseInt($tamanho.value||'0',10);
  const tipo = $tipo.value;
  const v = gerarVetor(Math.min(30, Math.max(5, n)), tipo);
  $preview.textContent = 'Prévia: ['+ v.join(', ') + (n>30?' …':'') +']';
}
showPreview();
$tamanho.addEventListener('input', showPreview);
$tipo.addEventListener('change', showPreview);

// ===== Algoritmos com contadores =====
function medirDesempenho(nome, base){
  const arr = base.slice();
  let comparacoes=0, trocas=0;
  const t0 = performance.now();
  const swap = (a,i,j)=>{ [a[i],a[j]]=[a[j],a[i]]; trocas++; };

  if (nome==='Bubble'){
    for (let i=0;i<arr.length-1;i++){
      for (let j=0;j<arr.length-1-i;j++){
        comparacoes++;
        if (arr[j]>arr[j+1]) swap(arr,j,j+1);
      }
    }
  } else if (nome==='Selection'){
    for (let i=0;i<arr.length-1;i++){
      let min=i;
      for (let j=i+1;j<arr.length;j++){
        comparacoes++;
        if (arr[j]<arr[min]) min=j;
      }
      if (min!==i) swap(arr,i,min);
    }
  } else if (nome==='Insertion'){
    for (let i=1;i<arr.length;i++){
      const chave = arr[i];
      let j=i-1;
      while (j>=0 && arr[j]>chave){ comparacoes++; arr[j+1]=arr[j]; trocas++; j--; }
      if (j>=0) comparacoes++;
      arr[j+1]=chave;
    }
  } else if (nome==='Merge'){
    function mergeSort(a){
      if (a.length<=1) return a;
      const mid = Math.floor(a.length/2);
      const L = mergeSort(a.slice(0,mid));
      const R = mergeSort(a.slice(mid));
      return merge(L,R);
    }
    function merge(L,R){
      const res=[]; let i=0,j=0;
      while (i<L.length && j<R.length){
        comparacoes++;
        if (L[i]<=R[j]) res.push(L[i++]); else res.push(R[j++]);
      }
      return res.concat(L.slice(i)).concat(R.slice(j));
    }
    mergeSort(arr);
    // trocas não são bem definidas no Merge; deixaremos como N/A para relatório
    trocas = null;
  } else if (nome==='Quick'){
    function partition(a,low,high){
      const pivot=a[high]; let i=low;
      for (let j=low;j<high;j++){
        comparacoes++;
        if (a[j]<pivot){ swap(a,i,j); i++; }
      }
      swap(a,i,high);
      return i;
    }
    function quick(a,low,high){
      if (low<high){
        const p=partition(a,low,high);
        quick(a,low,p-1); quick(a,p+1,high);
      }
    }
    quick(arr,0,arr.length-1);
  } else if (nome==='Heap'){
    function heapify(a,n,i){
      let largest=i, l=2*i+1, r=2*i+2;
      if (l<n){ comparacoes++; if (a[l]>a[largest]) largest=l; }
      if (r<n){ comparacoes++; if (a[r]>a[largest]) largest=r; }
      if (largest!==i){ swap(a,i,largest); heapify(a,n,largest); }
    }
    const n=arr.length;
    for (let i=Math.floor(n/2)-1;i>=0;i--) heapify(arr,n,i);
    for (let i=n-1;i>0;i--){ swap(arr,0,i); heapify(arr,i,0); }
  }

  const t1 = performance.now();
  return { tempo: t1-t0, comparacoes, trocas };
}

// ===== Execução da tabela simples (1 ponto) =====
const algos = ["Bubble","Selection","Insertion","Merge","Quick","Heap"];

async function rodarTesteTabela(){
  const n = Math.max(5, parseInt($tamanho.value||'0',10));
  const tipo = $tipo.value;
  const base = gerarVetor(n, tipo);
  const tbody = document.querySelector('#tabela tbody');
  tbody.innerHTML = '';
  for (const nome of algos){
    const {tempo, comparacoes, trocas} = medirDesempenho(nome, base);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="algo">${nome}</td>
      <td>${tempo.toFixed(2)}</td>
      <td>${comparacoes.toLocaleString('pt-BR')}</td>
      <td>${trocas==null?'N/A (reescritas)':trocas.toLocaleString('pt-BR')}</td>`;
    tbody.appendChild(tr);
    await new Promise(r=>setTimeout(r,0));
  }
  $badgeInfo.textContent = `Análise para vetor ${n} — tipo: ${tipo}`;
}

// ===== Relatório completo (5 execuções por ponto) =====
let chartTempo=null, chartComp=null, chartTrocas=null;

function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function stddev(arr){
  if (arr.length<=1) return 0;
  const m=mean(arr); const v=arr.reduce((acc,x)=>acc+(x-m)*(x-m),0)/(arr.length-1);
  return Math.sqrt(v);
}

async function rodarRelatorio(){
  const tipo = $tipo.value;
  const tamanhos = [100,300,600,1200];
  const repet = 5;

  const dadosTempo={}, dadosComp={}, dadosTrocas={};
  const brutoMaxTempo={}, brutoMaxComp={}, brutoMaxTrocas={};

  algos.forEach(a=>{ dadosTempo[a]=[]; dadosComp[a]=[]; dadosTrocas[a]=[]; });

  for (const N of tamanhos){
    for (const nome of algos){
      const tempos=[], comps=[], troc=[];
      for (let r=0;r<repet;r++){
        const base = gerarVetor(N, tipo);
        const { tempo, comparacoes, trocas } = medirDesempenho(nome, base);
        tempos.push(tempo);
        comps.push(comparacoes ?? 0);
        troc.push(trocas ?? 0);
      }
      dadosTempo[nome].push(mean(tempos));
      dadosComp[nome].push(Math.round(mean(comps)));
      dadosTrocas[nome].push(Math.round(mean(troc)));

      if (N===tamanhos[tamanhos.length-1]){
        brutoMaxTempo[nome]=tempos;
        brutoMaxComp[nome]=comps;
        brutoMaxTrocas[nome]=troc;
      }
    }
    await new Promise(r=>setTimeout(r,0));
  }

  // Plots
  const mkDatasets = (serie) => algos.map(nome => ({
    label:nome, data:serie[nome], borderWidth:2, fill:false, tension:0.2
  }));

  if (chartTempo) chartTempo.destroy();
  if (chartComp) chartComp.destroy();
  if (chartTrocas) chartTrocas.destroy();

  chartTempo = new Chart(document.getElementById('chartTempo').getContext('2d'), {
    type:'line', data:{ labels:tamanhos, datasets: mkDatasets(dadosTempo) },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' }}, scales:{ x:{ title:{display:true,text:'Tamanho do vetor'}}, y:{ title:{display:true,text:'Tempo (ms)'}} } }
  });
  chartComp = new Chart(document.getElementById('chartComp').getContext('2d'), {
    type:'line', data:{ labels:tamanhos, datasets: mkDatasets(dadosComp) },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' }}, scales:{ x:{ title:{display:true,text:'Tamanho do vetor'}}, y:{ title:{display:true,text:'Comparações (aprox.)'}} } }
  });
  chartTrocas = new Chart(document.getElementById('chartTrocas').getContext('2d'), {
    type:'line', data:{ labels:tamanhos, datasets: mkDatasets(dadosTrocas) },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' }}, scales:{ x:{ title:{display:true,text:'Tamanho do vetor'}}, y:{ title:{display:true,text:'Trocas/Movimentos (aprox.)'}} } }
  });

  // Tabela estatística no N máximo
  const tbody = document.querySelector('#tabelaStats tbody');
  const caption = document.getElementById('statsCaption');
  tbody.innerHTML='';
  caption.textContent = `Cálculo no maior tamanho (N = ${tamanhos[tamanhos.length-1]}), com média de ${repet} execuções por algoritmo — cenário: ${tipo}.`;

  algos.forEach(nome=>{
    const runsT = brutoMaxTempo[nome]||[];
    const mT = runsT.length?mean(runsT):0;
    const sT = runsT.length?stddev(runsT):0;
    const minT = runsT.length?Math.min(...runsT):0;
    const maxT = runsT.length?Math.max(...runsT):0;
    const avgC = dadosComp[nome][tamanhos.length-1];
    const avgX = dadosTrocas[nome][tamanhos.length-1];
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="algo">${nome}</td>
      <td>${mT.toFixed(2)}</td><td>${sT.toFixed(2)}</td>
      <td>${minT.toFixed(2)}</td><td>${maxT.toFixed(2)}</td>
      <td>${avgC.toLocaleString('pt-BR')}</td>
      <td>${avgX==null?'N/A':avgX.toLocaleString('pt-BR')}</td>`;
    tbody.appendChild(tr);
  });
}

async function rodarTudo(){
  $btnRodar.disabled = true;
  $btnRodar.textContent = 'Executando…';
  await rodarTesteTabela();
  await rodarRelatorio();
  // scroll
  const sec = document.getElementById('relatorio');
  if (sec && sec.scrollIntoView) sec.scrollIntoView({behavior:'smooth', block:'start'});
  $btnRodar.disabled = false;
  $btnRodar.textContent = 'Rodar teste';
}

$btnRodar.addEventListener('click', rodarTudo);

// ===== Exportar PDF =====
$btnPdf.addEventListener('click', async () => {
  const sec = document.getElementById('relatorio');
  const { jsPDF } = window.jspdf;
  const scale = 2;
  const canvas = await html2canvas(sec, { scale, backgroundColor:'#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p','mm','a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const ratio = imgWidth / canvas.width;
  const imgHeightPage = (pageHeight - 20);
  const slicePx = Math.floor(imgHeightPage / ratio);
  let y=10, sY=0, first=true;
  while (sY < canvas.height){
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(slicePx, canvas.height - sY);
    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, sY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
    const part = pageCanvas.toDataURL('image/png');
    if (!first) pdf.addPage();
    pdf.addImage(part, 'PNG', 10, 10, imgWidth, pageCanvas.height * ratio);
    first = false;
    sY += slicePx;
  }
  pdf.save('relatorio-completo.pdf');
});
