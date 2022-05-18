import { Vec3 } from "vec3";
import { BetterBlockPos } from "../blocks/betterBlockPos";
import { BlockPlace, IBlockType } from "../blocks/blockInteraction";
import { PathContext } from "../pathContext";
import { PathNode } from "../pathNode";
import { MAX_COST } from "../utils/constants";
import {Block} from "prismarine-block";

export abstract class BaseMovement {
    public cost: number = MAX_COST;

    public readonly toBreak: Block[] = [];
    public readonly toPlace: BlockPlace[] = [];

    protected validPositionsCached?: Set<BetterBlockPos>;

    constructor(
        public readonly ctx: PathContext,
        public readonly src: PathNode,
        public readonly dest: BetterBlockPos,
        public readonly checkBreak: BetterBlockPos[] = [],
        public readonly checkPlace: BetterBlockPos[] = []
    ) {
    }

    // abstract calculateInfo(): MovementData;
    abstract calculateValidPositions(): Set<BetterBlockPos>;

    public getValidPositions(): Set<BetterBlockPos> {
        if (!this.validPositionsCached || this.validPositionsCached.size == 0) {
            this.validPositionsCached = this.calculateValidPositions();
            // Objects.requireNonNull(validPositionsCached);
        }
        return this.validPositionsCached;
    }

    /**
     *
     * @param playerState ACTUALLY PlayerState from prismarine-physics.
     * @returns
     */
    protected stateInValidPosition(state: PathContext): boolean {
        return this.getValidPositions().has(state.bbpAtFeet()); //|| this.getValidPositions().has(((PathingBehavior) baritone.getPathingBehavior()).pathStart());
    }

}

