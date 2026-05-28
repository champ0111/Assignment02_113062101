const {ccclass, property} = cc._decorator;

// 在最上方強制宣告 firebase 變數，避免 TypeScript 報錯
declare var firebase: any;

@ccclass
export default class FirebaseManager extends cc.Component {

    public static instance: FirebaseManager = null; // 這行必須存在
    public uid: string = null;

    onLoad() {
        if (FirebaseManager.instance === null) {
            FirebaseManager.instance = this;
            cc.game.addPersistRootNode(this.node); // 設為常駐
            this.checkAndInit();
        } else {
            // 如果已經有一個了，就毀掉自己，避免重複
            this.node.destroy();
        }
    }

    public signUp(email, pass, name, callback) {
        firebase.auth().createUserWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                this.uid = userCredential.user.uid;
                
                // 註冊成功後，自動建立初始資料並寫入名稱
                const initialData = {
                    username: name, // 使用使用者輸入的名稱
                    score: 0,
                    coins: 0,
                    lives: 3
                };
                
                firebase.database().ref('users/' + this.uid).set(initialData)
                    .then(() => {
                        cc.log("Account created and data initialized");
                        callback(true);
                    })
                    .catch((error) => {
                        cc.error("Database init failed: ", error);
                        callback(false);
                    });
            })
            .catch((error) => { cc.error(error); callback(false); });
}

    public signIn(email, pass, callback) {
        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                // 💡 關鍵修正：必須把登入成功後的 uid 存下來，後續存檔才抓得到人
                this.uid = userCredential.user.uid;
                cc.log("【Firebase】登入成功，已記錄 UID: " + this.uid);
                callback(true);
            })
            .catch((error) => { 
                cc.error("【Firebase】登入失敗: ", error); 
                callback(false); 
            });
    }
    // ----------------------------

    checkAndInit() {
        // 檢查全域變數是否存在
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            cc.log("Firebase SDK 已經偵測到，準備初始化...");
            this.runInit();
        } else {
            cc.log("Firebase SDK 未找到，正在從網路動態載入...");
            this.loadScript("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js", () => {
                this.loadScript("https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js", () => {
                    this.loadScript("https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js", () => {
                        this.runInit();
                    });
                });
            });
        }
    }

    loadScript(url: string, callback: Function) {
        let script = document.createElement('script');
        script.src = url;
        script.onload = () => callback();
        document.head.appendChild(script);
    }

    runInit() {
        const config = {
            apiKey: "AIzaSyDAYJt4b8wwuaqvPueGBtnMyrtPhWFOiG4",
            authDomain: "mywebmario-80c27.firebaseapp.com",
            databaseURL: "https://mywebmario-80c27-default-rtdb.firebaseio.com",
            projectId: "mywebmario-80c27",
            storageBucket: "mywebmario-80c27.firebasestorage.app",
            messagingSenderId: "806485325740",
            appId: "1:806485325740:web:7b88823b2ba68a7ed82c09"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(config);
            cc.log("Firebase 初始化完成！");

            // 💡 關鍵修正：加上這段監聽。當玩家重新整理網頁時，Firebase 會自動重新認證，紀錄才不會不見
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.uid = user.uid;
                    cc.log("【Firebase】自動偵測已登入身份，UID: " + this.uid);
                } else {
                    this.uid = null;
                }
            });
        }
    }

    // FirebaseManager.ts
    public savePlayerData(data: any, callback?: Function) {
        const user = firebase.auth().currentUser;
        if (!user) {
            cc.error("【存檔失敗】找不到當前登入的使用者");
            if (callback) callback();
            return;
        }

        // 用 update 局部更新，才不會蓋掉其他的用戶資料（如 username）
        firebase.database().ref('users/' + user.uid).update(data)
            .then(() => {
                cc.log("【Firebase】伺服器確認成功寫入雲端！");
                if (callback) callback(); // 💡 成功了！通知 UIManager 可以切場景了
            })
            .catch((error) => {
                cc.error("【Firebase】寫入失敗！", error);
                if (callback) callback(); 
            });
    }

    public loadPlayerData(callback: Function) {
        const user = firebase.auth().currentUser;
        if (user) {
            cc.log("當前登入使用者 UID:", user.uid);
            firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    callback(data);
                })
                .catch((error) => cc.error("讀取權限被拒絕 (檢查規則):", error));
        } else {
            cc.error("讀取失敗：尚未登入！");
        }
    }
}