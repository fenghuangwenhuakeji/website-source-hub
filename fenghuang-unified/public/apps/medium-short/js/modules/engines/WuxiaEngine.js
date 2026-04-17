export class WuxiaEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='wuxia'; Modules.games.ctx=this.ctx; Modules.games.initWuxia(); this.draw=()=>{Modules.games.loop();}} }
