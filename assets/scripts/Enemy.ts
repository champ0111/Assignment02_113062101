const {ccclass, property} = cc._decorator;

@ccclass
export class Enemy extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 30;

    @property(cc.Float)
    flipInterval: number = 0.2;

    @property(cc.Node)
    spriteNode: cc.Node = null; // 視覺子節點

    // 💡 拖入 plist 裡面那張「死掉」的圖片
    @property(cc.SpriteFrame)
    deadFrame: cc.SpriteFrame = null;

    private rb: cc.RigidBody = null;
    private sprite: cc.Sprite = null;
    private moveDirection: number = -1;
    private animationTimer: number = 0;
    private flipState: number = 1;
    private isDead: boolean = false; // 💡 標記是否死掉

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        // 取得子節點上的 Sprite 元件
        if (this.spriteNode) {
            this.sprite = this.spriteNode.getComponent(cc.Sprite);
        }
    }

    update(dt: number) {
        // 💡 如果死掉了，就不執行移動和翻轉動畫
        if (this.isDead || !this.rb) return;

        // 1. 移動
        this.rb.linearVelocity = cc.v2(this.moveDirection * this.moveSpeed, this.rb.linearVelocity.y);

        // 2. 走路翻轉動畫
        this.animationTimer += dt;
        if (this.animationTimer >= this.flipInterval) {
            this.animationTimer = 0;
            this.flipState *= -1;
            if (this.spriteNode) {
                this.spriteNode.scaleX = this.flipState;
            }
        }
    }

    // 🎯 供 PlayerController 呼叫的死亡接口
    public die() {
        if (this.isDead) return;
        this.isDead = true;

        // 1. 視覺切換 (這部分絕對安全)
        if (this.sprite && this.deadFrame) {
            this.sprite.spriteFrame = this.deadFrame;
        }
        if (this.spriteNode) {
            this.spriteNode.scaleY = 0.3;
            this.spriteNode.y -= 10;
        }

        // 2. 💡 關鍵修改：不要直接在這裡停用剛體，改用延遲一幀執行
        this.scheduleOnce(() => {
            if (this.rb) {
                this.rb.linearVelocity = cc.v2(0, 0);
                this.rb.active = false; // 等到碰撞偵測結束後再停用
            }
            // 同時關閉碰撞盒
            let collider = this.getComponent(cc.PhysicsBoxCollider);
            if (collider) collider.enabled = false;
        }, 0); // 延遲 0 秒等於「下一幀執行」，這就能避開物理碰撞回調的限制

        // 3. 延遲銷毀
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.5);
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isDead) return; // 死掉後不處理碰撞

        let otherName = otherCollider.node.name;
        if (otherName !== "Player" && otherName !== "Floor") {
            this.moveDirection *= -1;
        }
    }
}