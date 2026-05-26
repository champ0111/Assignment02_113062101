const {ccclass, property} = cc._decorator;

@ccclass
export class AudioManager extends cc.Component {

    public static instance: AudioManager = null;

    // 記錄目前正在播放的 Clip，避免重複播放
    private currentClip: cc.AudioClip = null;

    @property(cc.AudioClip)
    bgmClip: cc.AudioClip = null; // 改成單一檔案，不用陣列了

    @property([cc.AudioClip])
    sfxList: cc.AudioClip[] = [];

    onLoad() {
        AudioManager.instance = this;
        cc.game.addPersistRootNode(this.node); // 讓音樂不因切換場景而中斷
    }

    public stopBGM() {
        cc.audioEngine.stopMusic();
    }

    // AudioManager.ts
    public playBGM() {
        // 檢查是不是已經在播了，如果是就直接跳出，不用重播
        if (cc.audioEngine.isMusicPlaying()) return;

        if (this.bgmClip) {
            cc.audioEngine.playMusic(this.bgmClip, true);
        }
    }

    // 在 AudioManager.ts 中
    public playSFX(clip: cc.AudioClip) {
        // 播放音效，不影響 BGM
        cc.audioEngine.playEffect(clip, false);
    }

    public pauseBGM() {
        cc.audioEngine.pauseMusic();
    }
}