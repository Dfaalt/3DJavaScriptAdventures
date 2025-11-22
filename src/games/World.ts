import * as THREE from "three";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { createNpcMeshForLevel, type NPC, type GameState } from "./NPC";
import { levelData } from "../components/data/data";

// Helper: posisi spawn random (copy dari kode asli)
const generateRandomSpawnPosition = (
  npcPosition: THREE.Vector3,
  collidables: THREE.Object3D[],
  minDistance: number = 8
): THREE.Vector3 => {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    const testPosition = new THREE.Vector3(x, 1, z);

    const distanceToNPC = testPosition.distanceTo(
      new THREE.Vector3(npcPosition.x, 1, npcPosition.z)
    );
    if (distanceToNPC < minDistance) {
      attempts++;
      continue;
    }

    let tooClose = false;
    for (const collidable of collidables) {
      const collidablePos = new THREE.Vector3(
        collidable.position.x,
        1,
        collidable.position.z
      );
      if (testPosition.distanceTo(collidablePos) < 5) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) return testPosition;
    attempts++;
  }

  return new THREE.Vector3(-8, 1, -8);
};

export const createTree = () => {
  const treeGroup = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
  const trunkMaterial = new THREE.MeshPhongMaterial({
    color: 0xa87c4f,
    emissive: 0x6b4423,
    emissiveIntensity: 0.4,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1;
  trunk.castShadow = true;

  const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
  const leavesMaterial = new THREE.MeshPhongMaterial({
    color: 0x5cb85c,
    emissive: 0x3a8f3a,
    emissiveIntensity: 0.5,
  });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 3;
  leaves.castShadow = true;

  treeGroup.add(trunk);
  treeGroup.add(leaves);

  return treeGroup;
};

// ====== ENVIRONMENT BUILDERS (langsung copy dari Game.tsx) ======

export const buildVillage = (
  scene: THREE.Scene,
  collidablesRef: MutableRefObject<THREE.Object3D[]>
) => {
  for (let i = 0; i < 4; i++) {
    const house = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      new THREE.MeshPhongMaterial({
        color: 0x8b4513,
        emissive: 0x5a2d0a,
        emissiveIntensity: 0.3,
      })
    );
    body.position.y = 1;
    body.castShadow = true;

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 1.5, 4),
      new THREE.MeshPhongMaterial({
        color: 0xa0522d,
        emissive: 0x6b3410,
        emissiveIntensity: 0.3,
      })
    );
    roof.position.y = 2.75;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;

    house.add(body);
    house.add(roof);

    const angle = (i / 4) * Math.PI * 2;
    house.position.set(Math.cos(angle) * 12, 0, Math.sin(angle) * 12);
    house.rotation.y = -angle;
    scene.add(house);
    collidablesRef.current.push(house);
  }

  const well = new THREE.Group();
  const wellBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1, 1.5, 16),
    new THREE.MeshPhongMaterial({
      color: 0x696969,
      emissive: 0x404040,
      emissiveIntensity: 0.2,
    })
  );
  wellBase.position.y = 0.75;
  wellBase.castShadow = true;

  const wellRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.1, 8, 16),
    new THREE.MeshPhongMaterial({ color: 0x8b7355 })
  );
  wellRim.position.y = 1.5;
  wellRim.rotation.x = Math.PI / 2;

  well.add(wellBase);
  well.add(wellRim);
  well.position.set(-10, 0, -10);
  scene.add(well);
  collidablesRef.current.push(well);

  for (let i = 0; i < 12; i++) {
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1, 2),
      new THREE.MeshPhongMaterial({
        color: 0x654321,
        emissive: 0x3d2613,
        emissiveIntensity: 0.2,
      })
    );
    const angle = (i / 12) * Math.PI * 2;
    fence.position.set(Math.cos(angle) * 18, 0.5, Math.sin(angle) * 18);
    fence.rotation.y = -angle + Math.PI / 2;
    fence.castShadow = true;
    scene.add(fence);
    collidablesRef.current.push(fence);
  }

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 3),
    new THREE.MeshPhongMaterial({
      color: 0x8b7355,
      emissive: 0x5a4a35,
      emissiveIntensity: 0.2,
    })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(road);
};

export const buildField = (
  scene: THREE.Scene,
  collidablesRef: MutableRefObject<THREE.Object3D[]>
) => {
  for (let i = 0; i < 30; i++) {
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1.5, 4),
      new THREE.MeshPhongMaterial({
        color: 0x7ec850,
        emissive: 0x5a9438,
        emissiveIntensity: 0.4,
      })
    );
    grass.position.set(
      (Math.random() - 0.5) * 35,
      0.75,
      (Math.random() - 0.5) * 35
    );
    grass.castShadow = true;
    scene.add(grass);
  }

  for (let i = 0; i < 8; i++) {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1 + Math.random()),
      new THREE.MeshPhongMaterial({
        color: 0x808080,
        emissive: 0x404040,
        emissiveIntensity: 0.2,
      })
    );
    // @ts-ignore
    const radius = rock.geometry.parameters.radius as number;
    rock.position.set(
      (Math.random() - 0.5) * 30,
      radius / 2,
      (Math.random() - 0.5) * 30
    );
    rock.castShadow = true;
    scene.add(rock);
    collidablesRef.current.push(rock);
  }

  for (let i = 0; i < 3; i++) {
    const hill = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 6),
      new THREE.MeshPhongMaterial({
        color: 0x6b9f4a,
        emissive: 0x4a7030,
        emissiveIntensity: 0.3,
      })
    );
    hill.position.set(
      (Math.random() - 0.5) * 30,
      1.5,
      (Math.random() - 0.5) * 30
    );
    hill.castShadow = true;
    scene.add(hill);
    collidablesRef.current.push(hill);
  }
};

export const buildLogicForest = (
  scene: THREE.Scene,
  collidablesRef: MutableRefObject<THREE.Object3D[]>
) => {
  for (let i = 0; i < 6; i++) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 6, 8),
      new THREE.MeshPhongMaterial({
        color: 0x4a2511,
        emissive: 0x2d1509,
        emissiveIntensity: 0.3,
      })
    );
    trunk.position.y = 3;
    trunk.castShadow = true;

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(4, 8, 8),
      new THREE.MeshPhongMaterial({
        color: 0x2d5016,
        emissive: 0x1a300d,
        emissiveIntensity: 0.4,
      })
    );
    leaves.position.y = 8;
    leaves.castShadow = true;

    tree.add(trunk);
    tree.add(leaves);

    const angle = (i / 6) * Math.PI * 2;
    tree.position.set(Math.cos(angle) * 15, 0, Math.sin(angle) * 15);
    scene.add(tree);
    collidablesRef.current.push(tree);
  }

  for (let i = 0; i < 15; i++) {
    const mushroom = new THREE.Group();

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: 0xf5f5dc })
    );
    stem.position.y = 0.25;

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshPhongMaterial({
        color: 0x9370db,
        emissive: 0x9370db,
        emissiveIntensity: 0.8,
      })
    );
    cap.position.y = 0.5;
    cap.scale.y = 0.5;

    mushroom.add(stem);
    mushroom.add(cap);

    mushroom.position.set(
      (Math.random() - 0.5) * 30,
      0,
      (Math.random() - 0.5) * 30
    );
    scene.add(mushroom);

    const light = new THREE.PointLight(0x9370db, 0.5, 3);
    light.position.copy(cap.position);
    light.position.y += 0.5;
    mushroom.add(light);
  }

  for (let i = 0; i < 10; i++) {
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 3, 6),
      new THREE.MeshPhongMaterial({
        color: 0x654321,
        emissive: 0x3d2613,
        emissiveIntensity: 0.3,
      })
    );
    root.position.set(
      (Math.random() - 0.5) * 25,
      0.2,
      (Math.random() - 0.5) * 25
    );
    root.rotation.z = Math.random() * 0.5;
    root.castShadow = true;
    scene.add(root);
    collidablesRef.current.push(root);
  }
};

export const buildDungeon = (
  scene: THREE.Scene,
  collidablesRef: MutableRefObject<THREE.Object3D[]>
) => {
  for (let i = 0; i < 8; i++) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(3, 5, 0.5),
      new THREE.MeshPhongMaterial({
        color: 0x2a2a2a,
        emissive: 0x1a1a1a,
        emissiveIntensity: 0.2,
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    wall.position.set(Math.cos(angle) * 18, 2.5, Math.sin(angle) * 18);
    wall.rotation.y = -angle;
    wall.castShadow = true;
    scene.add(wall);
    collidablesRef.current.push(wall);
  }

  for (let i = 0; i < 6; i++) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 4, 8),
      new THREE.MeshPhongMaterial({
        color: 0x3a3a3a,
        emissive: 0x202020,
        emissiveIntensity: 0.2,
      })
    );
    const angle = (i / 6) * Math.PI * 2;
    pillar.position.set(Math.cos(angle) * 12, 2, Math.sin(angle) * 12);
    pillar.castShadow = true;
    scene.add(pillar);
    collidablesRef.current.push(pillar);

    const torch = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshPhongMaterial({
        color: 0xff4500,
        emissive: 0xff4500,
        emissiveIntensity: 1,
      })
    );
    torch.position.copy(pillar.position);
    torch.position.y = 4.5;
    scene.add(torch);

    const torchLight = new THREE.PointLight(0xff4500, 2, 10);
    torchLight.position.copy(torch.position);
    scene.add(torchLight);
  }

  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.2, 2),
        new THREE.MeshPhongMaterial({
          color: (x + z) % 2 === 0 ? 0x1a1a1a : 0x2a2a2a,
          emissive: (x + z) % 2 === 0 ? 0x0a0a0a : 0x151515,
          emissiveIntensity: 0.2,
        })
      );
      tile.position.set(x * 2, 0.1, z * 2);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }
};

export const buildControlRoom = (
  scene: THREE.Scene,
  collidablesRef: MutableRefObject<THREE.Object3D[]>
) => {
  for (let i = 0; i < 8; i++) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 3),
      new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    panel.position.set(Math.cos(angle) * 15, 2, Math.sin(angle) * 15);
    panel.rotation.y = -angle + Math.PI;
    scene.add(panel);
    collidablesRef.current.push(panel);

    const panelLight = new THREE.PointLight(0x00ffff, 1, 8);
    panelLight.position.copy(panel.position);
    scene.add(panelLight);
  }

  for (let i = 0; i < 12; i++) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshPhongMaterial({
        color: 0x4da6ff,
        emissive: 0x4da6ff,
        emissiveIntensity: 0.6,
      })
    );
    cube.position.set(
      (Math.random() - 0.5) * 20,
      2 + Math.random() * 3,
      (Math.random() - 0.5) * 20
    );
    cube.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    scene.add(cube);
  }

  for (let i = 0; i < 16; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 20),
      new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.9,
      })
    );
    line.position.set((i - 8) * 2, 0.05, 0);
    line.receiveShadow = false;
    scene.add(line);
  }

  const glossyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xaaccee,
      emissiveIntensity: 0.3,
      shininess: 100,
    })
  );
  glossyFloor.rotation.x = -Math.PI / 2;
  glossyFloor.position.y = 0.01;
  glossyFloor.receiveShadow = true;
  scene.add(glossyFloor);
};

// ====== LOAD LEVEL ======

type LoadLevelDeps = {
  level: number;
  scene: THREE.Scene;
  playerRef: MutableRefObject<THREE.Mesh | null>;
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  npcsRef: MutableRefObject<NPC[]>;
  collidablesRef: MutableRefObject<THREE.Object3D[]>;
  portalRef: MutableRefObject<THREE.Mesh | null>;
  setGameState: Dispatch<SetStateAction<GameState>>;
};

export const loadLevel = ({
  level,
  scene,
  playerRef,
  cameraRef,
  npcsRef,
  collidablesRef,
  portalRef,
  setGameState,
}: LoadLevelDeps) => {
  // Clear previous level objects
  npcsRef.current = [];
  collidablesRef.current = [];

  const objectsToRemove: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (
      object !== playerRef.current &&
      object.type !== "Light" &&
      object !== scene &&
      object !== cameraRef.current
    ) {
      objectsToRemove.push(object);
    }
  });
  objectsToRemove.forEach((obj) => scene.remove(obj));

  const atmospheres = {
    1: {
      bg: 0xffa366,
      fog: 0xffa366,
      fogDensity: [30, 80],
      groundColor: 0x7ec850,
      ambientIntensity: 2.5,
    },
    2: {
      bg: 0x5ab88c,
      fog: 0x5ab88c,
      fogDensity: [40, 90],
      groundColor: 0x4a9f6f,
      ambientIntensity: 2,
    },
    3: {
      bg: 0x6b4f9e,
      fog: 0x6b4f9e,
      fogDensity: [35, 85],
      groundColor: 0x4a3d6f,
      ambientIntensity: 1.8,
    },
    4: {
      bg: 0x1a1a3e,
      fog: 0x1a1a3e,
      fogDensity: [25, 70],
      groundColor: 0x2d2d5f,
      ambientIntensity: 1.5,
    },
    5: {
      bg: 0xd4e8ff,
      fog: 0xd4e8ff,
      fogDensity: [50, 100],
      groundColor: 0xaaccee,
      ambientIntensity: 3,
    },
  } as const;

  const atmosphere =
    atmospheres[level as keyof typeof atmospheres] || atmospheres[1];
  scene.background = new THREE.Color(atmosphere.bg);
  scene.fog = new THREE.Fog(
    atmosphere.fog,
    atmosphere.fogDensity[0],
    atmosphere.fogDensity[1]
  );

  scene.traverse((object) => {
    if (object instanceof THREE.AmbientLight) {
      object.intensity = atmosphere.ambientIntensity;
    }
  });

  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: atmosphere.groundColor,
    emissive: atmosphere.groundColor,
    emissiveIntensity: 0.2,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 0; i < 8; i++) {
    const tree = createTree();
    const angle = (i / 8) * Math.PI * 2;
    const radius = 15 + Math.random() * 5;
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    scene.add(tree);
    collidablesRef.current.push(tree);
  }

  if (level === 1) buildVillage(scene, collidablesRef);
  else if (level === 2) buildField(scene, collidablesRef);
  else if (level === 3) buildLogicForest(scene, collidablesRef);
  else if (level === 4) buildDungeon(scene, collidablesRef);
  else if (level === 5) buildControlRoom(scene, collidablesRef);

  const npcSpawnPositions: Record<number, THREE.Vector3> = {
    1: new THREE.Vector3(5, 0, 0),
    2: new THREE.Vector3(-5, 0, 3),
    3: new THREE.Vector3(0, 0, -5),
    4: new THREE.Vector3(6, 0, -2),
    5: new THREE.Vector3(0, 0, 5),
  };

  const npcConfig = levelData[level];
  const npc: NPC = {
    name: npcConfig.name,
    position: npcSpawnPositions[level] || new THREE.Vector3(5, 0, 0),
    mesh: createNpcMeshForLevel(level),
    dialog1: npcConfig.dialog1,
    dialog2: npcConfig.dialog2,
    dialog3: npcConfig.dialog3,
    completedDialog: npcConfig.completedDialog,
    objective: npcConfig.objective,
    hint1: npcConfig.hint1,
    hint2: npcConfig.hint2,
    hint3: npcConfig.hint3,
    validator: (code: string, output: string) => {
      if (npcConfig.validator(code, output)) {
        setGameState((prev) => ({
          ...prev,
          questComplete: true,
          portalActive: true,
        }));
        return true;
      }
      return false;
    },
  };

  if (playerRef.current) {
    const spawnPos = generateRandomSpawnPosition(
      npc.position,
      collidablesRef.current
    );
    playerRef.current.position.copy(spawnPos);
    // reset velocity & grounded di luar (Player / Game)
  }

  npc.mesh.position.copy(npc.position);
  scene.add(npc.mesh);
  npcsRef.current.push(npc);

  const portalGeometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
  const portalMaterial = new THREE.MeshPhongMaterial({
    color: 0xaa00ff,
    emissive: 0xaa00ff,
    emissiveIntensity: 0.5,
  });
  const portal = new THREE.Mesh(portalGeometry, portalMaterial);
  portal.position.set(-8, 2, 0);
  portal.rotation.x = Math.PI / 2;
  portal.visible = false;
  scene.add(portal);
  portalRef.current = portal;
};
