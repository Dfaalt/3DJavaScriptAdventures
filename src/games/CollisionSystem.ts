import * as THREE from "three";
import type { NPC } from "./NPC";

export const resolvePlayerCollisions = (
  player: THREE.Mesh,
  originalPosition: THREE.Vector3,
  collidables: THREE.Object3D[],
  npcs: NPC[]
) => {
  let collided = false;

  // Collision dengan environment
  for (const obj of collidables) {
    const distance = player.position.distanceTo(obj.position);
    const collisionRadius = 2.5;
    if (distance < collisionRadius) {
      collided = true;
      break;
    }
  }

  // Collision dengan NPC
  for (const npc of npcs) {
    const distance = player.position.distanceTo(npc.position);
    if (distance < 2) {
      collided = true;
      break;
    }
  }

  if (collided) {
    player.position.copy(originalPosition);
  }
};
