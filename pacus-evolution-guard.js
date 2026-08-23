/* Guarda de celebração do Pacus.
   Uma evolução é um evento único. Ao carregar o site, qualquer estágio que
   já seja o estágio atual é reconhecido como visto antes de novas interações. */
(function(){
  function acknowledgeCurrentStage(){
    if(typeof state === 'undefined' || typeof computePetStage !== 'function') return;
    var data = computePetStage();
    var currentStage = Number(data && data.stage);
    if(!Number.isFinite(currentStage)) return;

    var previousStage = Number(state.lastSeenPetStage);
    if(!Number.isFinite(previousStage) || previousStage < currentStage){
      state.lastSeenPetStage = currentStage;
      if(typeof saveState === 'function'){
        Promise.resolve(saveState(state)).catch(function(err){
          console.warn('Não foi possível registrar a evolução já vista do Pacus.', err);
        });
      }
    }
  }

  function closeRepeatedCelebration(){
    var overlay = document.getElementById('evolutionCelebration');
    if(!overlay) return;
    if(overlay.dataset.autoCloseId) clearTimeout(Number(overlay.dataset.autoCloseId));
    overlay.classList.remove('open');
    acknowledgeCurrentStage();
  }

  // Corrige o estado migrado que fazia a evolução antiga reaparecer em toda visita.
  acknowledgeCurrentStage();
  closeRepeatedCelebration();

  var overlay = document.getElementById('evolutionCelebration');
  if(overlay){
    new MutationObserver(function(){
      // Se uma renderização inicial tentar repetir uma evolução já reconhecida,
      // fecha imediatamente. Evoluções futuras continuam sendo registradas pelo app.
      if(overlay.classList.contains('open')){
        var seen = Number(state && state.lastSeenPetStage);
        var current = typeof computePetStage === 'function' ? Number(computePetStage().stage) : NaN;
        if(Number.isFinite(seen) && Number.isFinite(current) && seen >= current){
          closeRepeatedCelebration();
        }
      }
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
})();
