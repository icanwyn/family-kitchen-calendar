import type { FamilyMember } from "@/lib/types";
import { avatarSrc } from "@/lib/avatars";

interface AvatarProps {
  member: Pick<FamilyMember, "name" | "color" | "avatarEmoji" | "avatarImage">;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-xl",
  xl: "h-16 w-16 text-2xl",
};

const imgSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({
  member,
  size = "md",
  showName = false,
  className = "",
}: AvatarProps) {
  const src = avatarSrc(member.avatarImage);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium shadow-sm ring-2 ring-white ${sizes[size]}`}
        style={
          src
            ? { backgroundColor: "#e2e8f0" }
            : { backgroundColor: `${member.color}22`, color: member.color }
        }
        title={member.name}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={member.name}
            width={imgSizes[size]}
            height={imgSizes[size]}
            className="h-full w-full object-cover"
          />
        ) : (
          member.avatarEmoji || member.name.charAt(0).toUpperCase()
        )}
      </span>
      {showName && (
        <span className="text-sm font-medium text-slate-700">{member.name}</span>
      )}
    </div>
  );
}

export function MemberDot({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}
