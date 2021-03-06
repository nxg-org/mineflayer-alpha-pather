import { Bot, EquipmentDestination } from "mineflayer";
import { Block } from "prismarine-block";
import { Item } from "prismarine-item";
import { PathNode } from "../pathNode";
import { MovementEnum, SimulationControl, ToolPriority, toolsForMaterials } from "./constants";

export function dist3d(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
}

export function cantGetBlockError(functionName: string, x: number, y: number, z: number, reason?: string) {
    return new Error(`[ERROR from ${functionName}]: Invalid block at (${x}, ${y}, ${z})\nReason: ${reason}`);
}

export function cantGetItemError(functionName: string, itemName: string, destination: string, reason?: string) {
    //leave in case invalid destination.
    return new Error(`[ERROR from ${functionName}]: Cannot equip item: ${itemName} to destination ${destination}\nReason: ${reason}`);
}

export function parentBrokeInPast(x: number, y: number, z: number, parentNode: PathNode): boolean {
    while (parentNode.parent) {
        for (const block of parentNode.brokenBlocks) {
            if (block[0] == x && block[1] == y && block[2] == z) return true;
        }
        parentNode = parentNode.parent;
    }
    return false;
}

export function parentBrokeInPastBlock(blockPos: {x: number, y: number, z: number}, parentNode: PathNode): boolean {
    while (parentNode.parent) {
        for (const block of parentNode.brokenBlocks) {
            if (block[0] == blockPos.x && block[1] == blockPos.y && block[2] == blockPos.z) return true;
        }
        parentNode = parentNode.parent;
    }
    return false;
}


// export function parentPlacedInPastBlock(blockPos: {x: number, y: number, z: number}, parentNode: Node): boolean {
//     while (parentNode.parent) {
//         for (const block of parentNode.) {
//             if (block[0] == blockPos.x && block[1] == blockPos.y && block[2] == blockPos.z) return true;
//         }
//         parentNode = parentNode.parent;
//     }
//     return false;
// }


export function getTool(bot: Bot, blockMaterial: string = "default"): Item | null {
    const rightTool = toolsForMaterials[blockMaterial];
    if (!rightTool || rightTool == "hand") return null;
    const items = bot.util.inv.getAllItems().filter((i) => i.name.includes(rightTool));
    const wanted = items.reduce(
        ([prio, arr]: [number, Item[]], c): [number, Item[]] => {
            const currentPrio = getToolPriority(c.name);
            if (currentPrio > prio) return [currentPrio, [c]];
            if (currentPrio == prio) arr.push(c);
            return [prio, arr];
        },
        [-1, []]
    )[1];
    return wanted.reduce(
        ([pEff, p]: [number, Item | null], c): [number, Item | null] => {
            let cEff = 0;
            for (const enchant of c.enchants) {
                if (enchant.name == "efficiency") {
                    cEff = enchant.lvl;
                    break;
                }
            }
            if (cEff > pEff) return [cEff, c];
            return [pEff, p];
        },
        [-1, null]
    )[1];
}


export function getToolPriority(name: string): number {
    return ToolPriority[name.split("_", 1)[0]] ?? -1;
}

export function getController(movementType: MovementEnum): SimulationControl {
    switch (movementType) {
        case MovementEnum.Cardinal:
        case MovementEnum.Diagonal:
        case MovementEnum.SwimCardinal:
        case MovementEnum.SwimDiagonal:
            return {
                forward: true,
                back: false,
                right: false,
                left: false,
                sneak: false,
                sprint: false,
                jump: false,
            };
        case MovementEnum.JumpCardinal:
        case MovementEnum.JumpDiagonal:
            return {
                forward: true,
                back: false,
                right: false,
                left: false,
                sneak: false,
                sprint: false,
                jump: true,
            };
        case MovementEnum.SprintCardinal:
        case MovementEnum.SprintDiagonal:
        case MovementEnum.SprintSwimCardinal:
        case MovementEnum.SprintSwimDiagonal:
            return {
                forward: true,
                back: false,
                right: false,
                left: false,
                sneak: false,
                sprint: true,
                jump: false,
            };
        case MovementEnum.SprintJumpCardinal:
        case MovementEnum.SprintJumpDiagonal:
            return {
                forward: true,
                back: false,
                right: false,
                left: false,
                sneak: false,
                sprint: true,
                jump: true,
            };
        case MovementEnum.Init:
            return {
                forward: false,
                back: false,
                right: false,
                left: false,
                sneak: false,
                sprint: false,
                jump: false,
            };
    }
}

export function distanceXZ(dx: number, dz: number) {
    dx = Math.abs(dx);
    dz = Math.abs(dz);
    return Math.abs(dx - dz) + Math.min(dx, dz) * Math.SQRT2;
}


const TWO_PI = 2 * Math.PI 
export function wrapDegrees(degrees: number): number {
    const tmp = degrees % 360;
    return tmp < 0 ? tmp + TWO_PI : tmp
}