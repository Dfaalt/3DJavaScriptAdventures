import * as THREE from "three";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { NPC, GameState } from "./NPC";
import { loadLevel } from "./World";
import { finalDialog } from "../components/data/data";

type InteractionCommon = {
  playerRef: MutableRefObject<THREE.Mesh | null>;
  portalRef: MutableRefObject<THREE.Mesh | null>;
  npcsRef: MutableRefObject<NPC[]>;
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
};

export const checkInteractions = (
  params: InteractionCommon & {
    showPortalHintRef: MutableRefObject<boolean>;
    canEnterPortalRef: MutableRefObject<boolean>;
  }
) => {
  const {
    playerRef,
    portalRef,
    gameStateRef,
    setGameState,
    showPortalHintRef,
    canEnterPortalRef,
  } = params;

  if (!playerRef.current) return;

  const state = gameStateRef.current;

  if (portalRef.current && state.portalActive) {
    const distance = playerRef.current.position.distanceTo(
      portalRef.current.position
    );
    if (distance < 4) {
      showPortalHintRef.current = true;
      canEnterPortalRef.current = true;
      setGameState((prev) => ({
        ...prev,
        showPortalHint: true,
        canEnterPortal: true,
      }));
    } else {
      showPortalHintRef.current = false;
      canEnterPortalRef.current = false;
      setGameState((prev) => ({
        ...prev,
        showPortalHint: false,
        canEnterPortal: false,
      }));
    }
  } else {
    showPortalHintRef.current = false;
    canEnterPortalRef.current = false;
    setGameState((prev) => ({
      ...prev,
      showPortalHint: false,
      canEnterPortal: false,
    }));
  }
};

export const handleInteraction = ({
  playerRef,
  npcsRef,
  setGameState,
}: Pick<InteractionCommon, "playerRef" | "npcsRef" | "setGameState">) => {
  if (!playerRef.current) return;

  for (const npc of npcsRef.current) {
    const distance = playerRef.current.position.distanceTo(npc.position);
    if (distance < 3) {
      setGameState((prev) => ({
        ...prev,
        showDialog: true,
        currentNPC: npc,
      }));
      return;
    }
  }
};

export const handlePortalEntry = (
  params: InteractionCommon & {
    portalCooldownRef: MutableRefObject<boolean>;
    sceneRef: MutableRefObject<THREE.Scene | null>;
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
    collidablesRef: MutableRefObject<THREE.Object3D[]>;
  }
) => {
  const {
    gameStateRef,
    setGameState,
    portalCooldownRef,
    sceneRef,
    playerRef,
    npcsRef,
    portalRef,
    cameraRef,
    collidablesRef,
  } = params;

  const state = gameStateRef.current;
  if (!state.canEnterPortal || portalCooldownRef.current) return;

  portalCooldownRef.current = true;

  // Next level
  if (state.currentLevel < 5) {
    const nextLevel = state.currentLevel + 1;
    setGameState({
      currentLevel: nextLevel,
      questComplete: false,
      showDialog: false,
      showEditor: false,
      currentNPC: null,
      portalActive: false,
      showPortalHint: false,
      canEnterPortal: false,
      dialogStage: 1,
      failureCount: 0,
      objectiveRevealed: false,
    });

    if (sceneRef.current) {
      loadLevel({
        level: nextLevel,
        scene: sceneRef.current,
        playerRef,
        cameraRef,
        npcsRef,
        collidablesRef,
        portalRef,
        setGameState,
      });
    }
  } else {
    // Final dialog (copy dari kode asli)
    setGameState((prev) => ({
      ...prev,
      showDialog: true,
      currentNPC: {
        name: finalDialog.name,
        position: new THREE.Vector3(0, 0, 0),
        mesh: new THREE.Group(),
        dialog1: finalDialog.dialog,
        dialog2: finalDialog.dialog,
        dialog3: finalDialog.dialog,
        completedDialog: finalDialog.dialog,
        objective: finalDialog.objective,
        hint1: finalDialog.hint1,
        hint2: finalDialog.hint2,
        hint3: finalDialog.hint3,
        validator: finalDialog.validator,
      },
    }));
  }

  setTimeout(() => {
    portalCooldownRef.current = false;
  }, 1000);
};
