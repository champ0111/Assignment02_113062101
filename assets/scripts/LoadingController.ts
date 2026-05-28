const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadingController extends cc.Component {
    
    // 用一個靜態變數來儲存「目標場景」
    public static targetScene: string = "Level1"; 

    start() {
        // 簡單的延遲，確保畫面顯示
        this.scheduleOnce(() => {
            cc.director.loadScene(LoadingController.targetScene);
        }, 2.0); // 停留 1.5 秒
    }
}