import { world } from "@minecraft/server";
import type { Vector3 } from "@minecraft/server";

interface RegionProtect {
  [key: string]: Vector3;
}

const REGION_PROTECT_BLCOK = "minecraft:diamond_block";
const KEY = "key";
const R = 5;
let storage: RegionProtect | null = null;
const doorTypeId = "minecraft:wooden_door";

world.afterEvents.worldInitialize.subscribe((param) => {
  const val = world.scoreboard.getObjective(KEY);
  if (!val) {
    world.scoreboard.addObjective(KEY, "{}");
    storage = {};
  } else {
    storage = JSON.parse(val.displayName);
  }

  world.sendMessage("init");
});

function generate_outline_boundary({ x, y, z }: Vector3) {
  return {
    lbb: {
      x: x - R,
      y: y - R,
      z: z - R,
    },
    rub: {
      x: x + R,
      y: y + R,
      z: z + R,
    },
  };
}

function generate_outline(pos: Vector3) {
  return [
    {
      begin: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z - R,
      },
      end: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z - R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z - R,
      },
      end: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z - R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z + R,
      },
      end: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z + R,
      },
      end: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z - R,
      },
      end: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z - R,
      },
      end: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z - R,
      },
      end: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z - R,
      },
      end: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z - R,
      },
      end: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z - R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z - R,
      },
      end: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z - R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x - R,
        y: pos.y - R,
        z: pos.z + R,
      },
      end: {
        x: pos.x - R,
        y: pos.y + R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
    {
      begin: {
        x: pos.x + R,
        y: pos.y - R,
        z: pos.z + R,
      },
      end: {
        x: pos.x + R,
        y: pos.y + R,
        z: pos.z + R,
      },
      block: "minecraft:red_stained_glass",
    },
  ];
}

function isBoundary(pos: Vector3, bpos: Vector3) {
  const { lbb, rub } = generate_outline_boundary({ ...pos, y: pos.y + R });
  return lbb.x <= bpos.x && bpos.x <= rub.x && lbb.y <= bpos.y && bpos.y <= rub.y && lbb.z <= bpos.z && bpos.z <= rub.z;
}

world.afterEvents.playerPlaceBlock.subscribe((param) => {
  if (!storage) {
    return;
  }
  if (param.dimension.id !== "minecraft:overworld") {
    return;
  }
  // world.sendMessage(`${param.dimension.id} ${param.block.typeId}`);

  if (param.block.typeId === REGION_PROTECT_BLCOK) {
    for (const key of Object.keys(storage)) {
      const pos = storage[key];

      if (isBoundary(pos, param.block.location)) {
        world.sendMessage("근처 건차가 존재합니다.");
        return;
      }
    }
    storage[param.player.id] = param.block.location as Vector3;
    world.scoreboard.removeObjective(KEY);
    world.scoreboard.addObjective(KEY, JSON.stringify(storage));

    // fills(param.dimension.fillBlocks, param.block.location);
    generate_outline({ ...param.block.location, y: param.block.location.y + R }).map(({ begin, end, block }) =>
      param.dimension.fillBlocks(begin, end, block)
    );
  }
});

world.beforeEvents.playerInteractWithBlock.subscribe((param) => {
  if (!storage) {
    return;
  }
  if (param.block.typeId === doorTypeId) {
    for (const key of Object.keys(storage)) {
      const pos = storage[key];

      if (isBoundary(pos, param.block.location)) {
        if (key !== param.player.id) {
          param.cancel = true;
        }
        return;
      }
    }
  }
});

world.beforeEvents.playerBreakBlock.subscribe((param) => {
  if (!storage) {
    return;
  }
  const bpos = param.block.location;
  for (const key of Object.keys(storage)) {
    const pos = storage[key];
    if (param.player.id === key) {
      continue;
    }
    if (isBoundary(pos, bpos)) {
      param.cancel = true;
      return;
    }
  }
});

// TODO explosion exception
world.beforeEvents.explosion.subscribe((param) => {
  if (!storage) {
    return;
  }
  const blocks = param.getImpactedBlocks();
  for (const key of Object.keys(storage)) {
    const pos = storage[key];

    blocks.forEach((block) => {
      if (isBoundary(pos, block.location)) {
        param.cancel = true;
        return;
      }
    });
  }
});

// TODO piston exception
world.beforeEvents.pistonActivate.subscribe((param) => {
  if (!storage) {
    return;
  }
  const blocks = param.piston.getAttachedBlocks();

  for (const key of Object.keys(storage)) {
    const pos = storage[key];
    blocks.forEach((bpos) => {
      if (isBoundary(pos, bpos)) {
        param.cancel = true;
        return;
      }
    });
  }
});
