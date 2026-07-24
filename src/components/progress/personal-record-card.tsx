type PersonalRecordCardProps = {
  type: string;
  value: string;
  context: string;
  date?: string | null;
  symbol?: string;
};

export function PersonalRecordCard({ type, value, context, date, symbol = "*" }: PersonalRecordCardProps) {
  return (
    <article className="personal-record-card">
      <span className="personal-record-card__symbol" aria-hidden="true">{symbol}</span>
      <div>
        <p className="eyebrow">{type}</p>
        <h3>{value}</h3>
        <p>{context}</p>
        {date ? <span>{date}</span> : null}
      </div>
    </article>
  );
}
