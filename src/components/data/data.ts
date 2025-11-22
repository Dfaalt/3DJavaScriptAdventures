export interface LevelNPC {
  name: string;
  dialog1: string;
  dialog2: string;
  dialog3: string;
  completedDialog: string;
  objective: string;
  hint1: string; // Subtle hint
  hint2: string; // More obvious hint
  hint3: string; // Very direct hint
  validator: (code: string, output: string) => boolean;
}

export const levelData: Record<number, LevelNPC> = {
  1: {
    name: "Elder Rowan",
    dialog1: "Ah, traveler! Welcome to Sunrise Village. Calm winds, warm soil… yet something feels off, doesn't it? The sun rises twice some mornings, the river flows backward every third hour. The Script that governs our land grows fragile.",
    dialog2: "I've seen your face before, though I swear we've never met. Strange… like a memory I've forgotten. The Script reacts strongly around you, as if recognizing an old friend.",
    dialog3: "The Script is weakening. To wield it safely, you must learn the First Rune—the Rune of Voice, which lets you speak existence into the world. Try invoking your identity.",
    completedDialog: "Well done! The Script acknowledges your voice. The First Rune is yours. The portal to the next realm has opened.",
    objective: "Use the First Rune to speak your name into existence",
    hint1: "The First Rune requires you to speak... perhaps there's a way to make the Script listen to your voice?",
    hint2: "Think about how you might log or print something to make it visible in the world. The Script responds to console commands.",
    hint3: "Try using console.log('Your Name') to invoke your identity",
    validator: (code: string, output: string) => {
      return code.includes("console.log") && output.length > 0;
    }
  },
  2: {
    name: "Sage Marrelin",
    dialog1: "Traveler… the fields whisper of your coming. The crops sprout twice, beasts appear without tracks, and even time bends. The Script is storing remnants of past days—like… variables overflowing.",
    dialog2: "When I look at you, I sense two selves overlapping. As if the world remembers a version of you that hasn't existed yet.",
    dialog3: "To stabilize this place, you must learn the Rune of Holding—the rune that stores essence for later use. Channel the Script. Bind something to it.",
    completedDialog: "The Rune of Holding is bound. Reality bends to your will. The path forward opens.",
    objective: "Learn the Rune of Holding to store essence",
    hint1: "The Rune of Holding captures essence and keeps it safe for later. You need a container of some kind.",
    hint2: "In the Script, essence can be stored using special binding words. Think about how you might create a container named 'power'.",
    hint3: "Create a variable using: let power = 10",
    validator: (code: string) => {
      return code.includes("power") && (code.includes("let") || code.includes("const") || code.includes("var"));
    }
  },
  3: {
    name: "Ranger Thalen",
    dialog1: "Stay alert, traveler. Paths twist endlessly here. I once walked forward for hours, only to return where I started. The forest is caught in a repeating Script.",
    dialog2: "You carry an echo. A rhythm. Like footsteps overlapping with your own… but ahead of you. If the future can touch the present… then maybe you aren't as simple as you believe.",
    dialog3: "To navigate this forest, you must master the Rune of Order—loops that command repetition. Only then will the forest acknowledge you.",
    completedDialog: "The forest yields. Your loop broke the cycle. The way is clear.",
    objective: "Master the Rune of Order to command repetition",
    hint1: "The forest repeats endlessly. Perhaps you need to command repetition yourself to break the cycle?",
    hint2: "The Rune of Order uses structures that repeat actions multiple times. Look for patterns that count or iterate.",
    hint3: "Create a loop: for(let i=1; i<=5; i++) console.log(i)",
    validator: (code: string) => {
      return (code.includes("for") || code.includes("while")) && (code.includes("console.log") || code.includes("i"));
    }
  },
  4: {
    name: "Chrono-Warden",
    dialog1: "Traveler, you've come far. This castle lies between seconds—broken shards of time stitched together. Mistakes in the Script fester here.",
    dialog2: "I have guarded the fractures for centuries, but recently… I've seen another wanderer. Someone who looks like you. Someone… fractured.",
    dialog3: "If time repeats, errors repeat with it. If you cannot fix them… the loop will swallow you whole. Prove you can repair a corrupted Script fragment.",
    completedDialog: "The corruption is cleansed. Time flows true once more. But the final fracture awaits…",
    objective: "Repair the corrupted Script fragment",
    hint1: "Something in the Script is broken. The words don't match... look carefully at the names being used.",
    hint2: "There's a mismatch between what's declared and what's being called. One name is spelled wrong.",
    hint3: "Fix the broken code: let nmae = 'hero'; console.log(name); - Change 'nmae' to 'name'",
    validator: (code: string) => {
      return code.includes("name") && code.includes("console.log") && !code.includes("nmae");
    }
  },
  5: {
    name: "??? (Your Future Self)",
    dialog1: "So you finally made it. I hoped you would. I… am you. Or rather, what remains of you. I tried to stop the collapse and became trapped in the rift. I sent memories back—echoes… but you surpassed me.",
    dialog2: "The Script responds to you more than it ever did to me. You're stronger. Wiser. And now… you must finish what I couldn't. Create the Rune of Creation itself. Only then will the loop break.",
    dialog3: "If you master creation, you can rewrite fate—not just for the world… but for both versions of us. Break the loop. Write the spell.",
    completedDialog: "The loop is broken. Time flows forward. You are free… we are free. The world is saved.",
    objective: "Create the Rune of Creation to rewrite fate",
    hint1: "The ultimate Rune... one that creates reusable spells. You need to forge something that can be invoked again and again.",
    hint2: "Think about creating a named spell that accepts input and produces output. The Script uses the word 'function' for this.",
    hint3: "Create a function: function greet(name) { return 'Greetings, ' + name; }",
    validator: (code: string) => {
      return code.includes("function greet") && code.includes("return") && code.includes("name");
    }
  }
};

export const finalDialog = {
  name: "Arden (Timebound Adventurer)",
  dialog: "The temporal fracture closes. Two timelines merge into one. You are no longer trapped. You are whole. The Script obeys you now—past, present, and future. 🎉 CONGRATULATIONS – YOU COMPLETED THE TIMEBOUND ADVENTURE!",
  objective: "",
  hint1: "",
  hint2: "",
  hint3: "",
  validator: () => false
};
