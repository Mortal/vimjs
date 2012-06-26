function vimescape(s) {
  return s.replace(/\x1b/g, '<Esc>')
    .replace(/\n/g, '<CR>');
}
var res;
function t(type, expect) {
  var line = document.createElement('div');
  line.className = 'line';
  line.appendChild(document.createTextNode(vimescape(type)));
  res.appendChild(line);
  var v = new Vim();
  v.input(type);
  var buf = v.getBuffer();
  if (buf == expect) {
    line.className += ' good';
  } else {
    line.className += ' bad';
    line.title = 'Expected:\n'+expect+'\nbut got:\n'+buf;
  }
}
window.onload = function () {
  res = document.createElement('div');
  res.id = 'testresults';
  document.body.appendChild(res);
  // Normal mode keys that enter insert mode
  t('ihej\x1b', 'hej\n');
  t('Ahej\x1b', 'hej\n');
  t('Chej\x1b', 'hej\n');
  t('Shej\x1b', 'hej\n');
  // 0, D
  t('ihej\x1b0Difarvel\x1b', 'farvel\n');
  t('ihej\nhej\x1b0Difarvel\x1b', 'hej\nfarvel\n');
  // escape from insert mode moves cursor
  t('ihej\x1bihej\x1b', 'hehejj\n');
  // o, O
  t('i1\x1bo2\x1bO3\x1b', '1\n3\n2\n');
  // h, l
  t('iabc\x1bhid', 'adbc\n');
  t('iabc\x1b0lid', 'adbc\n');
  // j, k
  t('iabc\ndef\x1bkig', 'abgc\ndef\n');
  t('iabc\x1bOdef\x1bjig', 'def\nabgc\n');
  t('iaa\naaa\x1bkib', 'aba\naaa\n');
  // dd
  t('iabc\x1bdd', '\n');
  t('iabc\x1bddidef', 'def\n');
  t('iaaa\nbbb\x1bkdd', 'bbb\n');
  t('iaaa\nbbb\nccc\x1bkkdd', 'bbb\nccc\n');
  // cc
  t('iabc\x1bccdef', 'def\n');
  // cw, dw
  t('iabc def\x1b0cwhej\x1b', 'hej def\n');
  t('iabc def\x1b0dwihej\x1b', 'hejdef\n');
  // x
  t('iabc\x1bx', 'ab\n');
};
// vim:set sw=2 sts=2 et:
