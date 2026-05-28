const {ccclass, property} = cc._decorator;

@ccclass
export class CameraFollow extends cc.Component {

    @property(cc.Node)
    playerNode: cc.Node = null; // 拖曳你要跟隨的玩家節點

    @property(cc.Float)
    smoothSpeed: number = 0.1; // 鏡頭跟隨的平滑度（0~1，越小越平滑，1是瞬間重合）

    // 留空間給最後修改：你可以自己限制攝影機的 X 軸最左邊與最右邊（防出界）
    // @property(cc.Float)
    // minX: number = 0;
    // @property(cc.Float)
    // maxX: number = 2000;

    @property(cc.Float)
    minX: number = 0; // 在編輯器設定你地圖的最左邊界

    lateUpdate(dt: number) {
        // 良好的習慣：在 lateUpdate 更新相機位置，確保玩家動完相機才跟上，畫面不會抖動
        if (!this.playerNode) return;

        // 計算目標位置（X 軸跟著玩家，Y 軸和 Z 軸保持相機原本的位置）
        let targetX = this.playerNode.x;
        
        // 平滑內插（Lerp）計算新位置
        let currentX = cc.misc.lerp(this.node.x, targetX, this.smoothSpeed);

        currentX = Math.max(currentX, this.minX)

        // 更新相機座標
        this.node.x = currentX;
    }
}