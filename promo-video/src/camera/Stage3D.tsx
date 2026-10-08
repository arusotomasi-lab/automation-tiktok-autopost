import React from 'react';
import { AbsoluteFill } from 'remotion';

export type Cam = { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number };

/**
 * A 3D world viewed by a virtual camera. World origin is the screen centre.
 * cam.z > 0 dollies the camera forward (world comes closer); rx/ry tilt and orbit.
 */
export const Stage3D: React.FC<{ cam: Cam; perspective?: number; originY?: string; children: React.ReactNode }> = ({
  cam, perspective = 1500, originY = '46%', children,
}) => {
  const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = cam;
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: `50% ${originY}`, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
          transformStyle: 'preserve-3d',
          transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translate3d(${-x}px, ${-y}px, 0px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** An object placed at world position (x, y, z), centred on that point. */
export const Obj: React.FC<{
  x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; scale?: number;
  opacity?: number; filter?: string; children: React.ReactNode; style?: React.CSSProperties;
}> = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1, opacity = 1, filter, children, style }) => (
  <div
    style={{
      position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d',
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale}) translate(-50%, -50%)`,
      opacity, filter, ...style,
    }}
  >
    {children}
  </div>
);
