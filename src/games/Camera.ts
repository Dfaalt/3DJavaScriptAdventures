import * as THREE from "three";
import type { MutableRefObject } from "react";

export const updateCamera = (
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
  playerRef: MutableRefObject<THREE.Mesh | null>
) => {
  if (!cameraRef.current || !playerRef.current) return;

  const camera = cameraRef.current;
  const player = playerRef.current;

  const cameraOffset = new THREE.Vector3(0, 3, 8);
  cameraOffset.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

  const targetPosition = player.position.clone().add(cameraOffset);

  camera.position.lerp(targetPosition, 0.1);
  camera.lookAt(player.position);
};
