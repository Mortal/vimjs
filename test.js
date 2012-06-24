function expectbuffer(str, buf) {
  var v = new Vim();
  v.input(str);
  return v.getBuffer() == buf;
}
function vimescape(s) {
  return s.replace(/\x1b/g, '<Esc>');
}
function runtests() {
  var res = document.createElement('div');
  res.id = 'testresults';
  document.body.appendChild(res);
  var tests = arguments;
  for (var i = 0, l = tests.length; i < l; ++i) {
    var line = document.createElement('div');
    line.className = 'line';
    line.appendChild(document.createTextNode(vimescape(tests[i][0])));
    res.appendChild(line);
    if (expectbuffer(tests[i][0], tests[i][1])) {
      line.className += ' good';
    } else {
      line.className += ' bad';
    }
  }
}
window.onload = function () {
  runtests(
    ['ihej\x1b', 'hej\n']
  );
};
// vim:set sw=2 sts=2 et:
