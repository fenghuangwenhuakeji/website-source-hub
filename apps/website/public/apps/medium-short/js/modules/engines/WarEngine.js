export class WarEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='war'; Modules.games.ctx=this.ctx; Modules.games.initWar(); this.draw=()=>{Modules.games.loop();}} }
