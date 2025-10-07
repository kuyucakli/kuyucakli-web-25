import { useEffect, useRef } from "react";

export function useSmoothCamera(orbitRadius = 2.5, smoothing = 0.05) {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1; // [-1,1]
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /**
   * Call this each frame, passing elapsed time (clock.getElapsedTime())
   * Returns: { position: THREE.Vector3, lookAt: THREE.Vector3 }
   */
  const getCameraTransform = (time: number) => {
    // Smooth interpolation
    target.current.x += (mouse.current.x * 3 - target.current.x) * smoothing;
    target.current.y +=
      (mouse.current.y * 1.5 + 1.4 - target.current.y) * smoothing;

    // Compute camera position
    const x = target.current.x + Math.sin(time * 0.4) * orbitRadius;
    const y = target.current.y;
    const z = Math.cos(time * 0.4) * orbitRadius;

    return {
      position: { x, y, z },
      lookAt: { x: 0, y: 0, z: 0 },
    };
  };

  return getCameraTransform;
}
