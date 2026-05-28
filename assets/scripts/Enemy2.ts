const {ccclass, property} = cc._decorator;

@ccclass
export default class PiranhaController extends cc.Component {

    @property(cc.Float) moveRange: number = 80;
    @property(cc.Float) duration: number = 2.0;
    @property(cc.Float) stayTime: number = 1.0;
    @property(cc.Float) detectRange: number = 110;
    @property(cc.Float) horizontalRange: number = 110; // 水平不要太遠
    @property(cc.Float) verticalRange: number = 300;  // 上方可以跳很高

    // --- 修改這裡：直接宣告一個變數，等一下在編輯器把子節點拖過來 ---
    @property(cc.Sprite) targetSprite: cc.Sprite = null;

    @property(cc.SpriteFrame) frame1: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) frame2: cc.SpriteFrame = null;
    @property(cc.Float) animSpeed: number = 0.2;

    private player: cc.Node = null;
    private initialY: number = 0;
    private animTimer: number = 0;
    private isFrame1: boolean = true;
    private sprite: cc.Sprite = null;
    
    private isMoving: boolean = false; 

    // 修改偵測邏輯方法
    checkPlayerDistance(): boolean {
        if (!this.player) return false;
        
        let dx = Math.abs(this.node.x - this.player.x);
        let dy = this.player.y - this.node.y; // 垂直距離 (負數代表在食人花下方)

        // 判斷條件：
        // 1. 水平距離必須在範圍內
        // 2. 玩家必須在食人花上方 (dy > 0)，且高度差小於 verticalRange
        return (dx < this.horizontalRange) && (dy > 0 && dy < this.verticalRange);
    }

    start() {
        this.player = cc.find("Canvas/Player");
        this.sprite = this.getComponent(cc.Sprite);

        // --- 確保兩張圖片預設是有值的 ---
        if (!this.frame1 || !this.frame2) {
            cc.error("請在編輯器中為 PiranhaController 指定 frame1 和 frame2！");
        }

        this.initialY = this.node.y;
        this.startPiranhaAction();
    }

    startPiranhaAction() {
        this.isMoving = true;
        
        let moveTween = cc.tween(this.node)
            .to(this.duration, { y: this.initialY + this.moveRange }, { easing: 'sineInOut' })
            .delay(this.stayTime)
            .to(this.duration, { y: this.initialY }, { easing: 'sineInOut' })
            .delay(this.stayTime)
            .call(() => {
                // --- 關鍵修改：週期結束時才檢查玩家是否在附近 ---
                let distance = this.player ? this.node.position.sub(this.player.position).mag() : 9999;
                if (this.checkPlayerDistance()) {
                    this.isMoving = false; // 玩家在附近，停止循環
                } else {
                    this.startPiranhaAction(); // 玩家不在附近，繼續下一輪
                }
            });
        moveTween.start();
    }

    update(dt: number) {
        // 1. 動畫邏輯：使用 targetSprite 來切換圖片
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            this.isFrame1 = !this.isFrame1;
            // 檢查 targetSprite 是否有值，避免報錯
            if (this.targetSprite) {
                this.targetSprite.spriteFrame = this.isFrame1 ? this.frame1 : this.frame2;
            }
        }

        // 2. 玩家離開偵測：如果玩家離開，且食人花已經處於停止狀態，則自動重啟
        if (this.player && !this.isMoving) {
            let distance = this.node.position.sub(this.player.position).mag();
            if (!this.checkPlayerDistance()) {
                this.startPiranhaAction();
            }
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "Player") {
            // 只有當食人花明顯升起時才扣血
            if (this.node.y < this.initialY + 20) return; 
            
            let player = otherCollider.getComponent("PlayerController");
            if (player) player.handleDamage();
        }
    }
}