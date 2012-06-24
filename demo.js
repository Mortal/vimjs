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
  var k = (kc == 13) ? '\n' : String.fromCharCode(kc);
  if (!ev.shiftKey) k = k.toLowerCase();
  vim.input(k);
  update();
}, false);
// vim:set sw=2 sts=2 et:
