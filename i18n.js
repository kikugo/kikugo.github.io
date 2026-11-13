// English / French switch. The pages are written in English; this swaps the
// text of known elements for French and back. Keys are the English markup with
// whitespace collapsed, so the HTML stays the single source for English.
(function () {
  const SEL = 'h1,h2,h3,p,li,time,figcaption,th,td,dt,dd,footer,.work-title,.work-desc,.edu-degree,' +
    '.contact-badge,.stats span,.project-links a,.live,.concierge-link,a.back,a.btn,[data-i18n]';

  const FR = {
    // ---- home ----
    'hi, karthik here': 'salut, ici karthik',
    'y/o AI Engineer in Paris building LLM and agentic systems': 'ans, ingénieur IA à Paris, je construis des systèmes LLM et agentiques',
    'ask my ai about me <span class="concierge-arrow" aria-hidden="true">→</span>': 'interroger mon IA sur moi <span class="concierge-arrow" aria-hidden="true">→</span>',
    'about': 'à propos',
    "I'm doing my M.Sc. in AI Systems at EPITA, Paris. Before this I spent about three years building production LLM and machine learning systems at startups.":
      "Je fais mon M.Sc. en systèmes d'IA à l'EPITA, à Paris. Avant cela, j'ai passé environ trois ans à construire des systèmes LLM et de machine learning en production dans des startups.",
    'At Aspireit I was the founding AI engineer on a small team, so the core architecture calls on the recruitment backend were mine: orchestration, APIs, data pipelines. These days most of what I build sits around large language models, mainly RAG and agentic systems.':
      "Chez Aspireit, j'étais l'ingénieur IA fondateur d'une petite équipe : les choix d'architecture du backend de recrutement me revenaient, de l'orchestration aux API et aux pipelines de données. Aujourd'hui, l'essentiel de ce que je construis tourne autour des grands modèles de langage, surtout le RAG et les systèmes agentiques.",
    'work experience': 'expérience',
    'Apr 2025 - Jun 2025': 'avr. 2025 - juin 2025',
    'AI Automation Specialist': "Spécialiste de l'automatisation IA",
    'Built AI automation pipelines for multiple clients, cutting manual steps out of their data and operations work.':
      "J'ai construit des pipelines d'automatisation IA pour plusieurs clients, en supprimant des étapes manuelles de leur travail sur les données et les opérations.",
    'Apr 2024 - Apr 2025': 'avr. 2024 - avr. 2025',
    'Founding AI Engineer': 'Ingénieur IA fondateur',
    "Built the recruitment platform's AI backend as the main developer on a small team. Up-front candidate signal let recruiters skip most of the screening funnel, cutting time-to-hire around 30%.":
      "J'ai construit le backend IA de la plateforme de recrutement, en tant que développeur principal d'une petite équipe. Comme les recruteurs avaient dès le départ des indicateurs sur chaque candidat, ils sautaient l'essentiel de la présélection, et le délai d'embauche a baissé d'environ 30 %.",
    'Mar 2024 - Apr 2024': 'mars 2024 - avr. 2024',
    'Software Engineer - AI/ML': 'Ingénieur logiciel - IA/ML',
    'Trained and evaluated large language models on code generation, using RLHF and adversarial prompts across Python, TypeScript, and Go.':
      "J'ai entraîné et évalué de grands modèles de langage sur la génération de code, avec du RLHF et des prompts adverses, en Python, TypeScript et Go.",
    'education': 'formation',
    'EPITA · Le Kremlin-Bicêtre, Paris, France': 'EPITA · Le Kremlin-Bicêtre, Paris, France',
    'Sep 2025 - Present': "sept. 2025 - aujourd'hui",
    'M.Sc. · Artificial Intelligence Systems': "M.Sc. · Systèmes d'intelligence artificielle",
    'B.Tech · Electronics &amp; Communication Engineering': 'B.Tech · Électronique et télécommunications',
    'skills': 'compétences',
    'projects': 'projets',
    'live': 'en ligne',
    'French labour-law agent on Azure AI Foundry.': 'Agent de droit du travail français sur Azure AI Foundry.',
    '98% of answers cite a correct article': '98 % des réponses citent un article correct',
    'Live demo': 'Démo',
    'Code': 'Code',
    'Film recommendations from your Letterboxd diary, over an 87,000-film catalog.':
      'Des recommandations de films à partir de votre journal Letterboxd, sur un catalogue de 87 000 films.',
    'AWQ gives 2.8× throughput and 9.6 GiB less weight memory than BF16':
      "AWQ donne un débit 2,8× plus élevé et 9,6 Gio de poids en moins qu'en BF16",
    'Research': 'Recherche',
    'Models': 'Modèles',
    'Multimodal RAG over text, images, audio, and video, with an eval harness and CI gate.':
      "RAG multimodal sur texte, images, audio et vidéo, avec un banc d'évaluation et un contrôle en CI.",
    'hit@1 raised from 0.59 to 0.70': 'hit@1 passé de 0,59 à 0,70',
    'Red-teams, guards and gates the Droit du Travail Copilot.': 'Attaque, protège et contrôle le Droit du Travail Copilot.',
    'False refusals halved, 4.7% to 2.4%': 'Faux refus divisés par deux, de 4,7 % à 2,4 %',
    'Hourly forecasts for 95 Paris counters.': 'Prévisions horaires pour 95 compteurs vélo parisiens.',
    '−16.5% MAE vs seasonal-naive, 79% coverage for 80% intervals':
      '−16,5 % de MAE face au naïf saisonnier, couverture de 79 % pour des intervalles à 80 %',
    'Medical Q&amp;A over drug guidelines, with hybrid BM25 and FAISS retrieval and a multi-agent pipeline behind an MCP server.':
      'Questions-réponses médicales sur des notices de médicaments, avec une recherche hybride BM25 et FAISS et un pipeline multi-agents derrière un serveur MCP.',
    'more projects': 'autres projets',
    'Terminal game where two LLMs go head to head, one placing towers, one spawning enemies.':
      "Jeu en terminal où deux LLM s'affrontent : l'un place des tours, l'autre envoie des ennemis.",
    'Watch a match': 'Voir une partie',
    'Search inside a video with plain language and jump to the matching moment.':
      "Cherchez dans une vidéo en langage courant et sautez au bon moment.",
    'Realtime nutrition tracking. A FastAPI and WebSocket backend streams to a React frontend.':
      'Suivi nutritionnel en temps réel. Un backend FastAPI et WebSocket diffuse vers un frontend React.',
    'Turns a menu photo into a browsable, photo-rich version with a dietary chatbot on top.':
      "Transforme la photo d'un menu en une version illustrée à parcourir, avec un chatbot diététique.",
    'The thesis results behind Reel History are on <a href="research.html">the research page</a>.':
      'Les résultats de mémoire derrière Reel History sont sur <a href="research.html">la page recherche</a>.',
    'Contact': 'Contact',
    'Get in Touch': 'Me contacter',
    'Interested in collaborating? Feel free to reach out.': "Envie de collaborer ? N'hésitez pas à m'écrire.",

    // ---- research ----
    '← karthik': '← karthik',
    'do LLMs help a recommender?': 'les LLM aident-ils un système de recommandation ?',
    "For our master's thesis at EPITA, four of us tested whether LLM, text-retrieval and knowledge-graph augmentation make sequential recommendation better, and whether the gain lands on users with thin histories. Every model ran under one protocol on MovieLens-1M: leave-one-out splits, each held-out film ranked against 100 sampled negatives, scored with HR@10, NDCG@10 and MRR@10, overall and per density stratum.":
      "Pour notre mémoire de master à l'EPITA, nous avons testé à quatre si l'augmentation par LLM, par recherche textuelle et par graphe de connaissances améliore la recommandation séquentielle, et si le gain profite aux utilisateurs à l'historique mince. Tous les modèles ont suivi un même protocole sur MovieLens-1M : découpage leave-one-out, chaque film retenu classé face à 100 négatifs tirés au hasard, avec HR@10, NDCG@10 et MRR@10, au global et par strate de densité.",
    'Short version: on this dataset, no. A tuned classical model beat every augmented one, and the best augmented method barely beat recommending popular films.':
      "En bref : sur ce jeu de données, non. Un modèle classique bien réglé bat toutes les variantes augmentées, et la meilleure méthode augmentée fait à peine mieux que recommander les films populaires.",
    'GRU4Rec, best of 16': 'GRU4Rec, meilleur des 16',
    'popularity prior': 'a priori de popularité',
    'best fine-tuned LLM': 'meilleur LLM affiné',
    'sixteen configurations, one ranking': 'seize configurations, un classement',
    'Classical sequential models sit at the top: <strong>GRU4Rec 0.8119</strong>, BERT4Rec 0.8118, SASRec 0.8055. Only one augmented method clears the popularity prior: V3+Pop, an SBERT and popularity hybrid, at 0.4964. Every fine-tuned LLM variant, every pure retrieval method and the knowledge-graph variant land below popularity. Several sit near the random floor of 10/101.':
      "Les modèles séquentiels classiques sont en tête : <strong>GRU4Rec 0,8119</strong>, BERT4Rec 0,8118, SASRec 0,8055. Une seule méthode augmentée dépasse l'a priori de popularité : V3+Pop, un hybride SBERT et popularité, à 0,4964. Toutes les variantes de LLM affinés, toutes les méthodes de recherche pure et la variante à graphe de connaissances restent sous la popularité. Plusieurs sont proches du plancher aléatoire de 10/101.",
    'HR@10 overall. <span class="key"></span>Dashed line: popularity prior. LLM variants were scored on a stratified subset of 1,500 users because of the compute budget, and the rest on all 6,040. The classical models were run at both scales, and the bars show the full population.':
      "HR@10 global. <span class=\"key\"></span>Ligne pointillée : a priori de popularité. Les variantes LLM ont été évaluées sur un sous-ensemble stratifié de 1 500 utilisateurs faute de budget de calcul, les autres sur les 6 040. Les modèles classiques ont tourné aux deux échelles, et les barres montrent la population complète.",
    'Method': 'Méthode',
    'Family': 'Famille',
    'Sparse': 'Faible',
    'Mid': 'Moyenne',
    'Dense': 'Forte',
    'Overall': 'Global',
    'Classical CF': 'CF classique',
    'Collaborative': 'Collaboratif',
    'Content-CF': 'Contenu-CF',
    'Popularity (prior)': 'Popularité (a priori)',
    'Baseline': 'Référence',
    'Hybrid LLM': 'LLM hybride',
    'LLM (text)': 'LLM (texte)',
    'Text retrieval': 'Recherche textuelle',
    'Zero-shot LLM': 'LLM zero-shot',
    'V1 KG (layer 3)': 'V1 KG (couche 3)',
    'Graph CF': 'CF sur graphe',
    'LLM-CF adapter': 'Adaptateur LLM-CF',
    'sparse users are the easy ones': 'les utilisateurs peu actifs sont les plus faciles',
    "We expected users with short histories to be the hard case, since that's the cold-start story augmentation is meant to fix. The opposite held for every model we ran. GRU4Rec scores <strong>0.8929</strong> on the sparse stratum and <strong>0.7126</strong> on the dense one, and the popularity prior slopes the same way.":
      "Nous pensions que les utilisateurs à l'historique court seraient le cas difficile, puisque c'est le démarrage à froid que l'augmentation est censée résoudre. C'est l'inverse pour tous les modèles testés. GRU4Rec obtient <strong>0,8929</strong> sur la strate faible et <strong>0,7126</strong> sur la strate forte, et l'a priori de popularité suit la même pente.",
    "HR@10 by interaction-density stratum, all 6,040 users. Sparse is 42 ratings or fewer, dense is more than 206. BERT4Rec and SASRec follow GRU4Rec almost exactly and are left out for legibility. They're in the table above.":
      "HR@10 par strate de densité d'interactions, sur les 6 040 utilisateurs. Faible : 42 notes ou moins ; forte : plus de 206. BERT4Rec et SASRec suivent presque exactement GRU4Rec et sont omis pour la lisibilité. Ils figurent dans le tableau ci-dessus.",
    "Two things cause it. MovieLens-1M only keeps users with at least 20 ratings, so the sparse bin is the low end of a warm population, not a cold one. And with 100 negatives drawn uniformly, a sparse user's held-out film tends to be a mainstream title that's easy to separate from random ones. The gap worth closing is the dense stratum. No augmentation closed it.":
      "Deux raisons à cela. MovieLens-1M ne garde que les utilisateurs ayant au moins 20 notes, donc la strate faible est le bas d'une population déjà active, pas une population froide. Et avec 100 négatifs tirés uniformément, le film retenu d'un utilisateur peu actif est souvent un titre grand public, facile à distinguer de films pris au hasard. L'écart qui compte est sur la strate forte. Aucune augmentation ne l'a comblé.",
    'the curriculum ablation': "l'ablation du curriculum",
    'LLaRA trains in stages: text prompts first, then mixed, then hybrid prompts with collaborative IDs. We held the architecture, data, batch size and epoch budget fixed and changed only the staging.':
      "LLaRA s'entraîne par étapes : d'abord des prompts textuels, puis mixtes, puis hybrides avec des identifiants collaboratifs. Nous avons fixé l'architecture, les données, la taille de batch et le nombre d'époques, et changé uniquement l'ordre des étapes.",
    'LLaRA overall HR@10 by training schedule, 1,500 users (Table 5.2). <span class="key"></span>Popularity on the full 6,040 users, for reference.':
      "HR@10 global de LLaRA selon le programme d'entraînement, 1 500 utilisateurs (tableau 5.2). <span class=\"key\"></span>Popularité sur les 6 040 utilisateurs, pour référence.",
    "The published forward schedule scored <strong>0.0270</strong>. No curriculum scored <strong>0.4310</strong>, about sixteen times higher, and the reverse order scored 0.1260. The training-loss traces show why: loss collapsed to near zero within the first tenth of each phase, so the model memorized each phase's prompt format, and the next phase overwrote it. That's catastrophic forgetting. By the time the forward run reached the hybrid format used at evaluation, the earlier learning was gone.":
      "Le programme publié, dans l'ordre, obtient <strong>0,0270</strong>. Sans curriculum, on obtient <strong>0,4310</strong>, environ seize fois plus, et l'ordre inverse donne 0,1260. Les courbes de perte expliquent pourquoi : la perte tombe presque à zéro dès le premier dixième de chaque phase, le modèle mémorise donc le format de prompt de la phase, que la suivante écrase. C'est un oubli catastrophique. Quand l'entraînement atteint le format hybride utilisé à l'évaluation, l'apprentissage précédent a disparu.",
    'The LLaRA paper reports curriculum gains on MovieLens-100K, Steam and LastFM. On MovieLens-1M the schedule hurt, so we report it as a negative replication.':
      "L'article LLaRA rapporte des gains du curriculum sur MovieLens-100K, Steam et LastFM. Sur MovieLens-1M, il a nui, nous le rapportons donc comme une réplication négative.",
    'robustness audit': 'audit de robustesse',
    "On a memorization split, text-only retrieval (V3+Pop) fell from 0.7895 on popular, likely-memorized films to <strong>0.0414</strong> on rare ones, while LLaRA V2b, which puts collaborative IDs in the prompt, kept <strong>0.2260</strong>. That's the one place augmentation earned its cost.":
      "Sur un découpage dédié à la mémorisation, la recherche purement textuelle (V3+Pop) passe de 0,7895 sur les films populaires, probablement mémorisés, à <strong>0,0414</strong> sur les films rares, tandis que LLaRA V2b, qui met des identifiants collaboratifs dans le prompt, garde <strong>0,2260</strong>. C'est le seul endroit où l'augmentation a valu son coût.",
    'V3+Pop also ignores history order entirely (0.4964 with the sequence shuffled or not), and its confidence scores are badly miscalibrated, with an expected calibration error of 0.3985.':
      "V3+Pop ignore aussi complètement l'ordre de l'historique (0,4964 que la séquence soit mélangée ou non), et ses scores de confiance sont très mal calibrés, avec une erreur de calibration attendue de 0,3985.",
    'limitations': 'limites',
    'Ranking against 100 sampled negatives inflates absolute hit rates, most of all on sparse users. We rest the conclusions on the ordering between methods, not the absolute numbers.':
      "Le classement face à 100 négatifs échantillonnés gonfle les taux de réussite absolus, surtout pour les utilisateurs peu actifs. Nos conclusions reposent sur l'ordre entre méthodes, pas sur les valeurs absolues.",
    'SBERT and the Freebase graph vectors were used as static features, not fine-tuned on recommendation pairs. The knowledge-graph result is about those embeddings, not the full K-RagRec pipeline.':
      "SBERT et les vecteurs du graphe Freebase ont servi de caractéristiques statiques, sans affinage sur des paires de recommandation. Le résultat du graphe de connaissances porte sur ces embeddings, pas sur le pipeline K-RagRec complet.",
    'We didn\'t test a classical model given the same semantic features, so "augmentation doesn\'t help" and "additive augmentation doesn\'t help" can\'t be fully separated.':
      "Nous n'avons pas testé de modèle classique doté des mêmes caractéristiques sémantiques, on ne peut donc pas totalement séparer « l'augmentation n'aide pas » de « l'augmentation additive n'aide pas ».",
    'The LLM results rest on one backbone (Mistral-7B-Instruct) and one training budget, and our A-LLMRec is a simplified reproduction.':
      "Les résultats LLM reposent sur un seul modèle de base (Mistral-7B-Instruct) et un seul budget d'entraînement, et notre A-LLMRec est une reproduction simplifiée.",
    'Everything is on MovieLens-1M, which is dense and widely memorized. Sparser or text-richer domains may behave differently.':
      "Tout est mesuré sur MovieLens-1M, un jeu dense et largement mémorisé. Des domaines plus clairsemés ou plus riches en texte peuvent se comporter autrement.",
    'what I built from it': "ce que j'en ai construit",
    'Reel History turns a Letterboxd export into film recommendations. It started as a three-person team MVP, I wrote most of its code, and I kept only what the evidence supported.':
      "Reel History transforme un export Letterboxd en recommandations de films. Le projet est parti d'un MVP à trois, j'en ai écrit l'essentiel du code, et je n'ai gardé que ce que les résultats justifiaient.",
    '<strong>A classical model does the ranking.</strong> GRU4Rec won every stratum, so it drives the feed for anyone with a real diary. Visitors with no history get popularity, and those with only a little get the content and collaborative retrievers.':
      "<strong>Un modèle classique fait le classement.</strong> GRU4Rec gagne sur toutes les strates, il alimente donc le fil de quiconque a un vrai journal. Les visiteurs sans historique reçoivent la popularité, et ceux qui en ont peu, la recherche par contenu et le filtrage collaboratif.",
    '<strong>No confidence number is shown raw.</strong> With an ECE near 0.40, a raw score would lie, so every card goes through isotonic calibration and shows a label: strong, good, worth a try, or low evidence.':
      "<strong>Aucun score de confiance n'est affiché brut.</strong> Avec une ECE proche de 0,40, un score brut mentirait : chaque carte passe par une calibration isotonique et affiche une étiquette : fort, bon, à essayer ou peu d'indices.",
    "<strong>Augmentation only where it held up.</strong> The deep-cuts end of the Rewind dial leans on LLaRA's collaborative embeddings, since the hybrid-ID model was the only method that kept signal on rare films.":
      "<strong>De l'augmentation seulement là où elle tient.</strong> Le côté « pépites » du cadran Rewind s'appuie sur les embeddings collaboratifs de LLaRA, car le modèle à identifiants hybrides est la seule méthode qui garde du signal sur les films rares.",
    '<strong>Nothing heavy at serve time.</strong> Every model runs once offline and ships as a static asset. Serving is matrix math and lookups on a free CPU Space.':
      "<strong>Rien de lourd au moment de servir.</strong> Chaque modèle tourne une fois hors ligne et est livré comme fichier statique. Servir, c'est du calcul matriciel et des recherches sur un Space CPU gratuit.",
    'The live app runs on the larger MovieLens-32M catalog. The numbers on this page are from the thesis, on MovieLens-1M.':
      "L'application en ligne utilise le catalogue plus large de MovieLens-32M. Les chiffres de cette page viennent du mémoire, sur MovieLens-1M.",
    'Try Reel History': 'Essayer Reel History',
    'Other projects': 'Autres projets',
    'Thesis results are from a four-person group study at EPITA (M.Sc. AI Systems). All figures are drawn from the thesis tables by <a href="https://github.com/kikugo/kikugo.github.io/blob/main/results/make_charts.py" target="_blank" rel="noopener noreferrer">one script</a>.':
      "Les résultats viennent d'un mémoire de groupe à quatre à l'EPITA (M.Sc. AI Systems). Toutes les figures sont tirées des tableaux du mémoire par <a href=\"https://github.com/kikugo/kikugo.github.io/blob/main/results/make_charts.py\" target=\"_blank\" rel=\"noopener noreferrer\">un seul script</a>.",
  };

  const ATTR_FR = {
    'Home': 'Accueil', 'About': 'À propos', 'Experience': 'Expérience', 'Research': 'Recherche',
    'Email': 'E-mail', 'Download CV': 'Télécharger le CV', 'Ask my AI about me': 'Interroger mon IA sur moi',
  };

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const KEY = 'lang';
  let saved = [];

  function apply(lang) {
    // Restore English first, so switching is always from the source markup.
    saved.forEach(({ el, html }) => { el.innerHTML = html; });
    saved = [];
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const en = el.dataset.i18nAttr;
      el.title = en;
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', en);
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-switch button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    if (lang !== 'fr') return;

    let last = null;
    document.querySelectorAll(SEL).forEach((el) => {
      if (last && last.contains(el)) return;
      if (el.closest('.lang-switch,.dock,.concierge-overlay')) return;
      const fr = FR[norm(el.innerHTML)];
      if (fr === undefined) return;
      saved.push({ el, html: el.innerHTML });
      el.innerHTML = fr;
      last = el;
    });
    document.querySelectorAll('.dock-item[title]').forEach((el) => {
      const en = el.dataset.i18nAttr || el.title;
      if (!ATTR_FR[en]) return;
      el.dataset.i18nAttr = en;
      el.title = ATTR_FR[en];
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', ATTR_FR[en]);
    });
  }

  function set(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
    apply(lang);
  }

  let initial = 'en';
  try { initial = localStorage.getItem(KEY) === 'fr' ? 'fr' : 'en'; } catch (e) { /* ignore */ }

  document.querySelectorAll('.lang-switch button').forEach((b) =>
    b.addEventListener('click', () => set(b.dataset.lang)));
  apply(initial);
})();
