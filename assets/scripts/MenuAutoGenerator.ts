// assets/Scripts/MenuAutoGenerator.ts

const { ccclass, property } = cc._decorator;

@ccclass
export default class MenuAutoGenerator extends cc.Component {

    private loginPopup: cc.Node = null;
    private usernameInput: cc.EditBox = null;

    onLoad() {
        let canvasNode: cc.Node = cc.find("Canvas");
        if (!canvasNode) {
            canvasNode = this.node; 
        }

        cc.log("Menu 腳本成功啟動！開始建構 UI...");

        // 1. 建立一個藍灰色基底背景 (防止黑畫面)
        let baseBg = new cc.Node("BaseBg");
        let baseCtx = baseBg.addComponent(cc.Graphics);
        baseCtx.fillColor = cc.color(50, 70, 90); 
        baseCtx.fillRect(-canvasNode.width/2, -canvasNode.height/2, canvasNode.width, canvasNode.height);
        canvasNode.addChild(baseBg);
        baseBg.setSiblingIndex(0);

        // 2. 改用 cc.loader.loadRes 套用背景 menu_bg 
        this.createImageBackground(canvasNode, "menu_bg"); 

        // 3. 建立遊戲標題
        this.createLabel(canvasNode, "WEB MARIO", 0, 150, 60);

        // 4. 建立 LOG IN 按鈕：套用藍色按鈕三態
        this.createCustomButton(canvasNode, "LOG IN", 0, 20, 200, 60, 
            "button_blue", "button_blue_hover", "button_blue_press", () => {
                this.onShowLogin();
            }
        );

        // 5. 建立 SIGN UP 按鈕：套用橘色按鈕三態
        this.createCustomButton(canvasNode, "SIGN UP", 0, -60, 200, 60, 
            "button_orange", "button_orange_hover", "button_oriange_press", () => {
                this.onShowLogin();
            }
        );

        // 6. 動態建構 Login 彈窗
        this.buildLoginPopup(canvasNode);
    }

    // 動態載入全螢幕背景 (改用 cc.loader.loadRes)
    createImageBackground(parent: cc.Node, imageName: string) {
        let bgNode = new cc.Node("GameBackground");
        bgNode.setPosition(0, 0);
        let sprite = bgNode.addComponent(cc.Sprite);
        
        // 使用 2.x 最穩定的 cc.loader.loadRes
        cc.loader.loadRes(imageName, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (err) {
                cc.warn("背景圖載入失敗，使用預設純色底。錯誤原因: ", err);
                return;
            }
            if (cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
                bgNode.setContentSize(parent.width, parent.height);
            }
        });

        parent.addChild(bgNode);
        bgNode.setSiblingIndex(1); 
    }

    // 動態建構精美彈窗 UI
    buildLoginPopup(parent: cc.Node) {
        this.loginPopup = new cc.Node("LoginPopup");
        this.loginPopup.setContentSize(400, 300);
        this.loginPopup.setPosition(0, 0);
        
        let ctx = this.loginPopup.addComponent(cc.Graphics);
        ctx.fillColor = cc.color(30, 30, 30, 245);
        ctx.fillRect(-200, -150, 400, 300);
        parent.addChild(this.loginPopup);

        this.createLabel(this.loginPopup, "ENTER YOUR NAME", 0, 100, 24);

        // --- 建立輸入框 ---
        let editBoxNode = new cc.Node("UsernameInput");
        editBoxNode.setContentSize(260, 55);
        editBoxNode.setPosition(0, 20);
        this.loginPopup.addChild(editBoxNode);

        let editBgSprite = editBoxNode.addComponent(cc.Sprite);
        editBgSprite.type = cc.Sprite.Type.SLICED; 
        
        // 改用 cc.loader.loadRes
        cc.loader.loadRes("text_area_0", cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (!err && cc.isValid(editBgSprite) && spriteFrame) {
                editBgSprite.spriteFrame = spriteFrame;
            }
        });

        this.usernameInput = editBoxNode.addComponent(cc.EditBox);
        this.usernameInput.string = "";
        this.usernameInput.placeholder = "Username...";
        this.usernameInput.placeholderFontColor = cc.color(120, 120, 120);
        this.usernameInput.fontColor = cc.color(255, 255, 255);
        this.usernameInput.inputMode = cc.EditBox.InputMode.SINGLE_LINE;

        this.createCustomButton(this.loginPopup, "ENTER", 0, -60, 130, 45, 
            "button_gray", "button_gray", "button_gray", () => {
                this.onEnterGame();
            }
        );

        this.createCustomButton(this.loginPopup, "X", 170, 120, 40, 40, 
            "button_gray", "button_gray", "button_gray", () => {
                this.onCloseLogin();
            }
        );

        this.loginPopup.active = false;
    }

    createLabel(parent: cc.Node, text: string, x: number, y: number, fontSize: number): cc.Node {
        let node = new cc.Node("Label_" + text);
        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize;
        node.setPosition(x, y);
        parent.addChild(node);
        return node;
    }

    createCustomButton(parent: cc.Node, text: string, x: number, y: number, width: number, height: number, normalImg: string, hoverImg: string, pressedImg: string, callback: Function) {
        let node = new cc.Node("Btn_" + text);
        node.setContentSize(width, height);
        node.setPosition(x, y);

        let sprite = node.addComponent(cc.Sprite);
        let button = node.addComponent(cc.Button);
        
        let ctx = node.addComponent(cc.Graphics);
        ctx.fillColor = cc.color(180, 50, 50);
        ctx.fillRect(-width/2, -height/2, width, height);

        button.transition = cc.Button.Transition.SPRITE;

        // 改用 cc.loader.loadRes
        cc.loader.loadRes(normalImg, cc.SpriteFrame, (err, sf: cc.SpriteFrame) => {
            if (!err && cc.isValid(button) && sf) {
                ctx.clear(); 
                sprite.type = cc.Sprite.Type.SLICED; 
                sprite.spriteFrame = sf;
                button.normalSprite = sf;
            }
        });
        cc.loader.loadRes(hoverImg, cc.SpriteFrame, (err, sf: cc.SpriteFrame) => {
            if (!err && cc.isValid(button) && sf) button.hoverSprite = sf;
        });
        cc.loader.loadRes(pressedImg, cc.SpriteFrame, (err, sf: cc.SpriteFrame) => {
            if (!err && cc.isValid(button) && sf) button.pressedSprite = sf;
        });

        this.createLabel(node, text, 0, 0, height * 0.35);
        node.on(cc.Node.EventType.TOUCH_END, callback, this);

        parent.addChild(node);
    }

    onShowLogin() {
        if (this.loginPopup) this.loginPopup.active = true;
    }

    onCloseLogin() {
        if (this.loginPopup) this.loginPopup.active = false;
    }

    onEnterGame() {
        let name = this.usernameInput.string.trim();
        if (name === "") name = "GUEST";
        
        localStorage.setItem("Mario_Username", name);
        cc.log("玩家登入成功: " + name);
        
        cc.director.loadScene("LevelSelect"); 
    }
}