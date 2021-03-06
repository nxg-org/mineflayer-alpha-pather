import { Bot } from "mineflayer";
import { Block } from "prismarine-block";
import { Vec3 } from "vec3";
import { BlockInfo } from "../blocks/blockInfo";
import md from "minecraft-data";
import { getController, getTool } from "../utils/util";
import { MAX_COST, MovementEnum, SimulationControl } from "../utils/constants";
import { BlockPlace } from "../blocks/blockInteraction";
import { PlayerState } from "../physics/states/playerState";
import { Physics } from "../physics/engines/physics";

export interface CostCalculatorOptions {
    digCostCalculation: (bot: Bot, totalTicks: number, toBreakId: number) => number;
    placementCostCalculation: (bot: Bot, remainingAvailable: number, toPlaceIds: [{ id: number, count: number }]) => number;
    movementCostCalculation: (bot: Bot, totalTicks: number) => number;
}

export class CostInfo {
    //Too lazy to implement myself here
    private predictWorld: typeof this.bot.util.predict.world;

    constructor(
        private physics: Physics,
        private bot: Bot,
        private blockInfo: BlockInfo,
        private data: md.IndexedData,
        private customCalcs: CostCalculatorOptions = {
            digCostCalculation: (bot: Bot, totalTicks: number) => totalTicks,
            placementCostCalculation: (bot: Bot, remainingAvailable: number, toPlaceIds: [{ id: number, count: number }]) => { let sum = 0; toPlaceIds.forEach(tp => sum += tp.id); return sum; },
            movementCostCalculation: (bot: Bot, totalTicks: number) => totalTicks,
        }
    ) {
        this.predictWorld = this.bot.util.predict.world;
    }

    /**
     * Get dig time (ms)
     * @param block
     * @param inWater
     * @param useTools
     * @returns
     */
    public getDigTime(block: Block, inWater: boolean, useTools: boolean = true): number {
        // const block = this.bot.blockAt(new Vec3(x, y, z));
        // if (!block) throw cantGetBlockError("getDigTime", x, y, z);
        let item;
        if (useTools && block.material) item = getTool(this.bot, block.material);
        if (this.blockInfo.isWater(block) || this.blockInfo.isLava(block)) return 0;
        if (block.hardness >= 100 || block.hardness == null) return MAX_COST;
        return block.digTime(item?.type ?? null, this.bot.player.gamemode == 1, inWater, false, item?.enchants, {} as any);
    }

    /**
     * Get dig cost (ticks)
     * @param block
     * @param inWater
     * @param useTools
     * @returns
     */
    getDigCost(block: Block, inWater: boolean, useTools: boolean = true) {
        return this.customCalcs.digCostCalculation(this.bot, this.getDigTime(block, inWater, useTools), block.type);
    }



    // /**
    //  * Convert digTime (ms) to ticks.
    //  * @param dest
    //  * @param controls
    //  * @param ticks
    //  * @returns
    //  */
    // getMovementCost(dest: Vec3, move: MovementEnum, setBlocks: BlockInteraction[] = [], ticks: number = 5): number {
    //     if (setBlocks[0]) this.predictPlace(setBlocks);
    //     const cost = this.getMovementTime(dest, getController(move), ticks);
    //     if (setBlocks[0]) this.removePredict(setBlocks);
    //     return cost === MAX_COST ? cost : this.customCalcs.movementCostCalculation(this.bot, cost);
    // }

    private predictPlace(blocks: BlockPlace[]) {
        const converted = blocks.map((b) => {
            const block = new Block(this.data.blocksByName.stone.id, 0, 0);
            block.position = b.dest;
            return block;
        });
        const obj: { [blockPos: string]: Block } = {};
        for (const b of converted) obj[b.position.toString()] = b;
        this.predictWorld.setBlocks(obj);
    }

    private removePredict(blocks: BlockPlace[]) {
        this.predictWorld.removeBlocks(
            blocks.map((b) => b.dest),
            false
        );
    }

    // /**
    //  *  wait until y is leveled and we are near goal on XZ and we are on block/water.
    //  * @param dest
    //  * @param controls
    //  * @param ticks
    //  * @returns
    //  */
    // private getMovementTime(state: PlayerState, dest: Vec3, controls: , ticks: number = 5): number {
    //     for (let i = 0; i < ticks; i++) {
    //         (this.bot.physics as any).simulatePlayer(state, this.predictWorld);
    //         if (state.isInLava) return MAX_COST;
    //         if (this.reachedPosition(state, dest)) return ticks;
    //     }
    //     return MAX_COST;
    // }

    // /**
    //  * Helper function.
    //  * @param state
    //  * @param dest
    //  * @returns
    //  */
    // private reachedPosition(state: PlayerState, dest: Vec3) {
    //     const delta = dest.minus(state.position);
    //     const r2 = 0.15 * 0.15;
    //     return delta.x * delta.x + delta.z * delta.z <= r2 && Math.abs(delta.y) < 0.001 && (state.onGround || state.isInWater);
    // }

    getPlacementCost(currentBlocks: number, toPlace: [{ id: number, count: number }]) {
        return Math.min(MAX_COST, this.customCalcs.placementCostCalculation(this.bot, currentBlocks, toPlace));
    }
    getPlacementCostRaw(currentBlocks: number, toPlace: number) {
        return Math.min(MAX_COST, currentBlocks / (currentBlocks - toPlace));
    }
}
