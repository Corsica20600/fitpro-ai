import Image from "next/image";
import Link from "next/link";

type SessionCardProps = {
  href: string;
  title: string;
  dateLabel: string;
  statusLabel: string;
  durationLabel: string;
  volumeLabel: string;
  exerciseCount: number;
  setsCount: number;
  muscles: string[];
  image?: string | null;
  recordLabel?: string | null;
};

export function SessionCard({
  href,
  title,
  dateLabel,
  statusLabel,
  durationLabel,
  volumeLabel,
  exerciseCount,
  setsCount,
  muscles,
  image,
  recordLabel,
}: SessionCardProps) {
  return (
    <Link href={href} className="history-session-card">
      {image ? (
        <Image src={image} alt={title} width={900} height={420} className="history-session-card__image" />
      ) : (
        <span className="history-session-card__fallback" aria-hidden="true" />
      )}
      <div className="history-session-card__body">
        <p className="eyebrow">{dateLabel} · {statusLabel}</p>
        <h2>{title}</h2>
        <div className="history-session-card__metrics">
          <span>{volumeLabel}</span>
          <span>{durationLabel}</span>
          <span>{exerciseCount} exercices</span>
          <span>{setsCount} séries</span>
        </div>
        {muscles.length > 0 ? (
          <div className="chips">
            {muscles.map((muscle) => <span key={muscle} className="chip">{muscle}</span>)}
          </div>
        ) : null}
        {recordLabel ? <span className="chip warning">{recordLabel}</span> : null}
      </div>
    </Link>
  );
}
