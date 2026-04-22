import { avatarColorClass, getInitials, hasValidImageUrl } from '@/lib/presentation';

interface TeamAvatarProps {
  name: string | null | undefined;
  logoUrl?: string | null;
  sizeClassName?: string;
}

export default function TeamAvatar({ name, logoUrl, sizeClassName = 'h-12 w-12' }: TeamAvatarProps) {
  if (hasValidImageUrl(logoUrl)) {
    return (
      <img
        src={logoUrl || ''}
        alt={`Logo ${name || 'equipo'}`}
        className={`${sizeClassName} rounded-full border border-slate-500 object-cover`}
      />
    );
  }

  const initials = getInitials(name);
  const bgColor = avatarColorClass(name);

  return (
    <div
      aria-label={`Avatar ${name || 'equipo'}`}
      className={`${sizeClassName} ${bgColor} flex items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white`}
    >
      {initials}
    </div>
  );
}
