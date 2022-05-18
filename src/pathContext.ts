import { Bot } from "mineflayer";
import { Block } from "prismarine-block";
import { Vec3 } from "vec3";
import { BetterBlockPos } from "./blocks/betterBlockPos";
import { BlockInfo } from "./blocks/blockInfo";
import { CostInfo } from "./moves/costCalculator";
import { MovementInfo } from "./moves/movementsInfo";
import { Physics } from "./physics/engines/physics";
import { PlayerControls } from "./physics/states/playerControls";
import { PlayerState } from "./physics/states/playerState";

export interface IContext {
    physics: Physics;
    bot: Bot;
    moveInfo: MovementInfo;
    costInfo: CostInfo;
    blockInfo: BlockInfo;
    state: PlayerState;
    currentTick: number;
    blockReach: number;
    entityReach: number;
    world: any /* prismarine-world */;
    bbpAtFeet(): BetterBlockPos;
    getBBP(pos: Vec3): BetterBlockPos;
}

export class PathContext implements IContext {
    public readonly physics: Physics;
    public readonly moveInfo: MovementInfo;
    public readonly costInfo: CostInfo;
    public readonly blockInfo: BlockInfo;
    public state: PlayerState;
    public currentTick: number;

    public get world(): any {
        return this.bot.world;
    }

    constructor(
        public readonly bot: Bot, 
        public readonly blockReach: number, 
        public readonly entityReach: number
    ) {
        this.currentTick = 0;
        this.physics = new Physics((bot as any).registry, bot.world);
        this.blockInfo = new BlockInfo(bot, (bot as any).registry);
        this.costInfo = new CostInfo(this.physics, bot, this.blockInfo, (bot as any).registry);
        this.moveInfo = new MovementInfo(bot, this.blockInfo, this.costInfo);
        this.state = new PlayerState(bot.physics as any, bot, PlayerControls.DEFAULT());
    }

    getBBP(pos: Vec3): BetterBlockPos {
        return new BetterBlockPos(this.world, pos.x, pos.y, pos.z);
    }

    getBBPXYZOffset(node: { x: number, y: number, z: number }, x: number, y: number, z: number) {
        return new BetterBlockPos(this.world, node.x + x, node.y + y, node.z + z);
    }

    bbpAtFeet(): BetterBlockPos {
        const tmp = BetterBlockPos.fromCoords(this.world, this.state.position.x, this.state.position.y + 0.1251, this.state.position.z);
        const tmpBlock = tmp.getBlock();
        if (tmpBlock instanceof Block) {
            if (tmpBlock.shapes[0][4] > 0.2 && tmpBlock.shapes[0][4] < (this.bot.physics as any).stepHeight) {
                return tmp.up();
            }
        }
        return tmp;
    }
}
