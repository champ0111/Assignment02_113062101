const {ccclass, property} = cc._decorator;

@ccclass
export class Enemy extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 100; // 怪物的移動速度

    private rb: cc.RigidBody = null;
    private moveDirection: number = -1; // -1 代表向左，1 代表向右

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
    }

    update(dt: number) {
        if (!this.rb) return;

        // 讓怪物維持固定的左右移動速度，Y 軸保留物理重力
        this.rb.linearVelocity = cc.v2(this.moveDirection * this.moveSpeed, this.rb.linearVelocity.y);
    }

    // 怪物的碰撞偵測：只需要處理撞牆回頭，其餘不理會
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        let otherName = otherCollider.node.name;

        // 撞到玩家和地板以外的東西（例如未來的牆壁）才掉頭
        if (otherName !== "Player" && otherName !== "Floor") {
            this.moveDirection *= -1;
            cc.log("怪物撞到 " + otherName + "，掉頭！");
        }
    }
}