'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/api';

const FALLBACK_SRC = '/images/food/placeholder.png';

interface DishImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function DishImage({
  src,
  alt,
  className = 'object-cover',
  sizes,
  priority = false,
}: DishImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src) || FALLBACK_SRC;
  const imageSrc = failed ? FALLBACK_SRC : resolved;
  const isRemote = /^https?:\/\//i.test(imageSrc);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={isRemote}
      onError={() => setFailed(true)}
    />
  );
}
