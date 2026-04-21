export class GalEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='gal'; Modules.games.ctx=this.ctx; Modules.games.initGal(); this.draw=()=>{Modules.games.loop();}} }
