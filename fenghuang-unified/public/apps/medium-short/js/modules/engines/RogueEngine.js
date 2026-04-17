export class RogueEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='rogue'; Modules.games.ctx=this.ctx; Modules.games.initRogue(); this.draw=()=>{Modules.games.loop();}} }
