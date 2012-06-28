var vimdiv, vim;
window.onload = function () {
  vimdiv = document.getElementById('vim');
  vim = new Vim();
};
function update() {
  var buf = vim.getBuffer();
  var cur = vim.cursor;
  buf = buf.substring(0, cur)+'|'+buf.substring(cur, buf.length);
  vimdiv.textContent = buf;
}
document.addEventListener('keydown', function (ev) {
  var kc = ev.keyCode;
  if (kc != 27 && kc != 13 && kc < 32) return;
  var k;
  if (kc == 13) k = '\n';
  else if (kc == 190) k = '.';
  else if (kc == 188) k = ',';
  else k = String.fromCharCode(kc);
  if (!ev.shiftKey) k = k.toLowerCase();
  console.log(kc,k,ev);
  try {
    vim.input(k);
  } catch (e) {
    if (e instanceof InfiniteLoop) {
      document.body.innerHTML = '<p>Infinite loop</p><div id=vim></div>';
    } else {
      throw e;
    }
  }
  update();
}, false);
// vim:set sw=2 sts=2 et:
