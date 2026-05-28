const {ccclass, property} = cc._decorator;
import { AudioManager } from "./AudioManager";
import FirebaseManager from "./FirebaseManager";

@ccclass
export class GameManager extends cc.Component {
    
    // 這裡定義靜態變數，保證跨場景生存
    public static lives: number = 3; 
    public static score: number = 0;
    public static coins: number = 0;

    onLoad() {
        // 設定物理引擎
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -640);
        
        // 設為持久節點，確保 GameManager 不會被銷毀
        cc.game.addPersistRootNode(this.node);
    }

    start() {
        this.onSceneChanged();
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneChanged, this);
    }

    onSceneChanged() {
        if (AudioManager.instance) {
            AudioManager.instance.playBGM();
        }
    }

    // 統一在此處處理扣血邏輯
    // GameManager.ts
    public static decreaseLife(): boolean {
        this.lives -= 1;
        cc.log("目前剩餘生命:", this.lives);
        
        // 回傳是否 Game Over，讓呼叫者決定跳去哪
        return this.lives <= 0; 
    }

    public static addScore(points: number) {
        this.score += points;
        this.saveGame(); // 每當分數變動，就呼叫存檔
    }

    public static addCoin(amount: number) {
        this.coins += amount;
        this.saveGame();
    }

    public static saveGame() {
        if (FirebaseManager.instance && FirebaseManager.instance.uid) {
            FirebaseManager.instance.savePlayerData({
                username: "PlayerName", // 這裡你可以透過靜態變數傳遞使用者名稱
                score: this.score,
                coins: this.coins,
                lives: this.lives
            });
        }
    }

    // 💡 新增：統一更新數值並存檔的函式
    public static updateData(score: number, coins: number, lives: number) {
        this.score = score;
        this.coins = coins;
        this.lives = lives;

        // 檢查 Firebase 是否準備好並執行存檔
        if (FirebaseManager.instance && FirebaseManager.instance.uid) {
            FirebaseManager.instance.savePlayerData({
                username: "MyUsername", // 這邊建議從某個地方讀取你註冊時存的名稱
                score: this.score,
                coins: this.coins,
                lives: this.lives
            });
        }
    }
}