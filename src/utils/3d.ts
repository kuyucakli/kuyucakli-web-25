import { Euler, Vector3 } from "three";

export function computeRollingState(
  x: number,
  lastX: number,
  y: number,
  radius: number
) {
  const dx = x - lastX;
  const rotationZ = -(dx / radius);

  return {
    position: new Vector3(x, y, 0),
    rotation: new Euler(0, 0, rotationZ, "XYZ"),
    nextLastX: x,
  };
}

export function createRollingMotionWith(
  fn: (arg: number, speed?: number, amp?: number) => number,
  radius = 0.5,
  speed = 1,
  amplitude = 0.5
) {
  let lastX = 0;

  return (arg: number, currentY: number) => {
    const x = fn(arg, speed, amplitude);
    const { position, rotation, nextLastX } = computeRollingState(
      x,
      lastX,
      currentY,
      radius
    );
    lastX = nextLastX;
    return { position, rotation };
  };
}

const sinX = (elapsed: number, speed = 1, amp = 0.5) =>
  Math.sin(elapsed * speed) * amp;
export const createRollingMotion = (radius = 0.5, amplitude = 0.5, speed = 1) =>
  createRollingMotionWith(sinX, radius, speed, amplitude);

const directX = (posX: number) => posX;
export const createRollingMotionByPos = (radius = 0.5) =>
  createRollingMotionWith(directX, radius);
