const {ccclass, property} = cc._decorator;

enum TurtleState { Walking, Shell, Sliding }

@ccclass
export default class TurtleController extends cc.Component {

    @property(cc.Float) moveSpeed: number = 30;
    @property(cc.Float) slideSpeed: number = 200; // 踢出去的速度較快
    @property(cc.Node) spriteNode: cc.Node = null;

    @property(cc.SpriteFrame) frame1: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) frame2: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) shellFrame: cc.SpriteFrame = null;

    private rb: cc.RigidBody = null;
    private sprite: cc.Sprite = null;
    private state: TurtleState = TurtleState.Walking;
    private moveDirection: number = -1;
    private animTimer: number = 0;
    private isFrame1: boolean = true;
    private lastContactTime: number = 0;

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        if (this.spriteNode) this.sprite = this.spriteNode.getComponent(cc.Sprite);
    }

    update(dt: number) {
        if (this.state === TurtleState.Shell) return; // 龜殼不動時靜止

        // 根據狀態設定速度
        let speed = (this.state === TurtleState.Sliding) ? this.slideSpeed : this.moveSpeed;
        this.rb.linearVelocity = cc.v2(this.moveDirection * speed, this.rb.linearVelocity.y);

        // --- 新增：視覺轉向邏輯 ---
        if (this.spriteNode) {
            // 如果向右走 (moveDirection 為 1)，scaleX 設為 1；向左走設為 -1
            // 視你的圖片原始方向而定，如果反了就將這裡的 1 和 -1 對調
            this.spriteNode.scaleX = this.moveDirection > 0 ? -1 : 1;
        }

        // 走路動畫
        if (this.state === TurtleState.Walking) {
            this.animTimer += dt;
            if (this.animTimer >= 0.2) {
                this.animTimer = 0;
                this.isFrame1 = !this.isFrame1;
                this.sprite.spriteFrame = this.isFrame1 ? this.frame1 : this.frame2;
            }
        }
    }

    // 🎯 被 PlayerController 踩到時呼叫
    public onStomped(playerNode: cc.Node) {
        if (this.state === TurtleState.Walking) {
            // 走路 -> 變龜殼
            this.state = TurtleState.Shell;
            this.sprite.spriteFrame = this.shellFrame;
            this.rb.linearVelocity = cc.v2(0, 0);
        } else if (this.state === TurtleState.Shell) {
            // 龜殼 -> 滑行
            this.state = TurtleState.Sliding;
            this.moveDirection = (playerNode.x < this.node.x) ? 1 : -1;
        } else if (this.state === TurtleState.Sliding) {
            // 滑行 -> 停下變龜殼
            this.state = TurtleState.Shell;
            this.rb.linearVelocity = cc.v2(0, 0); // 停下
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        // 1. 滑行狀態：殺怪
        if (this.state === TurtleState.Sliding && other.group === "Enemy") {
            other.destroy(); 
            return;
        }

        // 2. 為了避免連續碰撞導致卡死，我們檢查時間間隔
        let now = Date.now();
        if (now - this.lastContactTime < 100) return; // 100ms 內重複碰撞直接忽略

        // 3. 判斷牆壁 (明確排除玩家與地板，避免與剛體運算打架)
        if (other.name !== "Player" && other.name !== "Floor" && other.group !== "Enemy") {
            this.lastContactTime = now; // 更新時間戳

            this.moveDirection *= -1;
            
            // 修正速度，確保給予一個明確的向量，且不要太快導致穿透
            let speed = (this.state === TurtleState.Sliding) ? this.slideSpeed : this.moveSpeed;
            this.rb.linearVelocity = cc.v2(this.moveDirection * speed, this.rb.linearVelocity.y);
            
            // 這裡暫時移除 this.node.x += ... 偏移，先測試單純改速度會不會卡住
        }
    }

    // TurtleController.ts 新增一個方法
    public getCurrentState(): number {
        return this.state;
    }

    // 確保 onInteract 不會觸發扣血 (它是被 PlayerController 呼叫的)
    public onInteract(playerNode: cc.Node) {
        if (this.state === TurtleState.Walking) {
            this.state = TurtleState.Shell;
            this.sprite.spriteFrame = this.shellFrame;
            this.rb.linearVelocity = cc.v2(0, 0);
        } 
        else if (this.state === TurtleState.Shell) {
            // 玩家碰觸靜止龜殼 -> 踢它！
            this.state = TurtleState.Sliding;
            this.moveDirection = (playerNode.x < this.node.x) ? 1 : -1;
        } 
        else if (this.state === TurtleState.Sliding) {
            // 玩家再次碰觸滑行中的龜殼 -> 讓它停下
            this.state = TurtleState.Shell;
            this.rb.linearVelocity = cc.v2(0, 0);
        }
    }
}