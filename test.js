// http://mathiasbynens.be/notes/javascript-escapes#hexadecimal)
function vimescape(s) {
  return s.replace(/\x1b/g, '<Esc>')
          .replace(/\x7f/g, '<Del>')
          .replace(/\ch/g,  '<BS>')
          .replace(/\n/g,   '<CR>')
}
var res;
var counter;
var tests = 0;
var testfails = 0;
function t(type, expect, vimopt) {
  var line = document.createElement('div');
  line.className = 'line';
  line.appendChild(document.createTextNode(vimescape(type)));
  res.appendChild(line);
  var v = new Vim();
  var buf = 'Couldn\'t get buffer';
  try {
    v.input(type);
    buf = v.getBuffer();
  } catch (e) {
    if (e instanceof InfiniteLoop) {
    } else {
      line.className += ' bad';
      line.title = 'Expected:\n'+expect+'\nbut got exception:\n'+e;
      testfails++;
      return;
    }
  }
  if (buf == expect) {
    line.className += ' good';
  } else {
    line.className += ' bad';
    line.title = 'Expected:\n'+expect+'\nbut got:\n'+buf;
    testfails++;
  }
  setCounter(++tests, testfails);
}
function setCounter(n, failn) {
  if (n == 1) n += ' test';
  else if (failn == 1) n += ' tests, 1 failure.';
  else n += ' tests, ' + failn + ' failures.';
  counter.innerHTML = n;
}
window.onload = function () {
  res = document.createElement('div');
  res.id = 'testresults';
  document.body.appendChild(res);
  counter = document.body.appendChild(document.createElement('span'));
  setCounter(0,0);
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
  t('iab\x1b0llic', 'acb\n');
  t('ia\nbc\x1b0hid', 'a\ndbc\n');
  t('ia\x1bhab', 'ab\n');
  t('lia', 'a\n');
  // w
  t('ia\nb\x1bkwic', 'a\ncb\n');
  // e
  t('iab\x1b0eic', 'acb\n');
  t('iab cd\x1b0eie', 'aeb cd\n');
  t('iab cd\x1b0ede', 'a\n');
  t('iab\ncd\x1bk0ede', 'a\n');
  // j, k
  t('iabc\ndef\x1bkig', 'abgc\ndef\n');
  t('iabc\x1bOdef\x1bjig', 'def\nabgc\n');
  t('iaa\naaa\x1bkib', 'aba\naaa\n');
  t('jia', 'a\n');
  t('iab\n\ncd\x1bkie', 'ab\ne\ncd\n');
  // dd
  t('iabc\x1bdd', '\n');
  t('iabc\x1bddidef', 'def\n');
  t('iaaa\nbbb\x1bkdd', 'bbb\n');
  t('iaaa\nbbb\nccc\x1bkkdd', 'bbb\nccc\n');
  t('iaaa\nbbb\x1bdd', 'aaa\n');
  t('oa\x1bddia', 'a\n');
  t('ia\x1bddpib', '\nba\n');
  t('ia\nb\x1bddib', 'ba\n');
  // dh, dl
  t('iab\x1bdh', 'b\n');
  t('iab\x1bdl', 'a\n');
  // cc
  t('iabc\x1bccdef', 'def\n');
  // cw, dw
  t('iabc def\x1b0cwhej\x1b', 'hej def\n');
  t('iabc def\x1b0dwihej\x1b', 'hejdef\n');
  // ce
  t('iab cd\x1b0ceef', 'ef cd\n');
  // x
  t('iabc\x1bx', 'ab\n');
  // DEL
  t('iabc\x1b\x7f', 'ab\n');
  t('iabc\x1bha\x7f', 'ab\n');
  t('iabc\x1bhi\x7f', 'ac\n');
  // backspace
  t('iabc\b', 'ab\n');
  t('iabc\x1bi\b', 'abc\n'); // Backspace doesn't, by default, delete before mode starting point
  t('iabc\x1bi\b', 'ac\n', {backspace:2}); // With this option, it does.
  // A
  t('iaaa\x1b0Abbb', 'aaabbb\n');
  // S
  t('iaaa\x1b0Sbbb', 'bbb\n');
  // C
  t('iaaa\x1b0lCbb', 'abb\n');
  // p
  t('ia\x1bxp', 'a\n');
  t('iab\x1bxp', 'ab\n');
  t('iaa\nbb\x1bdd0p', 'aa\nbb\n');
  t('ia\x1bxpp', 'aa\n');
  // P
  t('oa\x1bddP', 'a\n\n');
  t('iab\x1b0dlP', 'ab\n');
  // u
  t('iaaa\nbbb\x1bddu', 'aaa\nbbb\n');
  t('ifoo bar baz\x1b0dwwdwuaa', 'bar a\n');
  // a
  t('ia\x1bab', 'ab\n');
  // space
  t('iab\ncd\x1bk ie', 'ab\necd\n');
  // y
  t('ia\x1bylp', 'aa\n');
  // repeat last change
  t('iabc\x1bx.', 'a\n');
  // s
  t('ia\x1bsb', 'b\n');
  // d$
  t('iabc\x1b0ld$', 'a\n');
  // counts
  t('ifoo bar baz\x1b02wicoq', 'foo bar coqbaz\n');
  t('ifoo bar baz\x1b02eicoq', 'foo bacoqr baz\n');
  t('ithis ABC DE line\x1b0wd2w', 'this line\n');
  // r
  t('ia\x1brb', 'b\n');
  // %
  t('i(f(o)o)(baz)\x1b0%ibar', '(f(o)obar)(baz)\n');
  // f
  t('iqwesd\x1b0fsia', 'qweasd\n');
  // ;
  t('ialaala\x1b0fa;ik', 'alakala\n');
};
// vim:set sw=2 sts=2 et:
