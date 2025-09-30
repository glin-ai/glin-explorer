'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface RelativeTimeProps {
  timestamp?: number;
  receivedAt?: number;
}

export function RelativeTime({ timestamp, receivedAt }: RelativeTimeProps) {
  const [, setTick] = useState(0);

  // Update every second to keep the "time ago" fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeToUse = timestamp || receivedAt;

  if (!timeToUse) {
    return <span className="text-sm text-muted-foreground">Just now</span>;
  }

  const date = new Date(timeToUse);
  const now = Date.now();
  const diff = now - timeToUse;

  // For very recent blocks (< 60 seconds), show seconds
  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return (
      <span className="text-sm text-muted-foreground">
        {seconds <= 1 ? 'Just now' : `${seconds} secs ago`}
      </span>
    );
  }

  // For older blocks, use date-fns
  return (
    <span className="text-sm text-muted-foreground" title={date.toLocaleString()}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
}