export class SnakeEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='snake'; Modules.games.ctx=this.ctx; Modules.games.initSnake(); this.draw=()=>{Modules.games.loop();}} }
