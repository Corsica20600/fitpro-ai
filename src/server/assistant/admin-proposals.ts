export type AssistantArticleProposal = {
  id: string;
  title: string;
  category: string;
  routeContext: string | null;
  keywords: string[];
  content: string;
};

// These are editable drafts only. They are never inserted without an administrator saving them.
const proposalRows: Array<[string, string, string, string | null, string[], string]> = [
  ["dashboard-overview", "Lire le tableau de bord", "TABLEAU DE BORD", "/dashboard", ["tableau", "accueil", "dashboard"], "Le tableau de bord rassemble ta séance proposée, tes accès rapides et les repères utiles pour reprendre ton entraînement."],
  ["dashboard-favorite", "Choisir une séance favorite", "TABLEAU DE BORD", "/dashboard", ["favorite", "séance favorite", "accueil"], "Depuis le tableau de bord, ouvre la séance favorite proposée pour reprendre rapidement un entraînement enregistré dans ton programme."],
  ["exercises-catalog", "Parcourir le catalogue d’exercices", "EXERCICES", "/exercises", ["catalogue", "exos", "rechercher exercice"], "Dans Exos, utilise la recherche et les filtres pour parcourir les exercices disponibles puis ouvre une fiche pour consulter ses informations."],
  ["exercises-custom", "Créer un exercice personnalisé", "EXERCICES", "/exercises", ["personnalisé", "créer exercice", "mes exercices"], "Dans Exos, ouvre Mes exercices puis ajoute un exercice. Renseigne son nom et les informations demandées avant de l’enregistrer pour pouvoir le retrouver dans tes séances."],
  ["exercises-edit", "Modifier un exercice personnalisé", "EXERCICES", "/exercises", ["modifier exercice", "mes exercices", "personnalisé"], "Dans Mes exercices, ouvre la fiche de l’exercice personnalisé concerné puis utilise l’action de modification. Les exercices du catalogue restent des références de base."],
  ["program-create", "Créer un programme", "PROGRAMMES", "/programs", ["créer programme", "plans", "objectif"], "Dans Plans, crée un programme puis choisis son objectif, ton niveau et le nombre de séances souhaité. Tu peux ensuite organiser les séances et leurs exercices."],
  ["program-edit", "Modifier une séance de programme", "PROGRAMMES", "/programs", ["modifier séance", "programme", "plans"], "Ouvre le programme puis la séance concernée. Tu peux ajuster les exercices et les paramètres de la séance, puis enregistrer les changements."],
  ["program-reorder", "Réorganiser les exercices d’une séance", "PROGRAMMES", "/programs", ["déplacer exercice", "réorganiser", "6 points"], "Dans l’éditeur de séance, maintiens l’icône à six points d’un exercice puis déplace-le à la position souhaitée. Enregistre ensuite l’ordre de la séance."],
  ["program-add-exercise", "Ajouter un exercice à une séance", "PROGRAMMES", "/programs", ["ajouter exercice", "programme", "séance"], "Depuis l’éditeur d’une séance, utilise Ajouter un exercice, choisis un exercice du catalogue ou de Mes exercices, puis règle les séries, répétitions et le repos."],
  ["program-remove-exercise", "Retirer un exercice d’une séance", "PROGRAMMES", "/programs", ["supprimer exercice", "retirer exercice", "programme"], "Ouvre l’exercice dans l’éditeur de séance puis choisis l’action de suppression. Vérifie la séance avant de l’enregistrer."],
  ["workout-start", "Démarrer une séance", "SÉANCES", "/workout", ["démarrer", "lancer séance", "entraînement"], "Ouvre l’onglet Séance, choisis la séance proposée ou prévue puis appuie sur Démarrer. Traknio affiche l’exercice et la série en cours."],
  ["workout-complete-set", "Valider une série", "SÉANCES", "/workout", ["valider série", "répétitions", "poids"], "Pendant la séance, vérifie les répétitions et la charge puis valide la série. Le repos démarre ensuite et la séance passe à la prochaine étape."],
  ["workout-change-load", "Modifier une charge pendant la séance", "SÉANCES", "/workout", ["poids", "charge", "modifier pendant séance"], "Ouvre les réglages de l’exercice en cours pour ajuster la charge ou les répétitions. La valeur enregistrée est reprise dans l’historique de la séance."],
  ["workout-replace", "Remplacer un exercice en cours de séance", "SÉANCES", "/workout", ["remplacer exercice", "changer exercice", "séance"], "Depuis l’exercice en cours, utilise l’action de remplacement pour choisir une alternative. Confirme le choix pour poursuivre la séance avec le nouvel exercice."],
  ["rest-timer", "Utiliser le chrono de repos", "SÉANCES", "/workout", ["repos", "chrono", "pause", "+15", "-15"], "Après une série validée, le chrono de repos démarre. Les boutons -15 s et +15 s ajustent le temps restant, et le bouton central permet de mettre le chrono en pause ou de le relancer."],
  ["workout-finish", "Terminer une séance", "SÉANCES", "/workout", ["fin séance", "terminer", "valider séance"], "Après la dernière série, ouvre l’étape de fin de séance et valide-la. Le récapitulatif est alors enregistré dans l’historique et la progression."],
  ["progress-period", "Choisir une période de progression", "PROGRESSION", "/progress", ["période", "7 jours", "30 jours", "progrès"], "Dans Progrès, choisis la période disponible pour comparer tes séances, ton volume, tes séries et ta durée sur cet intervalle."],
  ["progress-records", "Comprendre les records et le volume", "PROGRESSION", "/progress", ["records", "volume", "séries", "durée"], "Les cartes de progression s’appuient sur les séances terminées. Le volume correspond aux charges et répétitions enregistrées lorsque ces valeurs sont disponibles."],
  ["history-session", "Consulter le détail d’une séance passée", "HISTORIQUE", "/history", ["historique", "séance terminée", "détail"], "Dans Histo, ouvre une séance terminée pour consulter son statut, ses séries et les valeurs enregistrées pendant l’entraînement."],
  ["evolution-measurements", "Ajouter des mensurations", "MON ÉVOLUTION", "/evolution", ["mensurations", "poids", "tour de taille"], "Dans Mon évolution, ouvre Mes relevés puis ajoute la date et uniquement les mesures que tu souhaites suivre. Les champs sont facultatifs."],
  ["evolution-weight", "Comprendre l’évolution du poids", "MON ÉVOLUTION", "/evolution", ["poids", "graphique", "évolution"], "Le graphique de poids utilise uniquement les relevés confirmés dans Mon évolution. Les anciennes valeurs de profil ne sont pas utilisées comme relevés historiques."],
  ["evolution-photos", "Ajouter une photo de progression", "MON ÉVOLUTION", "/evolution", ["photo", "face", "profil", "dos"], "Dans la galerie privée de Mon évolution, choisis une photo JPEG, PNG ou WebP, son orientation et sa date avant de l’ajouter. Elle reste associée à ton compte."],
  ["watch-pairing", "Appairer la montre Wear OS", "MONTRE", "/watch", ["wear os", "galaxy watch", "appairage", "montre"], "Connecte-toi à Traknio sur le téléphone puis ouvre l’application sur la montre. L’appairage se fait automatiquement avec le téléphone associé."],
  ["watch-workout", "Suivre une séance sur la montre", "MONTRE", "/watch", ["montre", "séries", "repos", "synchronisation"], "Une fois appairée, la montre affiche la série et le repos en cours. Les validations et ajustements sont synchronisés avec la séance du téléphone."],
  ["watch-connection", "Résoudre une synchronisation montre", "MONTRE", "/watch", ["synchronisation", "montre", "connexion"], "Vérifie que le téléphone et la montre utilisent le même compte Traknio et qu’ils sont connectés. Rouvre ensuite Traknio sur les deux appareils pour relancer l’appairage automatique."],
  ["health-connect", "Connecter Health Connect", "SANTÉ", "/settings", ["health connect", "sommeil", "pas", "récupération"], "Dans Réglages, active Health Connect puis accorde uniquement les autorisations proposées. Les données disponibles servent à afficher les repères de récupération dans Traknio."],
  ["spotify-connect", "Connecter Spotify", "CONNECTEURS", "/settings", ["spotify", "musique", "connecteur"], "Dans Réglages, connecte ton compte Spotify pour afficher le lecteur pendant une séance. Traknio utilise ton compte Spotify existant."],
  ["premium-access", "Gérer l’accès Premium", "ABONNEMENT", "/settings", ["premium", "abonnement", "accès"], "L’accès aux fonctions Premium est géré depuis Réglages. Sur Android, les achats et renouvellements passent par Google Play."],
  ["premium-restore", "Restaurer un abonnement Google Play", "ABONNEMENT", "/settings", ["restaurer achat", "google play", "abonnement"], "Connecte le même compte Google Play que celui utilisé pour l’achat, puis ouvre les réglages Traknio pour actualiser ton accès Premium."],
  ["account-settings", "Gérer mon compte Traknio", "COMPTE", "/settings", ["compte", "réglages", "profil"], "Dans Réglages, retrouve ton compte, tes connecteurs et les options disponibles. Les informations personnelles utiles peuvent être modifiées depuis cet espace."],
  ["account-data", "Télécharger ou supprimer mes données", "COMPTE", "/settings", ["données", "export", "suppression compte"], "Les réglages du compte regroupent les actions liées à tes données. Lis l’intitulé de l’action avant de confirmer une exportation ou une suppression."],
  ["ai-program", "Générer un programme avec l’IA", "IA", "/programs", ["ia", "générer programme", "programme personnalisé"], "Depuis Plans, utilise la génération de programme et renseigne les informations demandées. Relis toujours la proposition avant de l’enregistrer dans tes programmes."],
  ["ai-program-limit", "Comprendre la limite de génération IA", "IA", "/programs", ["limite ia", "génération", "programme"], "La génération de programmes est limitée selon ton accès afin de préserver un usage fiable du service. Si une génération est indisponible, réessaie plus tard depuis Plans."],
];

export const ASSISTANT_ARTICLE_PROPOSALS: AssistantArticleProposal[] = proposalRows.map(([id, title, category, routeContext, keywords, content]) => ({
  id,
  title,
  category,
  routeContext,
  keywords,
  content,
}));
