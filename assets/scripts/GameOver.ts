// GameOverController.ts
const {ccclass, property} = cc._decorator;
import { AudioManager } from "./AudioManager";
import { GameManager } from "./GameManager";

@ccclass
export default class GameOverController extends cc.Component {

    @property(cc.AudioClip)
    gameOverMusic: cc.AudioClip = null;

    start() {
        // 強制停止上一關卡遺留的音樂
        if (AudioManager.instance) {
            AudioManager.instance.stopBGM(); // 確保 AudioManager 裡有寫這個方法
        }

        // 1. 播放 Game Over 音樂
        if (AudioManager.instance && this.gameOverMusic) {
            AudioManager.instance.playSFX(this.gameOverMusic);
        }

        // 2. 3秒後自動跳回 LevelSelect (或你想去的場景)
        this.scheduleOnce(() => {
            // 重置生命值，準備開始新的一局
            GameManager.lives = 3; 
            cc.director.loadScene("Level1");
        }, 5.0);
    }
}