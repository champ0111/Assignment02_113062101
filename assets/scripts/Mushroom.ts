const {ccclass, property} = cc._decorator;

@ccclass
export class Mushroom extends cc.Component {

    @property(cc.Float)
    speed: number = 150; // 建議設回 150 左右，馬力歐經典速度

    private rb: cc.RigidBody = null;
    private moveDirection: number = 1; // 預設 1 就是一律先往右走
    public isReady: boolean = false; 

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        if (this.rb) {
            this.rb.gravityScale = 0;
        }
    }

    public startMoving() {
        this.isReady = true;
        if (this.rb) {
            this.rb.gravityScale = 1;
        }
    }

    update(dt: number) {
        if (!this.isReady) return;

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(this.speed * this.moveDirection, this.rb.linearVelocity.y);
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        let otherName = otherCollider.node.name;
        let otherTag = otherCollider.tag;

        // 【問題二修正：徹底忽略怪物】
        // 如果撞到怪物，直接叫物理引擎「取消這次碰撞」，這樣兩者就會像幽靈一樣直接穿過去！
        if (otherName === "Enemy" || otherTag == 87) {
            contact.disabled = true; 
            return; // 結束判定，不跑下面的轉向邏輯
        }

        // 【問題一修正：精準撞牆判定】
        // 只有在撞到你指定的牆壁或水管名字時，才允許轉向！
        // 這樣剛出生掉到地板（Floor / LeftFloor 等）的時候，絕對不會誤觸轉向，會繼續快樂往右走！
        if (otherName === "LeftWall" || otherName === "GreenPipe1" || otherName.includes("Wall") || otherName.includes("Pipe")) {
            this.moveDirection *= -1;
            cc.log("🍄 蘑菇撞到牆壁/水管 " + otherName + "，成功掉頭！目前方向: " + this.moveDirection);
        }
    }
}