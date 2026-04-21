export class OpenWorldEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='rpg'; Modules.games.ctx=this.ctx; Modules.games.initRpg(); this.draw=()=>{Modules.games.loop();}} }
