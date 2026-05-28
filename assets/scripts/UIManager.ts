const {ccclass, property} = cc._decorator;
import { GameManager } from "./GameManager";
import FirebaseManager from "./FirebaseManager";

@ccclass
export class UIManager extends cc.Component {

    public static instance: UIManager = null;

    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) coinLabel: cc.Label = null;
    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    // 遊戲數值變數
    private score: number = 0;
    private coins: number = 0;
    private lives: number = 3;
    private timeLeft: number = 300; // 💡 配合你改成 300 秒

    private isTimerRunning: boolean = true;

    onLoad() {
        UIManager.instance = this;
        this.updateUI();

        // 啟動計時器：每隔 1 秒呼叫一次 countdown
        this.schedule(this.countdown, 1);
    }

    public updateLifeDisplay() {
        if (this.lifeLabel) {
            // 直接讀取 GameManager 裡面的靜態變數
            this.lifeLabel.string = "LIFE x " + GameManager.lives;
        }
    }

    // 🕒 計時器倒數邏輯
    countdown() {
        if (!this.isTimerRunning) return;

        this.timeLeft--;
        if (this.timeLeft >= 0) {
            if (this.timerLabel) {
                // 💡 格式：TIME: 300
                this.timerLabel.string = "TIME: " + String(this.timeLeft).padStart(3, '0');
            }
        } else {
            this.isTimerRunning = false;
            this.unschedule(this.countdown);
            cc.log("🚨 時間到！馬力歐超時死掉！");
            
            let player = cc.find("Canvas/Player"); 
            if (player) {
                let pScript = player.getComponent("PlayerController");
                if (pScript && pScript.triggerDeath) pScript.triggerDeath();
            }
        }
    }


    public addScore(amount: number) {
        GameManager.score += amount;
        this.scoreLabel.string = "SCORE: " + String(GameManager.score).padStart(6, '0');
        
        // 呼叫存檔
        GameManager.updateData(GameManager.score, GameManager.coins, GameManager.lives);
    }

    // 💡 清乾淨後的 addCoin
    public addCoin(amount: number = 1) {
        GameManager.coins += amount;
        this.coinLabel.string = "COINS x " + String(GameManager.coins).padStart(2, '0');
        this.addScore(500); 
    }

    // ❤️ 設定生命值
    public setLives(amount: number) {
        this.lives = amount;
        if (this.lifeLabel) {
            // 💡 格式：LIFE x 3
            this.lifeLabel.string = "LIFE x " + this.lives;
        }
    }

    public getLives(): number {
        return this.lives;
    }

    public stopTimer() {
        this.isTimerRunning = false;
    }

    // 初始化 UI 顯示格式
    updateUI() {
        // 💡 修正：初始化時，應該從 GameManager 抓取累積的分數和金幣，而不是直接寫 0
        this.score = GameManager.score; 
        this.coins = GameManager.coins;

        if (this.scoreLabel) this.scoreLabel.string = "SCORE: " + String(this.score).padStart(6, '0');
        if (this.coinLabel) this.coinLabel.string = "COINS x " + String(this.coins).padStart(2, '0');
        
        this.updateLifeDisplay();
        if (this.timerLabel) this.timerLabel.string = "TIME: " + this.timeLeft;
    }

    // 💡 新增：強制確保安全存檔後，才執行場景跳轉
    public saveAndLoadScene(sceneName: string) {
        // 準備好要上傳的最新資料
        const uploadData = {
            score: GameManager.score,
            coins: GameManager.coins,
            lives: GameManager.lives
        };

        cc.log("【安全存檔】準備同步最新數據到雲端...", uploadData);

        if (FirebaseManager.instance) {
            // 我們傳入一個 Callback 回呼函式，逼 Firebase 寫入完成後才執行裡面的代碼
            FirebaseManager.instance.savePlayerData(uploadData, () => {
                cc.log("【安全存檔】Firebase 確認寫入成功！現在安心切換場景到: " + sceneName);
                cc.director.loadScene(sceneName);
            });
        } else {
            cc.warn("FirebaseManager 不存在，直接切換場景");
            cc.director.loadScene(sceneName);
        }
    }
}