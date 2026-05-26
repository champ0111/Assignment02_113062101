const {ccclass, property} = cc._decorator;

@ccclass
export class GameManager extends cc.Component {

    onLoad() {
        // 1. 取得 2D 物理管理器並將其開啟
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;

        // 2. 設定遊戲重力（Y 軸為負數代表向下掉，-640 是常用且紮實的速度）
        physicsManager.gravity = cc.v2(0, -640);

        // 3. 修正：Cocos 2.4.8 正確的開啟紅框寫法
        // physicsManager.debugDrawFlags = cc.PhysicsManager.DrawBits.e_shapeBit;
    }

    start() {

    }
}