function gerarVetor(tamanho, tipo = "aleatorio") {
  const vetor = Array.from({ length: tamanho }, () =>
    Math.floor(Math.random() * tamanho)
  );
  if (tipo === "ordenado") return vetor.sort((a, b) => a - b);
  if (tipo === "inverso") return vetor.sort((a, b) => b - a);
  if (tipo === "quase") {
    vetor.sort((a, b) => a - b);
    const qtd = Math.max(1, Math.floor(tamanho * 0.05));
    for (let k = 0; k < qtd; k++) {
      const i = Math.floor(Math.random() * tamanho);
      const j = Math.floor(Math.random() * tamanho);
      [vetor[i], vetor[j]] = [vetor[j], vetor[i]];
    }
  }
  return vetor;
}

function medirDesempenho(algoritmo, vetorOriginal) {
  let vetor = [...vetorOriginal];
  let comparacoes = 0,
    trocas = 0;
  const swap = (arr, i, j) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    trocas++;
  };
  const t0 = performance.now();

  switch (algoritmo) {
    case "Bubble":
      for (let i = 0; i < vetor.length - 1; i++)
        for (let j = 0; j < vetor.length - i - 1; j++) {
          comparacoes++;
          if (vetor[j] > vetor[j + 1]) swap(vetor, j, j + 1);
        }
      break;

    case "Selection":
      for (let i = 0; i < vetor.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < vetor.length; j++) {
          comparacoes++;
          if (vetor[j] < vetor[min]) min = j;
        }
        if (min !== i) swap(vetor, i, min);
      }
      break;

    case "Insertion":
      for (let i = 1; i < vetor.length; i++) {
        const chave = vetor[i];
        let j = i - 1;
        while (j >= 0 && vetor[j] > chave) {
          comparacoes++;
          vetor[j + 1] = vetor[j];
          trocas++;
          j--;
        }
        if (j >= 0) comparacoes++;
        vetor[j + 1] = chave;
      }
      break;

    case "Merge": {
      function mergeSort(arr) {
        if (arr.length <= 1) return arr;
        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));
        return merge(left, right);
      }
      function merge(a, b) {
        const res = [];
        let i = 0,
          j = 0;
        while (i < a.length && j < b.length) {
          comparacoes++;
          if (a[i] <= b[j]) res.push(a[i++]);
          else res.push(b[j++]);
        }
        return res.concat(a.slice(i), b.slice(j));
      }
      vetor = mergeSort(vetor);
      trocas = null;
      break;
    }

    case "Quick": {
      function partition(arr, low, high) {
        const pivot = arr[high];
        let i = low;
        for (let j = low; j < high; j++) {
          comparacoes++;
          if (arr[j] < pivot) {
            swap(arr, i, j);
            i++;
          }
        }
        swap(arr, i, high);
        return i;
      }
      function quickSort(arr, low, high) {
        if (low < high) {
          const p = partition(arr, low, high);
          quickSort(arr, low, p - 1);
          quickSort(arr, p + 1, high);
        }
      }
      quickSort(vetor, 0, vetor.length - 1);
      break;
    }

    case "Heap": {
      function heapify(arr, n, i) {
        let largest = i;
        const l = 2 * i + 1,
          r = 2 * i + 2;
        if (l < n) {
          comparacoes++;
          if (arr[l] > arr[largest]) largest = l;
        }
        if (r < n) {
          comparacoes++;
          if (arr[r] > arr[largest]) largest = r;
        }
        if (largest !== i) {
          swap(arr, i, largest);
          heapify(arr, n, largest);
        }
      }
      function heapSort(arr) {
        const n = arr.length;
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
        for (let i = n - 1; i > 0; i--) {
          swap(arr, 0, i);
          heapify(arr, i, 0);
        }
      }
      heapSort(vetor);
      break;
    }
  }

  const tempo = performance.now() - t0;
  return { algoritmo, tempo, comparacoes, trocas };
}
// ui
const $tamanho = document.getElementById("tamanho");
const $tipo = document.getElementById("tipo");
const $btnRodar = document.getElementById("btnRodar");
const $tbody = document.querySelector("#tabela tbody");
const $badge = document.getElementById("badgeInfo");
const $preview = document.getElementById("preview");
let ultimoResultado = null;

function atualizarPreview() {
  const n = Math.max(1, Number($tamanho.value || 0));
  const tipo = $tipo.value;
  const sample = gerarVetor(Math.min(n, 16), tipo);
  $preview.textContent = `Prévia: [ ${sample.join(", ")}${
    n > 16 ? " …" : ""
  } ]`;
}
$tamanho.addEventListener("input", atualizarPreview);
$tipo.addEventListener("change", atualizarPreview);
atualizarPreview();

$btnRodar.addEventListener("click", () => {
  const n = Math.max(1, Number($tamanho.value || 0));
  const tipo = $tipo.value;
  $btnRodar.disabled = true;
  $btnRodar.textContent = "Executando…";

  const vetor = gerarVetor(n, tipo);
  const nomes = ["Bubble", "Selection", "Insertion", "Merge", "Quick", "Heap"];
  const resultados = nomes.map((nm) => medirDesempenho(nm, vetor));
  const melhorTempo = Math.min(...resultados.map((r) => r.tempo));

  $tbody.innerHTML = "";
  resultados.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="algo">${r.algoritmo}</td>
        <td class="ms ${r.tempo === melhorTempo ? "ok" : ""}">${r.tempo.toFixed(
      2
    )}</td>
        <td>${r.comparacoes.toLocaleString("pt-BR")}</td>
        <td>${
          r.trocas == null
            ? "N/A (reescritas)"
            : r.trocas.toLocaleString("pt-BR")
        }</td>
      `;
    $tbody.appendChild(tr);
  });

  $badge.textContent = `Análise para vetor ${n.toLocaleString(
    "pt-BR"
  )} — tipo: ${tipo}`;
  ultimoResultado = { n, tipo, resultados };
  $btnRodar.disabled = false;
  $btnRodar.textContent = "Rodar teste";
});
