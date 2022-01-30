import 'pixi';
import 'p2';
import App from './states/App';

declare global {
  interface Window {
    app: App;
    cordova: any;
  }
}

window.app = new App()

if (window.cordova) {
  var app = {
    initialize: function () {
      document.addEventListener(
        'deviceready',
        this.onDeviceReady.bind(this),
        false
      )
    },

    // deviceready Event Handler
    //
    onDeviceReady: function () {
      this.receivedEvent('deviceready');

      // When the device is ready, start Phaser Boot state.
      window.app.state.start('Boot');
    },

    receivedEvent: function (id: any) {
      console.log('Received Event: ' + id);
    }
  }

  app.initialize();
}
