import React from 'react';

export type BadgeDef = { id: string; name: string; imgUrl?: string; emoji?: string };

export default function Badge({ badge, size = 14 }: { badge: BadgeDef; size?: number }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    marginLeft: 6,
    verticalAlign: 'middle'
  };

  return (
    <span title={badge.name} style={style}>
      {badge.imgUrl ? (
        <img src={badge.imgUrl} alt={badge.name} style={{ width: size, height: size, borderRadius: 2 }} />
      ) : (
        <span style={{ fontSize: size - 2 }}>{badge.emoji || '🔨'}</span>
      )}
    </span>
  );
}
