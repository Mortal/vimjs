// Input mapping
var keyMap = {
  8:   '\b',
  13:  '\n',
  46:  '\x7f', // Delete
  188: ',',
  190: '.'
}
function keyDownToChar(ev) { // This function is going to be quite the beast.
  var kc = ev.keyCode;
  if ((   kc != 27 // Ignore control-characters
       && kc != 13
       && kc != 8
       && kc < 32)
      || (kc > 111 && kc < 124) // Ignore F-keys
      ) return '';
  var k;

  var mapFound = false;
  for(var code in keyMap)
    if(kc == code) mapFound = true;

  if(mapFound) k = keyMap[kc];
  else if(ev.shiftKey) k = String.fromCharCode(kc);
  else k = String.fromCharCode(kc).toLowerCase();

  console.log(kc,k,ev);
  return k;
}

// Vim-visual stuff
var vimdiv, errordiv, statuslinediv, vim;
window.onload = function () {
  vimdiv = document.getElementById('vim');
  vim = new Vim();
  statuslinediv = document.getElementById('statusline');
};
function update() {
  var buf = vim.getBuffer();
  var cur = vim.cursor;
  buf = buf.substring(0, cur)+'|'+buf.substring(cur, buf.length);
  vimdiv.textContent = buf;
  statuslinediv.textContent = vim.getStatusline();
}
document.addEventListener('keydown', function (ev) {
  var k = keyDownToChar(ev);
  try {
    vim.input(k);
  } catch (e) {
    if (e instanceof InfiniteLoop) {
      if (!errordiv) {
        errordiv = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
        errordiv.id = 'error';
      }
      errordiv.innerHTML = 'Infinite loop';
    } else {
      throw e;
    }
  }
  ev.preventDefault();
  update();
}, false);
// vim:set sw=2 sts=2 et:
