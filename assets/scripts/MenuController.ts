const {ccclass, property} = cc._decorator;

import FirebaseManager from "./FirebaseManager";
import { GameManager } from "./GameManager"; // 👈 確保最上方有這行

@ccclass
export default class MenuController extends cc.Component {
    @property(cc.Node) signUpPopup: cc.Node = null;
    @property(cc.Node) signInPopup: cc.Node = null;

    @property(cc.Node) signUpBtn: cc.Node = null;
    @property(cc.Node) signInBtn: cc.Node = null;

    @property(cc.Node) alertPopup: cc.Node = null;
    @property(cc.Label) alertLabel: cc.Label = null;
    
    @property(cc.Node) titleNode: cc.Node = null; 

    showSignUp() { 
        this.signUpPopup.active = true; 
        this.toggleMainUI(false);
    }
    
    showSignIn() { 
        this.signInPopup.active = true; 
        this.toggleMainUI(false);
    }

    // [修正] 關閉視窗時，同時關閉 AlertPopup
    closePopups() {
        this.signUpPopup.active = false;
        this.signInPopup.active = false;
        this.closeAlert(); // 確保 Alert 也被關掉
        this.toggleMainUI(true);
    }

    toggleMainUI(show: boolean) {
        if (this.signUpBtn) this.signUpBtn.active = show;
        if (this.signInBtn) this.signInBtn.active = show;
        if (this.titleNode) this.titleNode.active = show;
    }

    onSignUpConfirmed() {
        // 取得各個 Input 的內容
        const email = this.signUpPopup.getChildByName("EmailInput").getComponent(cc.EditBox).string;
        const pass = this.signUpPopup.getChildByName("PasswordInput").getComponent(cc.EditBox).string;
        const name = this.signUpPopup.getChildByName("NameInput").getComponent(cc.EditBox).string;

        // 檢查名稱是否為空
        if (!name || name.trim() === "") {
            this.showAlert("Please enter a username.");
            return;
        }

        FirebaseManager.instance.signUp(email, pass, name, (success) => {
            if (success) {
                cc.log("Sign up successful");
                
                // 💡 修正點：直接重設，不用 require
                GameManager.score = 0;
                GameManager.coins = 0;
                GameManager.lives = 3;

                this.closePopups(); 
                cc.director.loadScene("LevelSelect");
            } else {
                this.showAlert("Sign up failed. Please check your format.");
            }
        });
    }

    onSignInConfirmed() {
        const email = this.signInPopup.getChildByName("EmailInput").getComponent(cc.EditBox).string;
        const pass = this.signInPopup.getChildByName("PasswordInput").getComponent(cc.EditBox).string;

        if (!email || !pass) {
            this.showAlert("Please enter email and password.");
            return;
        }

        FirebaseManager.instance.signIn(email, pass, (success) => {
            if (success) {
                cc.log("Sign in successful, fetching player data...");
                
                // 💡 修正點：直接呼叫 loadPlayerData，不用 require
                FirebaseManager.instance.loadPlayerData((data) => {
                    if (data) {
                        // 因為最上方已經有 import { GameManager }，這裡可以直接用
                        GameManager.score = data.score || 0;
                        GameManager.coins = data.coins || 0;
                        GameManager.lives = data.lives || 3;
                        cc.log("【主選單】雲端資料同步至記憶體成功！分數:", GameManager.score, "金幣:", GameManager.coins);
                    } else {
                        cc.warn("【主選單】查無雲端存檔，使用預設值開局");
                    }

                    this.closePopups();
                    cc.director.loadScene("LevelSelect");
                });

            } else {
                this.showAlert("Sign in failed! Please check your credentials."); 
            }
        });
    }

    showAlert(message: string) {
        if (this.alertLabel) {
            this.alertLabel.string = message;
        }
        this.alertPopup.active = true;
        this.alertPopup.zIndex = 999;
    }

    closeAlert() {
        this.alertPopup.active = false;
    }
}