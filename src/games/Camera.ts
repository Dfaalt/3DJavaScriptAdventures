import * as THREE from "three";
import type { MutableRefObject } from "react";

export const updateCamera = (
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
  playerRef: MutableRefObject<THREE.Mesh | null>
) => {
  if (!cameraRef.current || !playerRef.current) return;

  const camera = cameraRef.current;
  const player = playerRef.current;

  // === 1. Offset kamera seperti game AAA (sedikit ke kanan, agak tinggi, agak jauh) ===
  // x  : geser sedikit ke samping (over-the-shoulder)
  // y  : tinggi kamera
  // z  : jarak di belakang player
  const baseOffset = new THREE.Vector3(1.5, 3.5, 7.5);

  // Putar offset mengikuti rotasi player (kamera selalu di belakang player)
  const rotatedOffset = baseOffset.clone();
  rotatedOffset.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

  // Posisi kamera yang diinginkan
  const desiredPosition = player.position.clone().add(rotatedOffset);

  // === 2. Clamp jarak kamera supaya tidak terlalu dekat / jauh ===
  const minDistance = 4;
  const maxDistance = 9;

  const fromPlayerToCam = desiredPosition.clone().sub(player.position);
  const distance = fromPlayerToCam.length();

  if (distance < minDistance || distance > maxDistance) {
    const clampedDistance = THREE.MathUtils.clamp(
      distance,
      minDistance,
      maxDistance
    );
    fromPlayerToCam.setLength(clampedDistance);
  }

  const finalTargetPos = player.position.clone().add(fromPlayerToCam);

  // === 3. Smooth follow (spring effect) ===
  const followSmoothness = 0.12; // makin besar makin nempel, makin kecil makin lambat
  camera.position.lerp(finalTargetPos, followSmoothness);

  // === 4. Look at ke "kepala" player biar lebih natural ===
  const lookTarget = player.position.clone();
  lookTarget.y += 1.6; // kira-kira tinggi kepala
  camera.lookAt(lookTarget);
};
