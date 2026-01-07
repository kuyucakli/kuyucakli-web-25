import { useEffect, useRef } from "react";
import * as THREE from "three";

export function useSmoothCamera(orbitRadius = 1.5, smoothing = 0.06) {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const LIMITS = { x: 0.35, y: 0.25 };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getCameraTransform = (time: number) => {
    target.current.x += (mouse.current.x * 1.2 - target.current.x) * smoothing;
    target.current.y +=
      (mouse.current.y * 0.6 + 1.4 - target.current.y) * smoothing;

    target.current.x = THREE.MathUtils.clamp(
      target.current.x,
      -LIMITS.x,
      LIMITS.x
    );

    target.current.y = THREE.MathUtils.clamp(
      target.current.y,
      1.4 - LIMITS.y,
      1.4 + LIMITS.y
    );

    const orbitSpeed = 0.15;
    const orbitAmount = orbitRadius * 0.35;

    const x = target.current.x + Math.sin(time * orbitSpeed) * orbitAmount;
    const y = target.current.y;
    const z = orbitRadius + Math.cos(time * orbitSpeed) * orbitAmount;

    return {
      position: { x, y, z },
      lookAt: { x: 0, y: 0, z: 0 },
    };
  };

  return getCameraTransform;
}
