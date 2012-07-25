function keydebug() {
  return ('undefined' != typeof console)
    ? console.log.apply(console, arguments)
    : null;
}
function translate_key_down(ev) { // This function is going to be quite the beast.
  if (ev.altKey) return null;

  var kc = ev.keyCode;
  keydebug("Key code ",kc);
  // Input mapping
  var keyMap = {
    8:   '\b',
    13:  '\n',
    27:  '\x1b', // escape
    46:  '\x7f', // Delete
    188: ',',
    190: '.'
  };

  if ('undefined' != typeof keyMap[kc])
    return keyMap[kc];

  if (65 <= kc && kc <= 90) {
    if (ev.ctrlKey)
      return String.fromCharCode(kc-64);
    else if (ev.shiftKey)
      return String.fromCharCode(kc);
    else
      return String.fromCharCode(kc+32);
  }
  if (219 <= kc && kc <= 221) {
    if (ev.ctrlKey)
      return String.fromCharCode(kc-192);
    else if (ev.shiftKey)
      return String.fromCharCode(kc-96);
    else
      return String.fromCharCode(kc-128);
  }

  return null;
}
function translate_key_press(ev) {
  var cc = ev.charCode;
  keydebug("Char code ",cc);
  if (!cc) return null;
  if (65 <= cc && cc <= 90) return null; // A-Z
  if (97 <= cc && cc <= 122) return null; // a-z
  var c = String.fromCharCode(cc);
  if ('[\\]{|}'.indexOf(c) != -1) return null;
  return c;
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
function vimescape(k) {
  if (k == '\x1b') return '<Esc>';
  if (k == ' ') return '<SP>';
  if (k == '\x7f') return '<BS>';
  if ('string' == typeof k && k.length == 1 && k.charCodeAt(0) < 32) return '0x'+k.charCodeAt(0).toString(16);
  return k;
}
var onKey = function(ev, k) {
  try {
    if (vim.input(k)) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  } catch (e) {
    if (e instanceof InfiniteLoop) {
      if (!errordiv) {
        errordiv = document.body.insertBefore(document.createElement('div'), document.body.firstChild);
        errordiv.id = 'error';
      }
      errordiv.innerHTML = 'Infinite loop';
      return;
    } else {
      throw e;
    }
  }
  update();
};
document.addEventListener('keydown', function (ev) {
  var k = translate_key_down(ev);
  if (k == null) return;
  keydebug("Key down event translated to char ",vimescape(k),ev);
  return onKey(ev, k);
}, false);
document.addEventListener('keypress', function (ev) {
  var k = translate_key_press(ev);
  if (k == null) return;
  keydebug("Key press event translated to char ",vimescape(k));
  return onKey(ev, k);
}, false);
// vim:set sw=2 sts=2 et:
