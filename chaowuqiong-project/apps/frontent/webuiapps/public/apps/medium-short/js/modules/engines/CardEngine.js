export class CardEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='card'; Modules.games.ctx=this.ctx; Modules.games.initCard(); this.draw=()=>{Modules.games.loop();}} }
