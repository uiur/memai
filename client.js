window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.secondRequestAnimationFrame;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.secondGetUserMedia;

var GIFWorker = {
  init: function (args) {
    this.worker = new Worker('gif/encoder.js');
  },
  start: function (args) {
    this.worker.postMessage({ cmd: 'start', data: this.initOption(args) });
  },
  initOption: function (args) {
    args = args || {};
    return {
      delay: args.delay || 100,
      repeat: args.repeat || 0,  // default: auto loop
      width: args.width || 640,
      height: args.height || 480
    };
  },
  addFrame: function (context) {
    this.worker.postMessage({ cmd: 'frame', data: context.getImageData(0, 0, canvas.width, canvas.height).data });
  },
  finish: function () {
    this.worker.postMessage({ cmd: 'finish' });
  },
  encode64: function (input) {
    var output = "", i = 0, l = input.length,
    key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
    chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    while (i < l) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) enc3 = enc4 = 64;
      else if (isNaN(chr3)) enc4 = 64;
      output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
    }
    return output;
  },
  onFinish: function (callback) {
    var self = this;
    this.worker.addEventListener('message', function (e) {
      var dataURL = 'data:image/gif;base64,' + self.encode64(e.data);
      callback(dataURL);
    });
  }
};

$(function () {
  var canvas = $('#canvas')[0]
    , context = canvas.getContext('2d')
    , video = $('#video')[0];

  var frame = 1, rec = false;
  var rec_frame_count = 0, rec_frame_number, fps;

  var $loader = $('<img>').attr('src', 'ajax-loader.gif').hide().appendTo('body');

  GIFWorker.init();

  function success(stream) {
    video.src = window.URL.createObjectURL(stream);
    video.play();
  }

  function error(e) {
    alert(e);
  }
  
  function loop() {
    context.drawImage(video, 0, 0);

    if (rec) {
      if (rec_frame_count >= rec_frame_number) {
        GIFWorker.finish();
        rec = false;
        rec_frame_count = 0;
        $('#button').text('Processing');
        $loader.show();
      } 
      else if (frame % (60 / fps) === 0) {
        GIFWorker.addFrame(context);
        rec_frame_count++;
      }
    }
    frame++;

    window.requestAnimationFrame(loop);
  }

  navigator.getUserMedia({ video: true }, success, error);

  loop();

  GIFWorker.onFinish(function (dataURL) {
    $('<img>').attr('src', dataURL).appendTo('#images');
    $('#button').text('撮る').attr('disabled', false);
    $loader.hide();
  });

  $('#button').click(function () {
    rec = true;
    $(this).text('●REC').attr('disabled', true);
    fps = +$('#fps').val();
    rec_frame_number = fps * (+$('#second').val());

    GIFWorker.start({ delay: +$('#delay').val() });

    return false;
  });

  var $second = $("#second"), $second_value = $("#second_value")
    , $fps = $("#fps"), $fps_value = $("#fps_value")
    , $delay = $("#delay"), $delay_value = $("#delay_value");

  $second_value.text($second.val());
  $second.on('change', _.throttle(function () {
    $second_value.text($(this).val());
  }, 50));

  $("#fps_value").text($fps.val());
  $fps.on('change', _.throttle(function () {
    $fps_value.text($(this).val());
  }, 50));

  $("#delay_value").text($("#delay").val());
  $delay.on('change', _.throttle(function () {
    $delay_value.text($(this).val());
  }, 50));

  function setExample (second, fps, delay) {
    return function () {
      $second.val(second);
      $second_value.text(second);

      $fps.val(fps);
      $fps_value.text(fps);

      $delay.val(delay);
      $delay_value.text(delay);

      return false;
    };
  }

  setExample(3, 5, 200)();

  // 便利ボタン
  $('#slow').click(setExample(1, 20, 500));  // スロー再生風
  $('#fast').click(setExample(5, 2, 5));     // すばやい
  $('#smooth').click(setExample(2, 10, 100));   // なめらか
});
