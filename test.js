// Helpful escapes: http://mathiasbynens.be/notes/javascript-escapes#hexadecimal)
var escapes = {
  '\x08': '<BS>',
  '\x7f': '<Del>',
  '\x1b': '<Esc>',
  '\n':   '<CR>'
}
function vimescape(s) {
  var res = s;
  for(var esc in escapes) {
    res = res.replace(new RegExp(esc, "g"), escapes[esc].toString());
  }
  return res;
}
function vimunescape(s) {
  var res = s;
  for(var esc in escapes) {
    res = res.replace(new RegExp(escapes[esc], "g"), esc.toString());
  }
  return res;
}
var res;
var counter;
var tests = 0;
var testfails = 0;
function t(type, expect, vimopt) {
  type = vimunescape(type);
  expect = vimunescape(expect);
  var line = document.createElement('div');
  line.className = 'line';
  line.appendChild(document.createTextNode(vimescape(type)));
  res.appendChild(line);
  var v = new Vim();
  if(vimopt != undefined)
    v.setOpt(vimopt);
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
  t('ihej<Esc>', 'hej<CR>');
  t('Ahej<Esc>', 'hej<CR>');
  t('Chej<Esc>', 'hej<CR>');
  t('Shej<Esc>', 'hej<CR>');
  // 0, D
  t('ihej<Esc>0Difarvel<Esc>', 'farvel<CR>');
  t('iabdx<Esc>Dic<Esc>', 'abcd<CR>');
  t('ihej<CR>hej<Esc>0Difarvel<Esc>', 'hej<CR>farvel<CR>');
  // escape from insert mode moves cursor
  t('ihej<Esc>ihej<Esc>', 'hehejj<CR>');
  // o, O
  t('i1<Esc>o2<Esc>O3<Esc>', '1<CR>3<CR>2<CR>');
  // h, l
  t('iabc<Esc>hid', 'adbc<CR>');
  t('iabc<Esc>0lid', 'adbc<CR>');
  t('iab<Esc>0llic', 'acb<CR>');
  t('ia<CR>bc<Esc>0hid', 'a<CR>dbc<CR>');
  t('ia<Esc>hab', 'ab<CR>');
  t('lia', 'a<CR>');
  // w
  t('ia<CR>b<Esc>kwic', 'a<CR>cb<CR>');
  // e
  t('iab<Esc>0eic', 'acb<CR>');
  t('iab cd<Esc>0eie', 'aeb cd<CR>');
  t('iab cd<Esc>0ede', 'a<CR>');
  t('iab<CR>cd<Esc>k0ede', 'a<CR>');
  // j, k
  t('iabc<CR>def<Esc>kig', 'abgc<CR>def<CR>');
  t('iabc<Esc>Odef<Esc>jig', 'def<CR>abgc<CR>');
  t('iaa<CR>aaa<Esc>kib', 'aba<CR>aaa<CR>');
  t('jia', 'a<CR>');
  t('iab<CR><CR>cd<Esc>kie', 'ab<CR>e<CR>cd<CR>');
  // dd
  t('iabc<Esc>dd', '<CR>');
  t('iabc<Esc>ddidef', 'def<CR>');
  t('iaaa<CR>bbb<Esc>kdd', 'bbb<CR>');
  t('iaaa<CR>bbb<CR>ccc<Esc>kkdd', 'bbb<CR>ccc<CR>');
  t('iaaa<CR>bbb<Esc>dd', 'aaa<CR>');
  t('oa<Esc>ddia', 'a<CR>');
  t('ia<Esc>ddpib', '<CR>ba<CR>');
  t('ia<CR>b<Esc>ddib', 'ba<CR>');
  // dh, dl
  t('iab<Esc>dh', 'b<CR>');
  t('iab<Esc>dl', 'a<CR>');
  // cc
  t('iabc<Esc>ccdef', 'def<CR>');
  // cw, dw
  t('iabc def<Esc>0cwhej<Esc>', 'hej def<CR>');
  t('iabc def<Esc>0dwihej<Esc>', 'hejdef<CR>');
  // ce
  t('iab cd<Esc>0ceef', 'ef cd<CR>');
  // x
  t('iabc<Esc>x', 'ab<CR>');
  // DEL
  t('iabc<Esc><Del>', 'ab<CR>');
  t('iabc<Esc>ha<Del>', 'ab<CR>');
  t('iabc<Esc>hi<Del>', 'ac<CR>');
  // backspace
  t('iabc\b', 'ab<CR>');
  t('iabc<Esc>i\b', 'abc<CR>'); // Backspace doesn't, by default, delete before mode starting point
  t('iabc<Esc>i\b', 'ac<CR>', {backspace:2}); // With this option, it does.
  // A
  t('iaaa<Esc>0Abbb', 'aaabbb<CR>');
  // S
  t('iaaa<Esc>0Sbbb', 'bbb<CR>');
  // C
  t('iaaa<Esc>0lCbb', 'abb<CR>');
  // p
  t('ia<Esc>xp', 'a<CR>');
  t('iab<Esc>xp', 'ab<CR>');
  t('iaa<CR>bb<Esc>dd0p', 'aa<CR>bb<CR>');
  t('ia<Esc>xpp', 'aa<CR>');
  // P
  t('oa<Esc>ddP', 'a<CR><CR>');
  t('iab<Esc>0dlP', 'ab<CR>');
  // u
  t('iaaa<CR>bbb<Esc>ddu', 'aaa<CR>bbb<CR>');
  t('ifoo bar baz<Esc>0dwwdwuaa', 'bar a<CR>');
  // a
  t('ia<Esc>ab', 'ab<CR>');
  // space
  t('iab<CR>cd<Esc>k ie', 'ab<CR>ecd<CR>');
  // y
  t('ia<Esc>ylp', 'aa<CR>');
  // repeat last change
  t('iabc<Esc>x.', 'a<CR>');
  // s
  t('ia<Esc>sb', 'b<CR>');
  // d$
  t('iabc<Esc>0ld$', 'a<CR>');
  // counts
  t('ifoo bar baz<Esc>02wicoq', 'foo bar coqbaz<CR>');
  t('ifoo bar baz<Esc>02eicoq', 'foo bacoqr baz<CR>');
  t('ithis ABC DE line<Esc>0wd2w', 'this line<CR>');
  // r
  t('ia<Esc>rb', 'b<CR>');
  // %
  t('i(f(o)o)(baz)<Esc>0%ibar', '(f(o)obar)(baz)<CR>');
  // f
  t('iqwesd<Esc>0fsia', 'qweasd<CR>');
  // ;
  t('ialaala<Esc>0fa;ik', 'alakala<CR>');
};
// vim:set sw=2 sts=2 et:
