const {ccclass, property} = cc._decorator;
import { UIManager } from "./UIManager"; // 💡 這一行非常重要！
import { AudioManager } from "./AudioManager";

@ccclass
export class Coin extends cc.Component {

    @property(cc.AudioClip)
    coinClip: cc.AudioClip = null;

    @property(cc.Integer)
    scoreValue: number = 100;

    private isCollected: boolean = false;

    // 💡 物理引擎碰撞開始時觸發
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 1. 確保撞到的是馬力歐（請確認你馬力歐的節點名稱真的是 "Player"）
        if (otherCollider.node.name === "Player" && !this.isCollected) {
            this.isCollected = true;
            
            cc.log("🪙 碰撞成功！準備通知 UI 加分");
            
            if (AudioManager.instance) {
                AudioManager.instance.playSFX(this.coinClip);
            }

            // 2. 💡 用 instance 直接叫 UI 更新，完全不怕相機和層級怎麼移
            if (UIManager.instance) {
                UIManager.instance.addCoin(1); // 這行會同時加金幣和 200 分
            } else {
                cc.error("❌ 找不到 UIManager.instance！你有把 UIManager 掛在 Canvas 上嗎？");
            }

            // 3. 播放金幣彈跳淡出動畫
            cc.tween(this.node)
                .by(0.1, { y: 25 }, { easing: 'sineOut' })
                .to(0.05, { opacity: 0 })
                .call(() => {
                    this.node.destroy(); 
                })
                .start();
        }
    }

    collect() {
        cc.log("🪙 吃到地圖上的金幣！分數 +" + this.scoreValue);

        // 這裡可以加上你原本有的加分邏輯（例如：GameManager.instance.addScore(this.scoreValue);）

        // ✨ 經典吃金幣動畫：往上彈一下然後消失
        cc.tween(this.node)
            .by(0.1, { y: 25 }, { easing: 'sineOut' }) // 往上彈
            .to(0.05, { opacity: 0 })                  // 變透明
            .call(() => {
                this.node.destroy();                   // 毀滅金幣
            })
            .start();
    }
}