import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { NPC } from "./NPC";
import { resolvePlayerCollisions } from "./CollisionSystem";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ====== ANIMATION STATE (GLOBAL UNTUK PLAYER) ======
let playerMixer: THREE.AnimationMixer | null = null;
let idleAction: THREE.AnimationAction | null = null;
let walkAction: THREE.AnimationAction | null = null;
let currentAction: THREE.AnimationAction | null = null;

const switchAction = (next: THREE.AnimationAction | null) => {
  if (!next || next === currentAction) return;

  next.reset();
  next.fadeIn(0.15);

  if (currentAction) {
    currentAction.fadeOut(0.15);
  }

  next.play();
  currentAction = next;
};

// ====== CREATE PLAYER MESH ======
export const createPlayerMesh = () => {
  // Box = collider & anchor player (tak kelihatan)
  const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
  const playerMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0, // collider invisible
  });

  const player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.castShadow = false;
  player.receiveShadow = false;

  const loader = new GLTFLoader();
  loader.load(
    "/models/Adventurer.glb",
    (gltf) => {
      console.log("Adventurer GLB loaded:", gltf);

      const model = gltf.scene;

      // 🔁 helper: convert material lama -> MeshBasicMaterial tapi tetap pakai warna/tekstur asli
      const convertMaterial = (oldMat: any) => {
        if (!oldMat) return oldMat;

        const params: any = {};

        if (oldMat.map) {
          params.map = oldMat.map;
          params.color = oldMat.color
            ? oldMat.color.clone()
            : new THREE.Color(0xffffff);

          if (params.map) {
            params.map.encoding =
              (THREE as any).SRGBColorSpace ?? THREE.sRGBEncoding;
            params.map.needsUpdate = true;
          }
        } else if (oldMat.color) {
          params.color = oldMat.color.clone();
        } else {
          params.color = new THREE.Color(0xffffff);
        }

        return new THREE.MeshBasicMaterial(params);
      };

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (Array.isArray(child.material)) {
            child.material = child.material.map((m: any) => convertMaterial(m));
          } else {
            child.material = convertMaterial(child.material);
          }
        }
      });

      // ====== ANIMATION SETUP ======
      if (gltf.animations && gltf.animations.length > 0) {
        playerMixer = new THREE.AnimationMixer(model);

        const clips = gltf.animations;

        // cari clip yang namanya mengandung "idle" & "walk/run"
        const idleClip =
          clips.find((c) => c.name.toLowerCase().includes("idle")) ?? clips[0];

        const walkClip =
          clips.find((c) => c.name.toLowerCase().includes("walk")) ||
          clips.find((c) => c.name.toLowerCase().includes("run")) ||
          null;

        if (idleClip) {
          idleAction = playerMixer.clipAction(idleClip);
        }
        if (walkClip) {
          walkAction = playerMixer.clipAction(walkClip);
        }

        // default: idle jalan dulu
        if (idleAction) {
          idleAction.play();
          currentAction = idleAction;
        }
      }

      // posisikan model di dalam collider
      model.position.set(0, -1, 0);
      model.scale.set(1, 1, 1);

      model.rotation.y = Math.PI;

      player.add(model);
    },
    undefined,
    (err) => {
      console.error("Gagal load Adventurer.glb:", err);
    }
  );

  return player;
};

// ====== DIPANGGIL DARI Game.tsx SETIAP FRAME ======
export const updatePlayerAnimation = (delta: number, isMoving: boolean) => {
  if (!playerMixer) return;

  playerMixer.update(delta);

  if (isMoving) {
    if (walkAction) switchAction(walkAction);
  } else {
    if (idleAction) switchAction(idleAction);
  }
};

// ====== MOVEMENT (SAMA SEPERTI SEBELUMNYA) ======
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

  // Collision detection
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
  player.position.x = Math.max(
    -boundary,
    Math.min(boundary, player.position.x)
  );
  player.position.z = Math.max(
    -boundary,
    Math.min(boundary, player.position.z)
  );
};
