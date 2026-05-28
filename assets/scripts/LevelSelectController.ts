const {ccclass, property} = cc._decorator;
import { GameManager } from "./GameManager";
import FirebaseManager from "./FirebaseManager";
import { AudioManager } from "./AudioManager";

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) coinLabel: cc.Label = null;
    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) userLabel: cc.Label = null;

    @property(cc.Graphics) topBarGraphics: cc.Graphics = null; 
    @property(cc.AudioClip) bgmClip: cc.AudioClip = null;

    // === 這裡是要補上的變數 ===
    @property({ type: cc.Node, displayName: "Stage 1 按鈕" })
    stage1Btn: cc.Node = null;

    @property({ type: cc.Node, displayName: "Stage 2 按鈕" })
    stage2Btn: cc.Node = null;

    @property({ type: cc.Node, displayName: "打開排行榜按鈕" })
    leaderboardBtn: cc.Node = null;

    private leaderboardView: cc.Node = null; // 用來存排行榜視窗

    @property(cc.Node)
    leaderboardRoot: cc.Node = null;

    // 拖入你剛剛拉好的 5 個 Label
    @property([cc.Label])
    rankLabels: cc.Label[] = [];
    // ========================

    start() {
        this.drawTopBar();

        // 【修改點 1】一進場，立刻先用 GameManager 裡的最新數值刷一次 UI
        // 這樣就算從關卡退出來，畫面也是顯示你剛剛吃到的分數跟金幣，不會變回 0
        this.updateUI();

        if (FirebaseManager.instance && FirebaseManager.instance.uid) {
            this.userLabel.string = "USER: " + FirebaseManager.instance.uid.substring(0, 8) + "...";
        }

        // 【修改點 2】調整 Firebase 讀取邏輯：只在雲端資料真的比較新時才覆蓋
        if (FirebaseManager.instance) {
            FirebaseManager.instance.loadPlayerData((data) => {
                if (data) {
                    cc.log("【選關畫面】雲端資料載入:", data);
                    
                    // 加上安全防線：如果雲端資料比較舊，就「不要」覆蓋 GameManager
                    if ((data.score || 0) > GameManager.score) {
                        GameManager.score = data.score;
                    }
                    if ((data.coins || 0) > GameManager.coins) {
                        GameManager.coins = data.coins;
                    }
                    GameManager.lives = data.lives !== undefined ? data.lives : GameManager.lives;

                    if (data.username) {
                        this.userLabel.string = "USER: " + data.username;
                    }
                    
                    // 覆蓋完後再重新整理一次 UI
                    this.updateUI();
                }
            });
        }

        // 播放音樂
        cc.log("正在嘗試播放音樂..."); 
        if (this.bgmClip) {
            cc.audioEngine.playMusic(this.bgmClip, true);
            cc.audioEngine.setMusicVolume(1.0); 
        } else {
            cc.error("錯誤：bgmClip 欄位是空的！");
        }
    }

    onDestroy() {
        cc.audioEngine.stopMusic();
    }

    // 邏輯風格與 UIManager 一致
    updateUI() {
        // if (this.userLabel) this.userLabel.string = "USER: ";
        
        if (this.lifeLabel) {
            this.lifeLabel.string = "LIFE x " + GameManager.lives;
        }

        if (this.coinLabel) {
            this.coinLabel.string = "COINS x " + String(GameManager.coins).padStart(2, '0');
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = "SCORE: " + String(GameManager.score).padStart(6, '0');
        }
    }

    drawTopBar() {
        if (!this.topBarGraphics) return;

        let g = this.topBarGraphics;
        let w = this.topBarGraphics.node.width;
        let h = this.topBarGraphics.node.height;

        g.clear();
        g.fillColor = cc.color().fromHEX("#42C5FF");
        
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();

        g.strokeColor = cc.Color.BLACK;
        g.lineWidth = 3;
        g.moveTo(-w / 2, -h / 2);
        g.lineTo(w / 2, -h / 2);
        g.stroke();
    }

    onLevelBtnClick(event: cc.Event, levelName: string) {
        cc.log("點擊按鈕，準備進入：" + levelName);
        cc.director.loadScene(levelName);
    }

    // 1. 打開排行榜
    public onOpenLeaderboardClick() {
        if (!this.leaderboardRoot) return;

        // 顯示視窗與動畫
        this.leaderboardRoot.active = true;
        this.leaderboardRoot.setScale(0, 0);
        cc.tween(this.leaderboardRoot).to(0.3, { scale: 1 }, { easing: 'backOut' }).start();

        // 隱藏場景按鈕
        if (this.stage1Btn) this.stage1Btn.active = false;
        if (this.stage2Btn) this.stage2Btn.active = false;
        if (this.leaderboardBtn) this.leaderboardBtn.active = false;

        // 開始撈資料填入你拉好的 Label
        this.fetchLeaderboardData();
    }

    // 2. 撈資料並填入你拉好的 Label
    private fetchLeaderboardData() {
        // 先顯示載入中
        this.rankLabels.forEach(lbl => lbl.string = "Loading...");

        // @ts-ignore
        if (typeof firebase !== 'undefined' && firebase.database) {
            // @ts-ignore
            firebase.database().ref('users').once('value').then((snapshot) => {
                let allUsersData = snapshot.val();
                let userList = [];
                if (allUsersData) {
                    for (let uid in allUsersData) {
                        let u = allUsersData[uid];
                        userList.push({
                            name: u.username || uid.substring(0, 6),
                            score: u.score || 0
                        });
                    }
                }
                userList.sort((a, b) => b.score - a.score);

                // 填入資料到你拉好的 label 陣列中
                for (let i = 0; i < this.rankLabels.length; i++) {
                    if (userList[i]) {
                        this.rankLabels[i].string = `No.${i+1} ${userList[i].name} - SCORE: ${userList[i].score}`;
                    } else {
                        this.rankLabels[i].string = `No.${i+1} ----------`;
                    }
                }
            });
        }
    }

    // 3. 關閉排行榜
    public onCloseLeaderboardClick() {
        if (this.leaderboardRoot) this.leaderboardRoot.active = false;
        
        if (this.stage1Btn) this.stage1Btn.active = true;
        if (this.stage2Btn) this.stage2Btn.active = true;
        if (this.leaderboardBtn) this.leaderboardBtn.active = true;
    }
}