const {ccclass, property} = cc._decorator;
import { GameManager } from "./GameManager";

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


    // 統一加分接口
    public addScore(amount: number) {
        this.score += amount;
        this.scoreLabel.string = "SCORE: " + String(this.score).padStart(6, '0');
    }

    // 統一加金幣接口（內含加金幣動畫、UI 更新、並加分）
    public addCoin(amount: number = 1) {
        this.coins += amount;
        this.coinLabel.string = "COINS: " + String(this.coins).padStart(2, '0');
        this.addScore(500); // 這裡統一設定吃到金幣加 500
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
        if (this.scoreLabel) this.scoreLabel.string = "SCORE: 000000";
        if (this.coinLabel) this.coinLabel.string = "COINS: 00";
        this.updateLifeDisplay();
        if (this.timerLabel) this.timerLabel.string = "TIME: " + this.timeLeft;
    }
}