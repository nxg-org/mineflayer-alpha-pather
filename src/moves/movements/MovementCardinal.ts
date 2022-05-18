import { BetterBlockPos } from "../../blocks/betterBlockPos";


import { Vec3 } from "vec3";
import { BaseMovement } from "../BaseMovement";
import { PathContext } from "../../pathContext";
import { PathNode } from "../../pathNode";
import { Direction, MAX_COST } from "../../utils/constants";
import { BlockPlace } from "../../blocks/blockInteraction";

type BBP = BetterBlockPos;
export class MovementCardinal extends BaseMovement {
    public static fromNodeAndDir(ctx: PathContext, node: PathNode, dir: Direction) {
        const src = node.toBBP(ctx.world);
        const dest = new BetterBlockPos(ctx.world, node.x + dir.x, node.y + dir.y, node.z + dir.z);
        return new MovementCardinal(ctx, node, dest, [dest, dest.up()], [src.down()]);
    }

    public static fromNodeAndCoords(ctx: PathContext, node: PathNode, x: number, z: number) {
        const src = node.toBBP(ctx.world);
        const dest = new BetterBlockPos(ctx.world, node.x + x, node.y, node.z + z);
        return new MovementCardinal(ctx, node, dest, [dest, dest.up()], [src.down()]);
    }
    public static fromNodeToNode(ctx: PathContext, node: PathNode, endNode: PathNode) {
        const src = node.toBBP(ctx.world);
        const dest = endNode.toBBP(ctx.world);
        return new MovementCardinal(ctx, node, dest, [dest, dest.up()], [src.down()]);
    }

    calculateAdditionalCost(): number {
        let cost = 0
        const bl0 = this.checkBreak[0].getBlock();
        const bl1 = this.checkBreak[1].getBlock();
        const bl2 = this.checkPlace[0].getBlock();
        if (!bl0 || !bl1 || !bl2) throw "Can't get move."; //TODO

        // data.targetsByTicks[this.ctx.currentTick + i].yaw = Math.atan2(-(this.dest.x - this.ctx.state.position.x), -(this.dest.z - this.ctx.state.position.z));
        if (!this.ctx.blockInfo.canWalkOnBlock(bl1)) {
            if (this.ctx.moveInfo.scaffoldBlockCount === 0) return MAX_COST;

            if (this.ctx.blockInfo.shouldBreakBeforePlaceBlock(bl1)) {
                if (!this.ctx.blockInfo.isBlockDiggable(bl1)) return MAX_COST; //TODO: add safety check. Definitely not stealing from mineflayer rn.
                this.toBreak.push(bl1); //TODO: add face placement? Also not stolen?
                cost += this.ctx.costInfo.getDigCost(bl1, this.src.inLiquid, true);
            }
            this.toPlace.push(new BlockPlace(bl2.position));
            cost += this.ctx.costInfo.getPlacementCostRaw(this.ctx.moveInfo.scaffoldBlockCount, 1);
        }

        cost += this.ctx.moveInfo.maybeBreakThenPlaceCost(this.src, bl1, this.ctx.moveInfo.getScaffoldBlockType());
        return cost;


    }
    calculateValidPositions(): Set<BetterBlockPos> {
        return new Set([this.src.toBBP(this.ctx.world), this.dest]);
    }
}
