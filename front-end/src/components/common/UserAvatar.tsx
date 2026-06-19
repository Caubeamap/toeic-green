"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  alt: string;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
  initials: string;
};

export function UserAvatar({
  alt,
  avatarUrl,
  className,
  imageClassName,
  initials
}: UserAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const baseClassName = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-on-primary shadow-sm",
    className
  );
  const shouldShowImage = avatarUrl && failedAvatarUrl !== avatarUrl;

  if (shouldShowImage) {
    return (
      <span className={baseClassName}>
        {/* User avatars are already small immutable R2 objects; native img avoids dynamic remote-pattern coupling. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          decoding="async"
          loading="lazy"
          onError={() => setFailedAvatarUrl(avatarUrl || null)}
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return <span className={baseClassName}>{initials}</span>;
}
