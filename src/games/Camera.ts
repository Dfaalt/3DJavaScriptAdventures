import * as THREE from "three";
import type { MutableRefObject } from "react";

export const updateCamera = (
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
  playerRef: MutableRefObject<THREE.Mesh | null>
) => {
  if (!cameraRef.current || !playerRef.current) return;

  const camera = cameraRef.current;
  const player = playerRef.current;

  // 🎮 OFFSET GAYA GAME AAA:
  // x : agak ke kanan sedikit (kamera bahu kanan)
  // y : agak di atas kepala
  // z : belakang player, tapi lebih dekat (4 bukannya 8)
  const cameraOffset = new THREE.Vector3(1.2, 2.2, 4);

  // putar offset sesuai rotasi player (biar selalu di belakang)
  cameraOffset.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

  // posisi target kamera
  const targetPosition = player.position.clone().add(cameraOffset);

  // lerp biar smooth tapi responsif (0.18 lebih “lengket” ke player)
  camera.position.lerp(targetPosition, 0.18);

  // kamera lihat sedikit di atas badan player (bukan kaki)
  const lookAtTarget = player.position.clone();
  lookAtTarget.y += 1.5; // kira-kira dada/kepala

  camera.lookAt(lookAtTarget);
};
