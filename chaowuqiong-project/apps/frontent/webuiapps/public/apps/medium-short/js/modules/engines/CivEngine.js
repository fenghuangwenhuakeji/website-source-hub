export class CivEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='civ'; Modules.games.ctx=this.ctx; Modules.games.initCiv(); this.draw=()=>{Modules.games.loop();}} }
