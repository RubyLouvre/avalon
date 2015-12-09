var expect = require('chai').expect
  , through = require('through')
  , fs = require('fs')
  , replaceStream = require('..');

function script(inner) {
  return [
    '<script type="text/javascript">',
    inner,
    '</script>'
  ].join('\n');
}

describe('replace', function () {
  it('should be able to replace within a chunk', function (done) {
    var haystack = [
      '<!DOCTYPE html>',
      '<html>',
      ' <head>',
      '   <title>Test</title>',
      ' </head>',
      ' <body>',
      '   <h1>Head</h1>',
      ' </body>',
      '</html>'
    ].join('\n');

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include(inject);
      done();
    });

    replace.write(haystack);
    replace.end();
  });

  it('should be able to replace between chunks', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include(inject);
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle no matches', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </de'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.not.include(inject);
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle dangling tails', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n')
    ];

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
    var replace = replaceStream('</head>', inject + '</head>');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include('</he');
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to handle multiple searches and replaces',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream('</p>', ', world</p>');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1, world</p>',
          ' <p> Hello 2, world</p>',
          ' <p> Hello 3, world</p>',
          ' <p> Hello 4, world</p>',
          ' <p> Hello 5, world</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(acc).to.equal(expected);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

  it('should be able to handle a limited searches and replaces',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream('</p>', ', world</p>', { limit: 3 });
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1, world</p>',
          ' <p> Hello 2, world</p>',
          ' <p> Hello 3, world</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(acc).to.equal(expected);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

  it('should be able to customize the regexp options',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <P> Hello 1</P>',
          ' <P> Hello 2</'
        ].join('\n'),
        [               'P>',
          ' <P> Hello 3</P>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream('</P>', ', world</P>', { regExpOptions: 'gm' });
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <P> Hello 1, world</P>',
          ' <P> Hello 2, world</P>',
          ' <P> Hello 3, world</P>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(acc).to.equal(expected);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

 it('should replace characters specified and not modify partial matches', function (done) {
    var haystack = [
      'ab',
      'a',
      'a',
      'b'
    ].join('\n');

    var acc = '';
    var replace = replaceStream('ab','Z');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
        var expected = [
        'Z',
        'a',
        'a',
        'b'
      ].join('\n');

      expect(acc).to.equal(expected);
      done();
    });

    replace.write(haystack);
    replace.end();
  });

  it('should handle partial matches between complete matches', function (done) {
    var haystack = [
      "ab",
      'a',
      'ab',
      'b'
    ].join('\n');

    var acc = '';
    var replace = replaceStream('ab','Z');

    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
        var expected = [
        'Z',
        'a',
        'Z',
        'b'
      ].join('\n');

      expect(acc).to.equal(expected);
      done();
    });

    replace.write(haystack);
    replace.end();
  });

  it('should only replace characters specified', function (done) {
    var haystack = [
      'ab',
      'a',
      'b'
    ].join('\n');

    var acc = '';
    var replace = replaceStream('ab','Z');
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
        var expected = [
        'Z',
        'a',
        'b'
      ].join('\n');

      expect(acc).to.equal(expected);
      done();
    });

    replace.write(haystack);
    replace.end();
  });

  it('should be able to use a replace function', function (done) {
    var haystacks = [
      [ '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </he'
      ].join('\n'),
      [      'ad>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n'),
    ];

    var acc = '';
    var inject = script(fs.readFileSync('./test/fixtures/inject.js'));

    function replaceFn(match) {
      expect(match).to.equal('</head>');
      return inject + '</head>';
    }

    var replace = replaceStream('</head>', replaceFn);
    replace.on('data', function (data) {
      acc += data;
    });
    replace.on('end', function () {
      expect(acc).to.include(inject);
      done();
    });

    haystacks.forEach(function (haystack) {
      replace.write(haystack);
    });

    replace.end();
  });

  it('should be able to change each replacement value with a function',
    function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hello 1</p>',
          ' <p> Hello 2</'
        ].join('\n'),
        [               'p>',
          ' <p> Hello 3</p>',
          ' <p> Hello 4</p>',
          ' <p> Hello 5</p>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';

      var greetings = ['Hi', 'Hey', 'Gday', 'Bonjour', 'Greetings'];
      function replaceFn(match) {
        return greetings.shift();
      }

      var replace = replaceStream('Hello', replaceFn);
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        var expected = [
          '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          ' <p> Hi 1</p>',
          ' <p> Hey 2</p>',
          ' <p> Gday 3</p>',
          ' <p> Bonjour 4</p>',
          ' <p> Greetings 5</p>',
          ' </body>',
          '</html>'
        ].join('\n');
        expect(acc).to.equal(expected);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });
    it('should be able to replace within a chunk using regex', function (done) {
      var haystack = [
        '<!DOCTYPE html>',
        '<html>',
        ' <head>',
        '   <title>Test</title>',
        ' </head>',
        ' <body>',
        '   <h1>Head</h1>',
        ' </body>',
        '</html>'
      ].join('\n');

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream(/<\/head>/, inject + '</head>');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        expect(acc).to.include(inject);
        done();
      });

      replace.write(haystack);
      replace.end();
    });

    it('should be able to replace between chunks using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </head>',
          ' <body>',
          '   <h1>I love feeeee'
        ].join('\n'),
        [      'eeeeeeeeeed</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var replace = replaceStream(/fe+d/, 'foooooooood');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        expect(acc).to.include('foooooooood');
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to handle no matches using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </de'
        ].join('\n'),
        [      'ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream(/<\/head>/, inject + '</head>');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        expect(acc).to.not.include(inject);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to handle dangling tails using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </he'
        ].join('\n')
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
      var replace = replaceStream(/<\/head>/, inject + '</head>');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        expect(acc).to.include('</he');
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to handle multiple searches and replaces using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var acc = '';
        var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
        var replace = replaceStream(/<\/p>/g, ', world</p>');
        replace.on('data', function (data) {
          acc += data;
        });
        replace.on('end', function () {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1, world</p>',
            ' <p> Hello 2, world</p>',
            ' <p> Hello 3, world</p>',
            ' <p> Hello 4, world</p>',
            ' <p> Hello 5, world</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(acc).to.equal(expected);
          done();
        });

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should be able to handle a limited searches and replaces using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var acc = '';
        var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
        var replace = replaceStream(/<\/p>/g, ', world</p>', { limit: 3 });
        replace.on('data', function (data) {
          acc += data;
        });
        replace.on('end', function () {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1, world</p>',
            ' <p> Hello 2, world</p>',
            ' <p> Hello 3, world</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(acc).to.equal(expected);
          done();
        });

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should be able to customize the regexp options using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1</P>',
            ' <P> Hello 2</'
          ].join('\n'),
          [               'P>',
            ' <P> Hello 3</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var acc = '';
        var inject = script(fs.readFileSync('./test/fixtures/inject.js'));
        var replace = replaceStream(/<\/P>/, ', world</P>', { regExpOptions: 'gm' });
        replace.on('data', function (data) {
          acc += data;
        });
        replace.on('end', function () {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <P> Hello 1, world</P>',
            ' <P> Hello 2, world</P>',
            ' <P> Hello 3, world</P>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(acc).to.equal(expected);
          done();
        });

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

    it('should replace characters specified and not modify partial matches using regex', function (done) {
      var haystack = [
        'ab',
        'a',
        'a',
        'b'
      ].join('\n');

      var acc = '';
      var replace = replaceStream('ab','Z');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
          var expected = [
          'Z',
          'a',
          'a',
          'b'
        ].join('\n');

        expect(acc).to.equal(expected);
        done();
      });

      replace.write(haystack);
      replace.end();
    });

    it('should handle partial matches between complete matches using regex', function (done) {
      var haystack = [
        "ab",
        'a',
        'ab',
        'b'
      ].join('\n');

      var acc = '';
      var replace = replaceStream(/ab/g,'Z');

      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
          var expected = [
          'Z',
          'a',
          'Z',
          'b'
        ].join('\n');

        expect(acc).to.equal(expected);
        done();
      });

      replace.write(haystack);
      replace.end();
    });

    it('should only replace characters specified using regex', function (done) {
      var haystack = [
        'ab',
        'a',
        'b'
      ].join('\n');

      var acc = '';
      var replace = replaceStream(/ab/,'Z');
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
          var expected = [
          'Z',
          'a',
          'b'
        ].join('\n');

        expect(acc).to.equal(expected);
        done();
      });

      replace.write(haystack);
      replace.end();
    });

    it('should be able to use a replace function using regex', function (done) {
      var haystacks = [
        [ '<!DOCTYPE html>',
          '<html>',
          ' <head>',
          '   <title>Test</title>',
          ' </he'
        ].join('\n'),
        [      'ad>',
          ' <body>',
          '   <h1>Head</h1>',
          ' </body>',
          '</html>'
        ].join('\n'),
      ];

      var acc = '';
      var inject = script(fs.readFileSync('./test/fixtures/inject.js'));

      function replaceFn(match, p1, offset, string) {
        expect(match).to.equal('</head>');
        expect(p1).to.equal('head');
        expect(offset).to.equal(55);
        expect(string).to.equal(haystacks.join(''));
        return inject + '</head>';
      }

      var replace = replaceStream(/<\/(head)>/, replaceFn);
      replace.on('data', function (data) {
        acc += data;
      });
      replace.on('end', function () {
        expect(acc).to.include(inject);
        done();
      });

      haystacks.forEach(function (haystack) {
        replace.write(haystack);
      });

      replace.end();
    });

    it('should be able to change each replacement value with a function using regex',
      function (done) {
        var haystacks = [
          [ '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hello 1</p>',
            ' <p> Hello 2</'
          ].join('\n'),
          [               'p>',
            ' <p> Hello 3</p>',
            ' <p> Hello 4</p>',
            ' <p> Hello 5</p>',
            ' </body>',
            '</html>'
          ].join('\n'),
        ];

        var acc = '';

        var greetings = ['Hi', 'Hey', 'Gday', 'Bonjour', 'Greetings'];
        function replaceFn(match) {
          return greetings.shift();
        }

        var replace = replaceStream(/Hello/g, replaceFn);
        replace.on('data', function (data) {
          acc += data;
        });
        replace.on('end', function () {
          var expected = [
            '<!DOCTYPE html>',
            '<html>',
            ' <head>',
            '   <title>Test</title>',
            ' </head>',
            ' <body>',
            ' <p> Hi 1</p>',
            ' <p> Hey 2</p>',
            ' <p> Gday 3</p>',
            ' <p> Bonjour 4</p>',
            ' <p> Greetings 5</p>',
            ' </body>',
            '</html>'
          ].join('\n');
          expect(acc).to.equal(expected);
          done();
        });

        haystacks.forEach(function (haystack) {
          replace.write(haystack);
        });

        replace.end();
      });

      it('should be able to replace captures using $1 notation', function (done) {
        var haystack = [
          "ab",
          'a',
          'ab',
          'b'
        ].join('\n');

        var acc = '';
        var replace = replaceStream(/(a)(b)/g,'this is $1 and this is $2');

        replace.on('data', function (data) {
          acc += data;
        });
        replace.on('end', function () {
            var expected = [
            'this is a and this is b',
            'a',
            'this is a and this is b',
            'b'
          ].join('\n');

          expect(acc).to.equal(expected);
          done();
        });

        replace.write(haystack);
        replace.end();
      })
});
