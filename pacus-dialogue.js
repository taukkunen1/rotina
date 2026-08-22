(() => {
  'use strict';

  const MESSAGES = [
    '🌱 Hoje estou me sentindo tranquilo.',
    '🌿 Estou me sentindo bem por aqui.',
    '☀️ Hoje estou com uma sensação boa.',
    '🌱 Estou crescendo um pouquinho a cada dia.',
    '🍃 Hoje estou me sentindo leve.',
    '🌿 Estou gostando de como o dia está indo.',
    '☀️ Hoje acordei me sentindo bem.',
    '🌱 Estou tranquilo e pronto para o dia.',
    '🍃 Hoje estou com energia para crescer.',
    '🌿 Estou me sentindo confortável aqui.',
    '☀️ Hoje parece um bom dia para tentar.',
    '🌱 Estou feliz por estar crescendo.',
    '🍃 Estou me sentindo forte hoje.',
    '🌿 Hoje estou com uma calma gostosa.',
    '☀️ Estou gostando desse cantinho.',
    '🌱 Hoje estou me sentindo corajoso.',
    '🍃 Estou crescendo no meu ritmo.',
    '🌿 Hoje estou me sentindo seguro.',
    '☀️ Estou tranquilo. Um passo de cada vez.',
    '🌱 Hoje estou curioso para ver o que acontece.',
    '🍃 Estou me sentindo bem acompanhado.',
    '🌿 Hoje estou com vontade de descobrir coisas.',
    '☀️ Estou feliz com meu crescimento.',
    '🌱 Hoje estou me sentindo preparado.',
    '🍃 Estou tranquilo e confortável.',
    '🌿 Hoje estou sentindo uma energia boa.',
    '☀️ Estou gostando de crescer devagarinho.',
    '🌱 Hoje estou me sentindo confiante.',
    '🍃 Estou bem. Posso ir com calma.',
    '🌿 Hoje estou me sentindo forte por dentro.',
    '☀️ Estou gostando do meu progresso.',
    '🌱 Hoje estou tranquilo para tentar.',
    '🍃 Estou me sentindo cada vez mais seguro.',
    '🌿 Hoje estou com uma sensação de calma.',
    '☀️ Estou contente com mais um dia.',
    '🌱 Hoje estou pronto para dar um pequeno passo.',
    '🍃 Estou me sentindo bem no meu cantinho.',
    '🌿 Hoje estou com vontade de crescer.',
    '☀️ Estou tranquilo e seguindo meu caminho.',
    '🌱 Hoje estou me sentindo capaz.',
    '🍃 Estou gostando de como estou crescendo.',
    '🌿 Hoje estou me sentindo em paz.',
    '☀️ Estou pronto para mais um dia.',
    '🌱 Hoje estou com uma sensação de confiança.',
    '🍃 Estou crescendo e aprendendo.',
    '🌿 Hoje estou me sentindo bem comigo.',
    '☀️ Estou tranquilo. Não preciso ter pressa.',
    '🌱 Hoje estou sentindo que consigo.',
    '🍃 Estou feliz por mais um pequeno passo.',
    '🌿 Hoje estou bem. Vamos devagar.'
  ];

  const KEY = 'pacus_dialogue_date_v1';
  const today = () => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  function showDialogue() {
    const pet = document.getElementById('petSection');
    if (!pet || document.getElementById('pacusDialogue')) return false;

    const bubble = document.createElement('div');
    bubble.id = 'pacusDialogue';
    bubble.className = 'pacus-dialogue';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');

    const index = Math.floor(Math.random() * MESSAGES.length);
    bubble.innerHTML = `<span class="pacus-dialogue-mark" aria-hidden="true">💬</span><span>${MESSAGES[index]}</span>`;
    pet.appendChild(bubble);

    requestAnimationFrame(() => bubble.classList.add('visible'));
    localStorage.setItem(KEY, today());
    return true;
  }

  function start() {
    if (localStorage.getItem(KEY) === today()) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (showDialogue() || attempts >= 80) clearInterval(timer);
    }, 100);

    setTimeout(() => clearInterval(timer), 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 3000), { once: true });
  } else {
    setTimeout(start, 3000);
  }
})();
