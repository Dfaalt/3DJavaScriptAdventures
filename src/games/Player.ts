import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { NPC } from "./NPC";
import { resolvePlayerCollisions } from "./CollisionSystem";

export const createPlayerMesh = () => {
  const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
  const playerMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5,
  });
  const player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.castShadow = true;
  return player;
};

type UpdatePlayerDeps = {
  playerRef: MutableRefObject<THREE.Mesh | null>;
  collidablesRef: MutableRefObject<THREE.Object3D[]>;
  npcsRef: MutableRefObject<NPC[]>;
  keysPressed: MutableRefObject<Record<string, boolean>>;
  playerVelocity: MutableRefObject<THREE.Vector3>;
  isGrounded: MutableRefObject<boolean>;
};

export const updatePlayer = ({
  playerRef,
  collidablesRef,
  npcsRef,
  keysPressed,
  playerVelocity,
  isGrounded,
}: UpdatePlayerDeps) => {
  if (!playerRef.current) return;

  const player = playerRef.current;
  const moveSpeed = 0.1;
  const rotateSpeed = 0.05;

  // Rotation
  if (keysPressed.current["a"]) {
    player.rotation.y += rotateSpeed;
  }
  if (keysPressed.current["d"]) {
    player.rotation.y -= rotateSpeed;
  }

  // Movement in player's local direction
  const direction = new THREE.Vector3(0, 0, 0);

  if (keysPressed.current["w"]) {
    direction.z -= moveSpeed;
  }
  if (keysPressed.current["s"]) {
    direction.z += moveSpeed * 0.5; // Slower backwards
  }

  // Apply rotation to movement direction
  direction.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

  // Store original position for collision detection
  const originalPosition = player.position.clone();
  player.position.add(direction);

  // Collision detection (dipindah ke sistem terpisah)
  resolvePlayerCollisions(
    player,
    originalPosition,
    collidablesRef.current,
    npcsRef.current
  );

  // Simple gravity
  if (!isGrounded.current) {
    playerVelocity.current.y -= 0.01;
  }
  player.position.y += playerVelocity.current.y;

  // Ground collision
  if (player.position.y <= 1) {
    player.position.y = 1;
    playerVelocity.current.y = 0;
    isGrounded.current = true;
  }

  // Boundary check
  const boundary = 20;
  player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
  player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));
};
