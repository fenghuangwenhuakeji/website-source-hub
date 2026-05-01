export class BaseGameEngine {
    constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.running=false; canvas.focus(); }
    start(){this.running=true; this.loop();}
    stop(){this.running=false; cancelAnimationFrame(this.loopId);}
    loop(){ if(!this.running)return; this.update(); this.draw(); this.loopId=requestAnimationFrame(()=>this.loop()); }
    update(){}
    draw(){ this.ctx.fillStyle='#000'; this.ctx.fillRect(0,0,800,600); }
}
