function expectbuffer(str, buf) {
  var v = new Vim();
  v.input(str);
  return v.getBuffer() == buf;
}
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
  if (expectbuffer(type, expect)) {
    line.className += ' good';
  } else {
    line.className += ' bad';
  }
}
window.onload = function () {
  res = document.createElement('div');
  res.id = 'testresults';
  document.body.appendChild(res);
  t('ihej\x1b', 'hej\n');
  t('Ahej\x1b', 'hej\n');
  t('Chej\x1b', 'hej\n');
  t('Shej\x1b', 'hej\n');
  t('ihej\x1b0Difarvel\x1b', 'farvel\n');
  t('ihej\nhej\x1b0Difarvel\x1b', 'hej\nfarvel\n');
  t('ihej\x1bihej\x1b', 'hehejj\n');
  t('i1\x1bo2\x1bO3\x1b', '1\n3\n2\n');
};
// vim:set sw=2 sts=2 et:
