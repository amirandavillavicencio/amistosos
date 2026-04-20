interface TeamContactProps {
  instagram?: string | null;
  phone?: string | null;
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

function normalizeInstagramHandle(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^@+/, '');
}

function normalizePhoneHref(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const keepPlus = raw.startsWith('+');
  const clean = raw.replace(/[\s()\-]/g, '');
  if (!clean) return null;

  return keepPlus ? `+${clean.replace(/^\+/, '')}` : clean;
}

export default function TeamContact({
  instagram,
  phone,
  className = 'mt-2 space-y-1 text-xs text-muted',
  itemClassName,
  labelClassName = 'font-medium text-ink',
  valueClassName
}: TeamContactProps) {
  const instagramHandle = normalizeInstagramHandle(instagram);
  const phoneValue = String(phone || '').trim();
  const phoneHref = normalizePhoneHref(phone);
  const hasContact = Boolean(instagramHandle || phoneValue);

  if (!hasContact) return null;

  return (
    <div className={className}>
      {instagramHandle ? (
        <p className={itemClassName}>
          <span className={labelClassName}>Instagram:</span>{' '}
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            className={valueClassName || 'text-fuchsia-200 hover:underline'}
          >
            @{instagramHandle}
          </a>
        </p>
      ) : null}

      {phoneValue ? (
        <p className={itemClassName}>
          <span className={labelClassName}>Teléfono:</span>{' '}
          {phoneHref ? (
            <a href={`tel:${phoneHref}`} className={valueClassName || 'text-orange-300 hover:underline'}>
              {phoneValue}
            </a>
          ) : (
            <span className={valueClassName}>{phoneValue}</span>
          )}
        </p>
      ) : null}
    </div>
  );
}
