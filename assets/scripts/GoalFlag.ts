const {ccclass, property} = cc._decorator;
import { AudioManager } from "./AudioManager"; // 記得引入

@ccclass
export class GoalFlag extends cc.Component {

    @property(cc.AudioClip)
    clearClip: cc.AudioClip = null; // 在編輯器放入過關音效

    start() {
        // // 加上這行，確保渲染層級提到最前
        // this.node.zIndex = 999; 
        // cc.log("旗子 Z-Index 已強設為 999");
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "Player") {
            // 1. 取得玩家腳本並強制停止動作
            let player = otherCollider.getComponent("PlayerController");
            if (player) {
                player.enabled = false; // 停用腳本，讓玩家無法操作
                player.getComponent(cc.RigidBody).linearVelocity = cc.v2(0, 0); // 停下物理
                if (player.anim) player.anim.stop(); // 停止動畫
            }

            // 2. 播放通關音效
            if (AudioManager.instance && this.clearClip) {
                AudioManager.instance.pauseBGM(); // 關掉 BGM
                AudioManager.instance.playSFX(this.clearClip); // 播放過關音效
            }

            // 3. 延遲切換場景，讓音效播完
            this.scheduleOnce(() => {
                cc.director.loadScene("Level1"); // 換成你的下一關場景名稱
            }, 3.0); // 等待 3 秒
        }
    }

    onLoad() {
        cc.log("GoalFlag 已經載入成功！節點名稱:", this.node.name);
        cc.log("座標位置:", this.node.position);
    }

    onDestroy() {
        cc.warn("⚠️ 警告：旗子節點被銷毀了！是誰幹的？");
        // 這裡會顯示是哪個腳本呼叫了 destroy
        console.trace(); 
    }
}