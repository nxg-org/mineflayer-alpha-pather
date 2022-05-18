import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { BlockInfo } from "../blocks/blockInfo";
import {
    allDirections,
    Direction,
    JumpMovements,
    MovementConst,
    MovementEnum,
    SlowerMovements,
    SprintMovements,
    SwimmingMovements,
    MAX_COST,
    scaffoldBlocks,
    scaffoldBlocksAsSet,
} from "../utils/constants";
import { Block } from "prismarine-block";
import { Item } from "prismarine-item";
import { PathNode } from "../pathNode";
import { BetterBlockPos } from "../blocks/betterBlockPos";
import { BlockPlace, IBlockType } from "../blocks/blockInteraction";
import { BaseMovement } from "./BaseMovement";
import { CostInfo } from "./costCalculator";

export interface MovementCostOptions {
    placeCost: number;
    breakCost: number;
    movementCost: number;
}

export class MovementInfo {
    private scaffoldBlockCache: Item[];
    public updateRequested: boolean = true;

    constructor(private bot: Bot, private blockInfo: BlockInfo, private costInfo: CostInfo) {
        this.scaffoldBlockCache = [];
        this.bot.on("playerCollect", async () => {
            await this.bot.waitForTicks(1);
            this.updateRequested = true;
        })
    }

    public get scaffoldBlockCount(): number {
        if (this.updateRequested) {
            this.scaffoldBlockCache = this.getScaffoldBlocks();
            this.updateRequested = false;
        }
        return this.scaffoldBlockCache.reduce((a, b) => a + b.stackSize, 0);
    }

    maybeBreakThenPlaceCost(node: PathNode, checkBlock: Block, placeBlockId: number): number {
        if (this.blockInfo.shouldBreakBeforePlaceBlock(checkBlock)) {
            if (!this.blockInfo.canDigBlock(checkBlock)) return MAX_COST;
            return this.costInfo.getDigCost(checkBlock, node.inLiquid) + this.costInfo.getPlacementCost(this.scaffoldBlockCount, [{ id: placeBlockId, count: 1 }]);
        } else return this.costInfo.getPlacementCost(this.scaffoldBlockCount, [{ id: placeBlockId, count: 1 }]);
    }

    getBlock(node: PathNode, x: number, y: number, z: number): Block | null {
        return this.bot.blockAt(new Vec3(node.x + x, node.y + y, node.z + z));
    }

    getScaffoldBlocks(): Item[] {
        return this.bot.util.inv
            .getAllItems()
            .filter((item) => scaffoldBlocksAsSet.has(item.name))
    }

    getScaffoldBlockTally(): number {
        return this.bot.util.inv
            .getAllItems()
            .filter((item) => scaffoldBlocksAsSet.has(item.name))
            .map((item) => item.stackSize)
            .reduce((a, b) => a + b);
    }

    areXScaffoldBlocksAvailable(num: number): boolean {
        return this.scaffoldBlockCount >= num;
    }

    getWaterBucket(): Item | undefined {
        return this.bot.util.inv.getAllItems().find((item) => item.name === "water_bucket");
    }

    hasWaterBucket(): boolean {
        return !!this.getWaterBucket();
    }

    getScaffoldBlockType(): number {
        return this.scaffoldBlockCache[0].type;
    }

    // //Similar logic to mineflayer-pathfinder
    // getMove(wanted: MovementEnum, node: PathNode, dir: Direction, movementsStore: BaseMovement[]) {
    //     let cost = 0;
    //     const toBreak: Vec3[] = [];
    //     const toPlace: BlockInteraction[] = [];
    //     switch (wanted) {
    //         case MovementEnum.Cardinal:
    //         case MovementEnum.SprintCardinal:
    //             const cardA = this.getBlock(node, dir.x, 1, dir.z); //+1 up
    //             const cardB = this.getBlock(node, dir.x, 0, dir.z); //wanted
    //             const cardC = this.getBlock(node, dir.x, -1, dir.z); //-1 down
    //             if (!cardA || !cardB || !cardC) throw "Can't get move."; //TODO
    //             const cardBLiquid = this.blockInfo.isLiquid(cardB);
    //             if (!this.blockInfo.canWalkOnBlock(cardC) && !cardBLiquid) {
    //                 if (this.scaffoldBlockCount === 0) return;

    //                 if (this.blockInfo.shouldBreakBeforePlaceBlock(cardC)) {
    //                     if (!this.blockInfo.isBlockDiggable(cardC)) return; //TODO: add safety check. Definitely not stealing from mineflayer rn.
    //                     toBreak.push(cardC.position); //TODO: add face placement? Also not stolen?
    //                 }
    //                 toPlace.push(new BlockInteraction(IBlockType.PLACE, cardB.position, cardC.position));
    //                 cost += this.costInfo.getPlacementCost(this.scaffoldBlockCount, toPlace);
    //             }

    //             cost += this.maybeBreakCost(node, cardA, wanted);
    //             if (cost === MAX_COST) return;
    //             movementsStore.push(
    //                 new Movement(
    //                     node,
    //                     wanted,
    //                     cardB.position.x,
    //                     cardB.position.y,
    //                     cardB.position.z,
    //                     cardBLiquid,
    //                     cost,
    //                     toBreak,
    //                     toPlace,
    //                     true
    //                 )
    //             );
    //     }
    // }

    // getAllMoves(node: PathNode): Movement[] {
    //     const moves: Movement[] = [];
    //     for (const d in allDirections) {
    //         const dir = allDirections[d];
    //         for (const m in MovementConst) {
    //             const move = MovementConst[m];
    //             this.getMove(move, node, dir, moves);
    //         }
    //     }
    //     return moves;
    // }
}
