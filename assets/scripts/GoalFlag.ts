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
                // 引入 UIManager
                let UIManager = cc.find("Canvas/UIManager") ? cc.find("Canvas/UIManager").getComponent("UIManager") : null;
                
                // ==========================================
                // 🔥 [絕對執行版] 移到 if 外面！不管有沒有 UIManager 都要強行抓數據並噴入 Firebase
                // ==========================================
                try {
                    let finalCoins = 0;
                    let finalScore = 0;
                    let finalLives = 3;

                    if (UIManager) {
                        // 如果有 UIManager，嘗試讀取它的數據
                        finalCoins = UIManager.coinCount !== undefined ? UIManager.coinCount : (UIManager.coins !== undefined ? UIManager.coins : 0);
                        finalScore = UIManager.scoreCount !== undefined ? UIManager.scoreCount : (UIManager.score !== undefined ? UIManager.score : 0);
                        finalLives = UIManager.livesCount !== undefined ? UIManager.livesCount : (UIManager.lives !== undefined ? UIManager.lives : 3);
                    } else {
                        // 💡 抓不到 UIManager 時的備案：直接去常駐的 GameManager 類別撈取靜態變數
                        let gmClass = cc.js.getClassByName("GameManager") as any;
                        if (gmClass) {
                            finalCoins = gmClass.coins || 0;
                            finalScore = gmClass.score || 0;
                            finalLives = gmClass.lives || 3;
                        }
                    }

                    // 同步給常駐節點的 class 靜態變數，防止切場景後數值歸零
                    let gmClass = cc.js.getClassByName("GameManager") as any;
                    if (gmClass) {
                        gmClass.coins = finalCoins;
                        gmClass.score = finalScore;
                        gmClass.lives = finalLives;
                    }

                    // 強制射進 Firebase
                    // @ts-ignore
                    const user = (typeof firebase !== 'undefined') ? firebase.auth().currentUser : null;
                    if (user) {
                        cc.log(`【過關絕對強存】正在將 金幣:${finalCoins}, 分數:${finalScore} 噴入 Firebase...`);
                        // @ts-ignore
                        firebase.database().ref('users/' + user.uid).update({
                            score: finalScore,
                            coins: finalCoins,
                            lives: finalLives
                        });
                    }
                } catch (e) {
                    cc.error("【過關強存防崩潰鎖】拋出錯誤，但放行原本邏輯:", e);
                }
                // ==========================================

                // 以下原本的邏輯原封不動
                if (UIManager) {
                    cc.log("【過關】通知 UIManager 安全存檔並切換場景...");
                    UIManager.saveAndLoadScene("LevelSelect");
                } else {
                    cc.warn("【過關】找不到 UIManager，使用強制跳轉備案");
                    cc.director.loadScene("LevelSelect");
                }
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