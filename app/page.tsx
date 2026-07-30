import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BRAND } from "@/src/lib/brand";

const features = [
  {
    title: "Séances guidées",
    copy: "Séries, repos, charges et remplacements restent lisibles pendant l'effort.",
  },
  {
    title: "Wear OS",
    copy: "Valide depuis la montre, garde le rythme et retrouve la séance côté téléphone.",
  },
  {
    title: "État du jour",
    copy: "Sommeil, pas, fréquence cardiaque et récupération donnent le ton avant l'entraînement.",
  },
  {
    title: "Progression",
    copy: "Volume, historique, records et XP donnent une lecture claire de ce qui avance.",
  },
] as const;

const flow = [
  "Connecte ton compte Google",
  "Lance ou génère ton programme",
  "Suis ta séance au téléphone ou à la montre",
  "Analyse ton historique et ta récupération",
] as const;

const metrics = [
  { value: "4", label: "générations IA / mois" },
  { value: "Wear OS", label: "synchro montre" },
  { value: "Health", label: "récupération quotidienne" },
] as const;

export const metadata: Metadata = {
  title: "Traknio - Train smarter. Progress further.",
  description: "Traknio accompagne tes entraînements avec programmes, suivi en séance, récupération et synchronisation Wear OS.",
  alternates: {
    canonical: "/",
  },
};

function StoreBadge({ store }: { store: "google" | "apple" }) {
  return (
    <span className="store-badge is-disabled" aria-disabled="true">
      <span className={`store-badge__icon store-badge__icon--${store}`} aria-hidden="true" />
      <span>
        <small>{store === "google" ? "Bientôt sur" : "À venir sur"}</small>
        <strong>{store === "google" ? "Google Play" : "App Store"}</strong>
      </span>
    </span>
  );
}

export default async function HomePage() {
  const session = await auth().catch(() => null);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <main className="public-site">
      <nav className="public-nav" aria-label="Navigation principale">
        <Link className="public-nav__brand" href="/">
          <Image src="/brand/traknio-logo-mark-exact.png" alt="" width={54} height={54} priority />
          <Image src="/brand/traknio-wordmark-exact.png" alt={BRAND.name} width={214} height={28} priority />
        </Link>
        <div className="public-nav__links">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#montre">Montre</a>
          <Link href="/login">Connexion</Link>
        </div>
      </nav>

      <section className="public-hero" aria-labelledby="public-hero-title">
        <div className="public-hero__copy">
          <p className="public-kicker">Train smarter. Progress further.</p>
          <h1 id="public-hero-title">Ton entraînement, ton rythme, ta progression.</h1>
          <p>
            Traknio réunit programmes, séance guidée, montre Wear OS, Health Connect, Spotify et historique dans une expérience
            pensée pour rester fluide pendant l'effort.
          </p>
          <div className="public-actions" aria-label="Téléchargement application">
            <StoreBadge store="google" />
            <StoreBadge store="apple" />
          </div>
          <Link className="public-login-link" href="/login">
            Accéder à la version privée
          </Link>
        </div>

        <div className="public-hero__visual" aria-hidden="true">
          <div className="public-phone-frame">
            <Image
              src="/brand/traknio-launch-reference.png"
              alt=""
              width={224}
              height={397}
              className="public-phone-frame__image"
              priority
            />
          </div>
          <div className="public-status-card public-status-card--top">
            <span>Récupération</span>
            <strong>84%</strong>
          </div>
          <div className="public-status-card public-status-card--bottom">
            <span>Séance active</span>
            <strong>Full Body</strong>
          </div>
        </div>
      </section>

      <section className="public-metrics" aria-label="Résumé Traknio">
        {metrics.map((metric) => (
          <div key={metric.label} className="public-metric">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section id="fonctionnalites" className="public-section public-feature-section">
        <div className="public-section__head">
          <p className="public-kicker">Application mobile</p>
          <h2>Tout ce qui compte pendant une séance.</h2>
        </div>
        <div className="public-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="public-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="montre" className="public-section public-product-section">
        <div className="public-product-copy">
          <p className="public-kicker">Téléphone + montre</p>
          <h2>La séance reste synchronisée, même quand tu ne touches pas au téléphone.</h2>
          <p>
            La montre valide les séries, ajuste les repos et garde le tempo. Le téléphone conserve le détail complet :
            charges, remplacements, Spotify, résumé et historique.
          </p>
          <ol className="public-flow">
            {flow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="public-device-wall" aria-label="Aperçus de l'application Traknio">
          <Image
            src="/brand/traknio-login-reference.png"
            alt="Aperçu de l'application mobile Traknio"
            width={260}
            height={520}
            className="public-device-wall__phone"
          />
          <Image
            src="/brand/traknio-watch-reference.png"
            alt="Aperçu de la montre Traknio"
            width={260}
            height={274}
            className="public-device-wall__watch"
          />
        </div>
      </section>

      <section className="public-final-cta">
        <Image src="/brand/traknio-logo-site.png" alt={`${BRAND.name} - ${BRAND.tagline}`} width={769} height={168} />
        <p>Publication Play Store en préparation. Les boutons de téléchargement seront activés dès que l'application sera disponible.</p>
        <div className="public-actions public-actions--center">
          <StoreBadge store="google" />
          <StoreBadge store="apple" />
        </div>
      </section>

      <footer className="public-footer">
        <Link href="/privacy">Confidentialité</Link>
        <Link href="/terms">Conditions</Link>
        <Link href="/data-deletion">Suppression des données</Link>
      </footer>
    </main>
  );
}
